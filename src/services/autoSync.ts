/**
 * Automatic Sync Service
 * 
 * This service automatically syncs SQLite data to Firestore when:
 * 1. User goes online
 * 2. App comes to foreground
 * 3. Data changes occur
 * 
 * CRITICAL: Ensures SQLite and Firestore stay in sync with same user IDs
 */

import { getDatabase } from './database';
import {
  syncUserToSupabase,
  syncNotesToSupabase,
  isOnline,
  UserData,
  NoteData,
} from './supabase/database';
import { getCurrentUserId } from './supabase/auth';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';

let syncInProgress = false;
let lastSyncTime = 0;
const MIN_SYNC_INTERVAL = 30000; // 30 seconds minimum between syncs

/**
 * Sync all user data from SQLite to Supabase
 * This is the main sync function
 */
export const syncAllUserData = async (): Promise<void> => {
  // Prevent concurrent syncs
  if (syncInProgress) {
    console.log('[AutoSync] Sync already in progress, skipping...');
    return;
  }

  // Rate limiting - don't sync too frequently
  const now = Date.now();
  if (now - lastSyncTime < MIN_SYNC_INTERVAL) {
    console.log('[AutoSync] Too soon since last sync, skipping...');
    return;
  }

  // Check if online
  const online = await isOnline();
  if (!online) {
    console.log('[AutoSync] Offline, skipping sync');
    return;
  }

  syncInProgress = true;
  lastSyncTime = now;

  try {
    console.log('[AutoSync] Starting full sync...');
    
    // Get Supabase user ID
    const userId = getCurrentUserId();
    console.log('[AutoSync] Syncing data for user:', userId);

    const db = getDatabase();

    // 1. Sync user data
    const user: any = await db.getFirstAsync(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (user) {
      const userData: UserData = {
        referral_code: user.referral_code,
        credits: user.credits || 0,
        created_at: user.created_at,
        used_referral_code: user.used_referral_code || null,
      };

      await syncUserToSupabase(userId, userData);
      console.log('[AutoSync] User data synced');
    }

    // 2. Sync all notes (if you have a notes table)
    // Add this when you have notes implementation
    // const notes = await db.getAllAsync('SELECT * FROM notes WHERE user_id = ?', [userId]);
    // if (notes && notes.length > 0) {
    //   const noteData: NoteData[] = notes.map(note => ({
    //     id: note.id,
    //     user_id: userId,
    //     title: note.title,
    //     content: note.content,
    //     source: note.source,
    //     created_at: note.created_at,
    //     updated_at: note.updated_at,
    //   }));
    //   await syncNotesToFirestore(noteData);
    //   console.log(`[AutoSync] ${noteData.length} notes synced`);
    // }

    // 3. Sync other data types here (flashcards, quiz progress, etc.)
    // Add as needed when tables are created

    console.log('[AutoSync] Full sync completed successfully');
  } catch (error) {
    console.error('[AutoSync] Sync error:', error);
  } finally {
    syncInProgress = false;
  }
};

/**
 * Initialize auto-sync listeners
 * Call this once on app startup
 */
export const initializeAutoSync = (): (() => void) => {
  console.log('[AutoSync] Initializing auto-sync listeners...');

  // 1. Listen to network state changes
  const unsubscribeNetwork = NetInfo.addEventListener((state: NetInfoState) => {
    if (state.isConnected) {
      console.log('[AutoSync] Network connected, triggering sync...');
      // Small delay to ensure connection is stable
      setTimeout(() => {
        syncAllUserData().catch(err => 
          console.error('[AutoSync] Network sync failed:', err)
        );
      }, 1000);
    }
  });

  // 2. Listen to app state changes (foreground/background)
  const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      console.log('[AutoSync] App became active, triggering sync...');
      syncAllUserData().catch(err => 
        console.error('[AutoSync] App state sync failed:', err)
      );
    }
  });

  // 3. Initial sync on startup
  console.log('[AutoSync] Performing initial sync...');
  setTimeout(() => {
    syncAllUserData().catch(err => 
      console.error('[AutoSync] Initial sync failed:', err)
    );
  }, 2000); // Wait 2 seconds for app to initialize

  // Return cleanup function
  return () => {
    console.log('[AutoSync] Cleaning up auto-sync listeners');
    unsubscribeNetwork();
    appStateSubscription.remove();
  };
};

/**
 * Force sync now (for manual triggers)
 * Bypasses rate limiting
 */
export const forceSyncNow = async (): Promise<void> => {
  console.log('[AutoSync] Force sync triggered');
  lastSyncTime = 0; // Reset rate limit
  await syncAllUserData();
};

/**
 * Sync specific user data (lightweight)
 */
export const syncUserDataOnly = async (): Promise<void> => {
  try {
    const online = await isOnline();
    if (!online) {
      console.log('[AutoSync] Offline, skipping user sync');
      return;
    }

    const userId = getCurrentUserId();
    const db = getDatabase();

    const user: any = await db.getFirstAsync(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (user) {
      const userData: UserData = {
        referral_code: user.referral_code,
        credits: user.credits || 0,
        created_at: user.created_at,
        used_referral_code: user.used_referral_code || null,
      };

      await syncUserToSupabase(userId, userData);
      console.log('[AutoSync] User data synced (lightweight)');
    }
  } catch (error) {
    console.error('[AutoSync] User sync error:', error);
  }
};

/**
 * Check sync status
 */
export const getSyncStatus = (): {
  inProgress: boolean;
  lastSyncTime: number;
  nextSyncAvailable: number;
} => {
  const now = Date.now();
  const timeSinceLastSync = now - lastSyncTime;
  const timeUntilNextSync = Math.max(0, MIN_SYNC_INTERVAL - timeSinceLastSync);

  return {
    inProgress: syncInProgress,
    lastSyncTime,
    nextSyncAvailable: now + timeUntilNextSync,
  };
};
