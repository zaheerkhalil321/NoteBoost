/**
 * Optimized Sync Service - Simplified Version
 * 
 * HOW IT WORKS:
 * 1. Instead of syncing immediately, we add changes to a queue
 * 2. We wait 2 seconds (in case more changes come) then sync everything at once
 * 3. If offline, we keep items in queue and sync when back online
 * 4. One sync call handles all recent changes (saves network calls)
 */

import { getDatabase } from './database';
import {
  syncUserToSupabase,
  isOnline,
  UserData,
} from './supabase/database';
import { getCurrentUserId } from './supabase/auth';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';

// ============================================
// STEP 1: Setup - What we track
// ============================================

// Simple flag: Are we currently syncing?
let isSyncing = false;

// Queue: List of changes waiting to sync
let changesWaitingToSync: string[] = [];

// Timer: Wait a bit before syncing (in case more changes come)
let waitTimer: NodeJS.Timeout | null = null;

// Config: How long to wait before syncing
const WAIT_TIME_MS = 2000; // 2 seconds

// ============================================
// STEP 2: Add Change to Queue
// ============================================

/**
 * Call this when data changes (user, referral, etc.)
 * Instead of syncing immediately, we add it to queue
 */
export const queueSync = (changeType: 'user' | 'referral' | 'full'): void => {
  // Add this change to the queue
  changesWaitingToSync.push(changeType);
  
  console.log(`[Sync] Added "${changeType}" to queue (${changesWaitingToSync.length} changes waiting)`);

  // Cancel previous timer (if user is making multiple changes quickly)
  if (waitTimer) {
    clearTimeout(waitTimer);
  }

  // Start new timer: "Wait 2 seconds, then sync everything"
  waitTimer = setTimeout(() => {
    syncNow();
  }, WAIT_TIME_MS);
};

// ============================================
// STEP 3: Actually Sync the Data
// ============================================

/**
 * This does the actual syncing to Firebase
 * It reads the latest data from SQLite and sends to Firestore
 */
const syncNow = async (): Promise<void> => {
  // If already syncing, skip silently (don't log spam)
  if (isSyncing) {
    return;
  }

  // If queue is empty, nothing to do
  if (changesWaitingToSync.length === 0) {
    return;
  }

  // Check if we have internet
  const online = await isOnline();
  if (!online) {
    console.log('[Sync] Offline, will sync when back online');
    return; // Keep items in queue, will sync when online
  }

  // Start syncing
  isSyncing = true;
  const changeCount = changesWaitingToSync.length;
  changesWaitingToSync = []; // Clear queue

  try {
    console.log(`[Sync] 🔄 Syncing ${changeCount} changes...`);
    
    // Get user ID and database
    const userId = getCurrentUserId();
    const db = getDatabase();

    // Get latest user data from SQLite (includes ALL recent changes)
    const user: any = await db.getFirstAsync(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (user) {
      // Prepare data for Firestore
      const userData: UserData = {
        referral_code: user.referral_code,
        credits: user.credits || 0,
        created_at: user.created_at,
        used_referral_code: user.used_referral_code || null,
      };

      // Send to Supabase (ONE call for all changes)
      await syncUserToSupabase(userId, userData);
      console.log('[Sync] ✅ Successfully synced to Supabase');
    }
  } catch (error) {
    console.error('[Sync] ❌ Error:', error);
    // If sync failed, add one item back to queue to retry later
    changesWaitingToSync.push('user');
  } finally {
    isSyncing = false;
  }
};

// ============================================
// STEP 4: Auto Sync Triggers
// ============================================

/**
 * Start automatic syncing
 * This sets up listeners that sync when:
 * - Internet comes back online
 * - User returns to app
 * - Every minute (if there are changes)
 */
export const initializeOptimizedSync = (): (() => void) => {
  console.log('[Sync] Starting automatic sync...');

  // TRIGGER 1: When internet comes back
  const stopNetworkListener = NetInfo.addEventListener((state) => {
    if (state.isConnected && changesWaitingToSync.length > 0) {
      console.log('[Sync] Internet back! Syncing now...');
      if (waitTimer) clearTimeout(waitTimer); // Don't wait, sync immediately
      syncNow();
    }
  });

  // TRIGGER 2: When user returns to app
  const stopAppListener = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active' && changesWaitingToSync.length > 0) {
      console.log('[Sync] App opened! Syncing...');
      syncNow();
    }
  });

  // TRIGGER 3: Every 5 minutes (if there are changes waiting AND not syncing)
  const periodicCheck = setInterval(() => {
    if (changesWaitingToSync.length > 0 && !isSyncing) {
      console.log('[Sync] ⏰ Periodic sync (5 min check)');
      syncNow();
    }
  }, 5 * 60 * 1000); // 5 minutes

  // TRIGGER 4: Initial sync when app starts (wait 5 seconds first)
  setTimeout(() => {
    console.log('[Sync] 🚀 Initial sync after app start...');
    queueSync('full');
  }, 5000); // Wait 5 seconds for app to fully load

  // Return cleanup function (called when app closes)
  return () => {
    console.log('[Sync] Stopping automatic sync...');
    stopNetworkListener();
    stopAppListener.remove();
    clearInterval(periodicCheck);
    if (waitTimer) clearTimeout(waitTimer);
  };
};

// ============================================
// STEP 5: Helper Functions
// ============================================

/**
 * Force sync immediately (don't wait)
 * Use this when you need to sync right now
 */
export const forceSyncNow = async (): Promise<void> => {
  console.log('[Sync] Force sync requested');
  if (waitTimer) clearTimeout(waitTimer);
  await syncNow();
};

/**
 * Check sync status (for debugging)
 */
export const getSyncStatus = () => {
  return {
    isSyncing: isSyncing,
    changesWaiting: changesWaitingToSync.length,
  };
};
