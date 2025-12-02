import revenueCatService from './revenueCat';
import { getUserCredits, useCredits as spendCredits, createOrGetUser } from './referralService';
import * as SecureStore from 'expo-secure-store';
import { getCurrentUserId, initializeAnonymousAuth } from './firebase/auth';

const USER_ID_KEY = 'user_id';

/**
 * Service to manage note creation access through subscriptions or credits
 *
 * 1 credit = 1 note with ALL AI features:
 * - AI-generated summary
 * - Key points extraction
 * - Flashcards
 * - Quiz generation
 * - AI chat capability
 * - Visual content (diagrams, charts)
 * - Tables and structured data
 */

export interface NoteAccessStatus {
  canCreate: boolean;
  hasSubscription: boolean;
  credits: number;
  reason?: string;
}

/**
 * Get user ID from Firebase Auth (single source of truth)
 * Falls back to createOrGetUser if needed
 */
const getUserId = async (): Promise<string | null> => {
  try {
    // Try to get Firebase Auth user ID
    try {
      const userId = getCurrentUserId();
      console.log('[NoteAccess] Using Firebase Auth user ID:', userId);
      return userId;
    } catch (error) {
      // Firebase not initialized yet, create/get user which will initialize it
      console.log('[NoteAccess] Firebase not ready, creating/getting user...');
      const user = await createOrGetUser();
      return user.id;
    }
  } catch (error) {
    console.error('[NoteAccess] Error getting user ID:', error);
    return null;
  }
};

/**
 * Check if user can create a note (either has subscription OR has credits)
 */
export const checkNoteAccess = async (): Promise<NoteAccessStatus> => {
  try {
    // First check if user has active subscription
    const hasSubscription = await revenueCatService.isUserSubscribed();

    if (hasSubscription) {
      return {
        canCreate: true,
        hasSubscription: true,
        credits: 0, // Credits not needed with subscription
      };
    }

    // No subscription, check credits
    const userId = await getUserId();
    if (!userId) {
      return {
        canCreate: false,
        hasSubscription: false,
        credits: 0,
        reason: 'User not found',
      };
    }

    const credits = await getUserCredits(userId);

    if (credits > 0) {
      return {
        canCreate: true,
        hasSubscription: false,
        credits,
      };
    }

    // No subscription and no credits
    return {
      canCreate: false,
      hasSubscription: false,
      credits: 0,
      reason: 'No active subscription or credits available',
    };
  } catch (error) {
    console.error('[NoteAccess] Error checking note access:', error);
    return {
      canCreate: false,
      hasSubscription: false,
      credits: 0,
      reason: 'Error checking access',
    };
  }
};

/**
 * Consume access for creating a note (deduct 1 credit if no subscription)
 * Should be called AFTER successful note creation
 */
export const consumeNoteAccess = async (): Promise<{
  success: boolean;
  error?: string;
  remainingCredits?: number;
}> => {
  try {
    // Check if user has subscription
    const hasSubscription = await revenueCatService.isUserSubscribed();

    if (hasSubscription) {
      // Subscription users don't use credits
      return { success: true };
    }

    // No subscription, use 1 credit
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: 'User not found' };
    }

    const result = await spendCredits(userId, 1);

    if (result.success) {
      console.log('[NoteAccess] 1 credit consumed. Remaining:', result.remainingCredits);
      return {
        success: true,
        remainingCredits: result.remainingCredits
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to use credit'
      };
    }
  } catch (error: any) {
    console.error('[NoteAccess] Error consuming note access:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
};

/**
 * Get user's current credit balance
 */
export const getCurrentCredits = async (): Promise<number> => {
  try {
    const userId = await getUserId();
    if (!userId) return 0;
    return await getUserCredits(userId);
  } catch (error) {
    console.error('[NoteAccess] Error getting credits:', error);
    return 0;
  }
};
