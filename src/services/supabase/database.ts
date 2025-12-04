import { getSupabaseClient } from './config';
import { getCurrentUserId } from './auth';
import NetInfo from '@react-native-community/netinfo';

/**
 * Supabase Tables Structure:
 * 
 * users (user_id as primary key)
 *   - user_id: uuid (primary key, matches auth.users.id)
 *   - referral_code: text (unique)
 *   - credits: integer
 *   - created_at: timestamptz
 *   - used_referral_code: text (nullable)
 *   - email: text (nullable)
 *   - name: text (nullable)
 *   - synced_at: timestamptz
 * 
 * referral_codes (code as primary key)
 *   - code: text (primary key)
 *   - user_id: uuid (foreign key to users)
 *   - created_at: timestamptz
 * 
 * notes
 *   - id: uuid (primary key)
 *   - user_id: uuid (foreign key to users)
 *   - title: text
 *   - content: text
 *   - source: text (text, audio, youtube, document, image)
 *   - created_at: timestamptz
 *   - updated_at: timestamptz
 *   - synced_at: timestamptz
 */

// Check if device is online
export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

// ============================================
// USER SYNC
// ============================================

export interface UserData {
  referral_code: string;
  credits: number;
  created_at: number;
  used_referral_code?: string | null;
  email?: string | null;
  name?: string | null;
}

/**
 * Sync user data to Supabase
 * This is called after SQLite operations
 */
export const syncUserToSupabase = async (userId: string, userData: UserData): Promise<void> => {
  try {
    if (!(await isOnline())) {
      console.log('[Supabase] Offline, skipping user sync');
      return;
    }

    const supabase = getSupabaseClient();
    
    // 1. Upsert user document
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        user_id: userId,
        referral_code: userData.referral_code,
        credits: userData.credits,
        created_at: new Date(userData.created_at).toISOString(),
        used_referral_code: userData.used_referral_code || null,
        email: userData.email || null,
        name: userData.name || null,
        synced_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (userError) {
      console.error('[Supabase] User sync error:', userError);
      return;
    }

    // 2. Create lookup entry for referral code (O(1) lookup instead of query!)
    if (userData.referral_code) {
      const { error: codeError } = await supabase
        .from('referral_codes')
        .upsert({
          code: userData.referral_code,
          user_id: userId,
          created_at: new Date(userData.created_at || Date.now()).toISOString(),
        }, {
          onConflict: 'code'
        });

      if (codeError) {
        console.error('[Supabase] Referral code sync error:', codeError);
      }
    }

    console.log('[Supabase] User synced:', userId);
  } catch (error) {
    console.error('[Supabase] User sync error:', error);
    // Don't throw - let the app continue with local data
  }
};

/**
 * Get user data from Supabase
 */
export const getUserFromSupabase = async (userId: string): Promise<UserData | null> => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[Supabase] Get user error:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      referral_code: data.referral_code,
      credits: data.credits,
      created_at: new Date(data.created_at).getTime(),
      used_referral_code: data.used_referral_code,
      email: data.email,
      name: data.name,
    };
  } catch (error) {
    console.error('[Supabase] Get user error:', error);
    return null;
  }
};

/**
 * Query Supabase for a user by referral code
 * Uses optimized lookup table for O(1) performance
 */
export const getUserByReferralCode = async (referralCode: string): Promise<{ id: string; data: UserData } | null> => {
  try {
    if (!(await isOnline())) {
      console.log('[Supabase] Offline, cannot lookup referral code');
      return null;
    }

    const supabase = getSupabaseClient();

    // Step 1: Direct O(1) lookup in referral_codes table
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', referralCode)
      .single();

    if (codeError && codeError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[Supabase] Referral code lookup error:', codeError);
    }

    if (codeData?.user_id) {
      // Step 2: Get full user data using user_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', codeData.user_id)
        .single();

      if (userError) {
        console.error('[Supabase] User fetch error:', userError);
        return null;
      }

      if (userData) {
        return {
          id: userData.user_id,
          data: {
            referral_code: userData.referral_code,
            credits: userData.credits,
            created_at: new Date(userData.created_at).getTime(),
            used_referral_code: userData.used_referral_code,
            email: userData.email,
            name: userData.name,
          },
        };
      }
    }

    // Step 3: Fallback - query users table directly (backwards compatibility)
    console.log('[Supabase] Trying fallback query...');
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('referral_code', referralCode)
      .limit(1);

    if (queryError) {
      console.error('[Supabase] Fallback query error:', queryError);
      return null;
    }

    if (users && users.length > 0) {
      const user = users[0];
      
      // Auto-migrate: Create lookup entry for next time
      await supabase
        .from('referral_codes')
        .upsert({
          code: referralCode,
          user_id: user.user_id,
          created_at: user.created_at,
        }, {
          onConflict: 'code'
        });

      console.log('[Supabase] Migrated referral code to lookup table');

      return {
        id: user.user_id,
        data: {
          referral_code: user.referral_code,
          credits: user.credits,
          created_at: new Date(user.created_at).getTime(),
          used_referral_code: user.used_referral_code,
          email: user.email,
          name: user.name,
        },
      };
    }

    console.log('[Supabase] User not found for code:', referralCode);
    return null;
  } catch (error) {
    console.error('[Supabase] getUserByReferralCode error:', error);
    return null;
  }
};

// ============================================
// NOTES SYNC
// ============================================

export interface NoteData {
  id: string;
  user_id: string;
  title: string;
  content: string;
  source: 'text' | 'audio' | 'youtube' | 'document' | 'image';
  created_at: number;
  updated_at: number;
}

/**
 * Sync single note to Supabase
 */
export const syncNoteToSupabase = async (note: NoteData): Promise<void> => {
  try {
    if (!(await isOnline())) {
      console.log('[Supabase] Offline, note will sync later');
      return;
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('notes')
      .upsert({
        id: note.id,
        user_id: note.user_id,
        title: note.title,
        content: note.content,
        source: note.source,
        created_at: new Date(note.created_at).toISOString(),
        updated_at: new Date(note.updated_at).toISOString(),
        synced_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('[Supabase] Note sync error:', error);
      return;
    }

    console.log('[Supabase] Note synced:', note.id);
  } catch (error) {
    console.error('[Supabase] Note sync error:', error);
  }
};

/**
 * Sync multiple notes to Supabase (batch operation)
 */
export const syncNotesToSupabase = async (notes: NoteData[]): Promise<void> => {
  try {
    if (!(await isOnline())) {
      console.log('[Supabase] Offline, notes will sync later');
      return;
    }

    const supabase = getSupabaseClient();

    const notesData = notes.map(note => ({
      id: note.id,
      user_id: note.user_id,
      title: note.title,
      content: note.content,
      source: note.source,
      created_at: new Date(note.created_at).toISOString(),
      updated_at: new Date(note.updated_at).toISOString(),
      synced_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('notes')
      .upsert(notesData, {
        onConflict: 'id'
      });

    if (error) {
      console.error('[Supabase] Batch note sync error:', error);
      return;
    }

    console.log(`[Supabase] ${notes.length} notes synced`);
  } catch (error) {
    console.error('[Supabase] Batch note sync error:', error);
  }
};

/**
 * Get all notes for a user from Supabase
 */
export const getNotesFromSupabase = async (userId: string): Promise<NoteData[]> => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Get notes error:', error);
      return [];
    }

    const notes: NoteData[] = (data || []).map(note => ({
      id: note.id,
      user_id: note.user_id,
      title: note.title,
      content: note.content,
      source: note.source,
      created_at: new Date(note.created_at).getTime(),
      updated_at: new Date(note.updated_at).getTime(),
    }));

    console.log(`[Supabase] Retrieved ${notes.length} notes`);
    return notes;
  } catch (error) {
    console.error('[Supabase] Get notes error:', error);
    return [];
  }
};

/**
 * Delete note from Supabase
 */
export const deleteNoteFromSupabase = async (noteId: string): Promise<void> => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('[Supabase] Delete note error:', error);
      return;
    }

    console.log('[Supabase] Note deleted:', noteId);
  } catch (error) {
    console.error('[Supabase] Delete note error:', error);
  }
};

// Export all functions
export {
  syncUserToSupabase as syncUserToFirestore, // Keep old name for compatibility
  syncNotesToSupabase as syncNotesToFirestore, // Keep old name for compatibility
};
