import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase Configuration
 * 
 * IMPORTANT: Replace these with your actual Supabase credentials
 * Get them from: https://app.supabase.com/project/_/settings/api
 */

// Supabase client instance
let supabase: SupabaseClient | null = null;

/**
 * Initialize Supabase client with AsyncStorage for session persistence
 * This ensures auth sessions persist across app restarts
 */
export const initializeSupabase = async (): Promise<SupabaseClient> => {
  try {
    if (supabase) {
      console.log('[Supabase] ✅ Already initialized');
      return supabase;
    }

    // Create Supabase client with AsyncStorage for auth persistence
    supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    console.log('[Supabase] ✅ Client initialized');
    return supabase;
  } catch (error) {
    console.error('[Supabase] ❌ Initialization error:', error);
    throw error;
  }
};

/**
 * Get Supabase client instance
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase not initialized. Call initializeSupabase() first.');
  }
  return supabase;
};

// Export config for reference
export const supabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};
