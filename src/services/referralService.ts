import * as SecureStore from 'expo-secure-store';
import { getDatabase } from './database';
import {
  logReferralCodeGenerated,
  logReferralRedemptionAttempt,
  logReferralRedeemed,
  logReferralCycleCompleted,
  logReferralMaxCyclesReached,
  logCreditsUsed,
  logCreditBalanceChange,
} from './firebaseAnalytics';
import { getCurrentUserId, initializeAnonymousAuth } from './firebase/auth';
import { queueSync } from './optimizedSync';
import { getUserByReferralCode } from './firebase/firestore';

const USER_ID_KEY = 'user_id';

// Generate a 6-character referral code: 3 numbers + 3 letters (e.g., "123ABC")
export const generateReferralCode = (): string => {
  const numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const letters = Array.from({ length: 3 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
  return numbers + letters;
};

/**
 * Get user ID from Firebase Auth
 * This ensures SQLite and Firebase use the SAME user ID
 * CRITICAL: This is the single source of truth for user identity
 */
const getUserId = async (): Promise<string> => {
  try {
    // Try to get Firebase user ID first
    let userId = getCurrentUserId();
    
    // Cache it in SecureStore for offline access
    await SecureStore.setItemAsync(USER_ID_KEY, userId);
    
    console.log('[ReferralService] Using Firebase Auth user ID:', userId);
    return userId;
  } catch (error) {
    // If Firebase Auth fails, try cached ID
    console.warn('[ReferralService] Firebase Auth not available, checking cache');
    const cachedUserId = await SecureStore.getItemAsync(USER_ID_KEY);
    
    if (cachedUserId) {
      console.log('[ReferralService] Using cached user ID:', cachedUserId);
      return cachedUserId;
    }
    
    // If no cached ID, initialize Firebase Auth now
    console.log('[ReferralService] No cached ID, initializing Firebase Auth');
    const user = await initializeAnonymousAuth();
    await SecureStore.setItemAsync(USER_ID_KEY, user.uid);
    console.log('[ReferralService] Created new Firebase user:', user.uid);
    return user.uid;
  }
};

// Create or get user with referral code
export const createOrGetUser = async (): Promise<{
  id: string;
  referralCode: string;
  credits: number;
}> => {
  const db = getDatabase();
  const userId = await getUserId(); // This now uses Firebase Auth UID

  // Check if user exists in SQLite
  const existingUser = await db.getFirstAsync<any>(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (existingUser) {
    console.log('[ReferralService] User exists in SQLite:', userId);
    
    // Queue sync in background (debounced, batched)
    queueSync('user');
    
    return {
      id: existingUser.id,
      referralCode: existingUser.referral_code,
      credits: existingUser.credits || 0,
    };
  }

  console.log('[ReferralService] Creating new user in SQLite:', userId);

  // Create new user with unique referral code
  let referralCode = generateReferralCode();
  let attempts = 0;

  // Ensure code is unique
  while (attempts < 10) {
    const existing = await db.getFirstAsync<any>(
      'SELECT id FROM users WHERE referral_code = ?',
      [referralCode]
    );

    if (!existing) break;
    referralCode = generateReferralCode();
    attempts++;
  }

  const createdAt = Date.now();

  // Insert into SQLite
  await db.runAsync(
    'INSERT INTO users (id, referral_code, credits, created_at) VALUES (?, ?, ?, ?)',
    [userId, referralCode, 0, createdAt]
  );

  console.log('[ReferralService] User created in SQLite with code:', referralCode);

  // Track referral code generation in Firebase Analytics
  await logReferralCodeGenerated(userId, referralCode);

  // Queue sync to Firestore (optimized, batched)
  queueSync('user');

  console.log('[ReferralService] User synced to Firestore:', userId);

  return {
    id: userId,
    referralCode,
    credits: 0,
  };
};

// Redeem a referral code
export const redeemReferralCode = async (
  refereeId: string,
  referralCode: string
): Promise<{ success: boolean; error?: string; creditAwarded?: number }> => {
  const db = getDatabase();

  try {
    // SAFEGUARD 1: Check if referee already redeemed a code
    const referee = await db.getFirstAsync<any>(
      'SELECT used_referral_code, credits FROM users WHERE id = ?',
      [refereeId]
    );
    const wholeUserData= await db.getFirstAsync<any>(
      'SELECT * FROM users WHERE id = ?',
      [refereeId]
    );
    console.log('referee data:', referee, wholeUserData, referralCode);

    if (referee?.used_referral_code) {
      await logReferralRedemptionAttempt(refereeId, referralCode, false, 'already_used_code');
      return { success: false, error: 'You have already used a referral code' };
    }

    // SAFEGUARD 2: Validate referral code format (3 numbers + 3 letters)
    if (!/^[0-9]{3}[A-Z]{3}$/.test(referralCode)) {
      await logReferralRedemptionAttempt(refereeId, referralCode, false, 'invalid_format');
      return { success: false, error: 'Invalid referral code format' };
    }

    // SAFEGUARD 3: Find the referrer by code
    // First, try local SQLite database
    let referrer: any = await db.getFirstAsync(
      'SELECT id, referral_code FROM users WHERE referral_code = ?',
      [referralCode]
    );

    // If not found locally, try Firestore (cross-device referral)
    if (!referrer) {
      console.log('[ReferralService] Code not found locally, checking Firestore...');
      const firestoreUser = await getUserByReferralCode(referralCode);
      
      if (firestoreUser) {
        console.log('[ReferralService] Found referrer in Firestore:', firestoreUser.id);
        
        // Insert the referrer into local SQLite so we can track the referral
        await db.runAsync(
          'INSERT OR IGNORE INTO users (id, referral_code, credits, created_at) VALUES (?, ?, ?, ?)',
          [firestoreUser.id, firestoreUser.data.referral_code, firestoreUser.data.credits || 0, firestoreUser.data.created_at || Date.now()]
        );
        
        referrer = { id: firestoreUser.id, referral_code: firestoreUser.data.referral_code };
        console.log('[ReferralService] Referrer added to local DB:', referrer);
      }
    }

    if (!referrer) {
      await logReferralRedemptionAttempt(refereeId, referralCode, false, 'code_not_found');
      return { success: false, error: 'Invalid referral code' };
    }

    // SAFEGUARD 4: Prevent self-referral
    if (referrer.id === refereeId) {
      await logReferralRedemptionAttempt(refereeId, referralCode, false, 'self_referral');
      return { success: false, error: 'You cannot use your own referral code' };
    }

    // SAFEGUARD 5: Get referee's referral code and verify user exists
    const refereeData: any = await db.getFirstAsync(
      'SELECT referral_code FROM users WHERE id = ?',
      [refereeId]
    );

    if (!refereeData) {
      await logReferralRedemptionAttempt(refereeId, referralCode, false, 'user_not_found');
      return { success: false, error: 'User not found' };
    }

    // SAFEGUARD 6: Check if this referee_id already exists in referrals table
    // (database has UNIQUE constraint, but double-check in code)
    const existingReferral: any = await db.getFirstAsync(
      'SELECT id FROM referrals WHERE referee_id = ?',
      [refereeId]
    );

    if (existingReferral) {
      await logReferralRedemptionAttempt(refereeId, referralCode, false, 'referral_already_used');
      return { success: false, error: 'Referral code already used' };
    }

    // All checks passed! Process the referral with a transaction for atomicity
    await db.execAsync('BEGIN TRANSACTION');

    try {
      // Mark code as used by referee and award 1 welcome credit
      await db.runAsync(
        'UPDATE users SET used_referral_code = ?, credits = credits + 1 WHERE id = ?',
        [referralCode, refereeId]
      );

      // Create referral record
      await db.runAsync(
        'INSERT INTO referrals (referrer_code, referee_id, referee_code, created_at, status) VALUES (?, ?, ?, ?, ?)',
        [referralCode, refereeId, refereeData.referral_code, Date.now(), 'completed']
      );

      // Track successful redemption in Firebase
      await logReferralRedemptionAttempt(refereeId, referralCode, true);
      await logReferralRedeemed(refereeId, referrer.id, referralCode, 1);

      // Get referrer's current referral count
      const referralCount: any = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM referrals WHERE referrer_code = ? AND status = ?',
        [referralCode, 'completed']
      );

      const count = referralCount?.count || 0;

      // Get total number of completed cycles (rewarded referrals / 3)
      const rewardedCount: any = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM referrals WHERE referrer_code = ? AND status = ?',
        [referralCode, 'rewarded']
      );

      const completedCycles = Math.floor((rewardedCount?.count || 0) / 3);
      const MAX_CYCLES = 5;

      // Get total referrals for analytics
      const totalReferralsResult: any = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM referrals WHERE referrer_code = ?',
        [referralCode]
      );
      const totalReferrals = totalReferralsResult?.count || 0;

      // If reached 3 referrals and haven't hit max cycles, award 5 credits
      if (count === 3 && completedCycles < MAX_CYCLES) {
        await db.runAsync(
          'UPDATE users SET credits = credits + 5 WHERE referral_code = ?',
          [referralCode]
        );

        // Archive these referrals by marking them as 'rewarded'
        await db.runAsync(
          'UPDATE referrals SET status = ? WHERE referrer_code = ? AND status = ?',
          ['rewarded', referralCode, 'completed']
        );

        // Track cycle completion in Firebase
        await logReferralCycleCompleted(
          referrer.id,
          referralCode,
          completedCycles + 1,
          5,
          totalReferrals
        );

        console.log(`[Referral] User ${referrer.id} earned 5 credits for 3 referrals! (Cycle ${completedCycles + 1}/${MAX_CYCLES})`);
      } else if (count === 3 && completedCycles >= MAX_CYCLES) {
        // Max cycles reached, still mark as rewarded but don't give credits
        await db.runAsync(
          'UPDATE referrals SET status = ? WHERE referrer_code = ? AND status = ?',
          ['max_reached', referralCode, 'completed']
        );

        // Track max cycles reached in Firebase
        await logReferralMaxCyclesReached(
          referrer.id,
          referralCode,
          completedCycles,
          totalReferrals
        );

        console.log(`[Referral] User ${referrer.id} reached max cycles (${MAX_CYCLES}). No more credits awarded.`);
      }

      await db.execAsync('COMMIT');

      console.log(`[Referral] User ${refereeId} redeemed code ${referralCode} and received 1 credit!`);
      
      // Queue sync for both users (optimized, batched)
      queueSync('referral');
      
      return { success: true, creditAwarded: 1 };
    } catch (transactionError: any) {
      // Rollback on any error
      await db.execAsync('ROLLBACK');
      throw transactionError;
    }
  } catch (error: any) {
    console.error('[Referral] Redemption error:', error);
    return { success: false, error: error.message };
  }
};

// Get referral stats
export const getReferralStats = async (userId: string): Promise<{
  currentProgress: number;
  totalCredits: number;
  totalReferrals: number;
  completedCycles: number;
  maxCycles: number;
}> => {
  const db = getDatabase();

  const user = await db.getFirstAsync<any>(
    'SELECT referral_code, credits FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    return { currentProgress: 0, totalCredits: 0, totalReferrals: 0, completedCycles: 0, maxCycles: 5 };
  }

  // Count completed referrals (not yet rewarded)
  const currentProgress = await db.getFirstAsync<any>(
    'SELECT COUNT(*) as count FROM referrals WHERE referrer_code = ? AND status = ?',
    [user.referral_code, 'completed']
  );

  // Count total referrals (including rewarded and max_reached)
  const totalReferrals = await db.getFirstAsync<any>(
    'SELECT COUNT(*) as count FROM referrals WHERE referrer_code = ? AND (status = ? OR status = ? OR status = ?)',
    [user.referral_code, 'completed', 'rewarded', 'max_reached']
  );

  // Count rewarded referrals to calculate completed cycles
  const rewardedCount = await db.getFirstAsync<any>(
    'SELECT COUNT(*) as count FROM referrals WHERE referrer_code = ? AND status = ?',
    [user.referral_code, 'rewarded']
  );

  const completedCycles = Math.floor((rewardedCount?.count || 0) / 3);

  return {
    currentProgress: currentProgress?.count || 0,
    totalCredits: user.credits || 0,
    totalReferrals: totalReferrals?.count || 0,
    completedCycles,
    maxCycles: 5,
  };
};

// Get referred users
export const getReferredUsers = async (userId: string): Promise<Array<{
  id: string;
  code: string;
  redeemedAt: number;
}>> => {
  const db = getDatabase();

  const user = await db.getFirstAsync<any>(
    'SELECT referral_code FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    return [];
  }

  const referrals = await db.getAllAsync<any>(
    'SELECT referee_id, referee_code, created_at FROM referrals WHERE referrer_code = ? AND status = ? ORDER BY created_at DESC',
    [user.referral_code, 'completed']
  );

  return referrals.map(r => ({
    id: r.referee_id,
    code: r.referee_code,
    redeemedAt: r.created_at,
  }));
};

// Use credits
export const useCredits = async (
  userId: string,
  amount: number,
  usedFor: string = 'unknown'
): Promise<{ success: boolean; error?: string; remainingCredits?: number }> => {
  const db = getDatabase();

  try {
    // First, get current credits
    const user: any = await db.getFirstAsync(
      'SELECT credits FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.credits < amount) {
      return { success: false, error: 'Insufficient credits' };
    }

    const oldBalance = user.credits;

    // Atomic update: only deduct if credits >= amount (prevents race condition)
    const result = await db.runAsync(
      'UPDATE users SET credits = credits - ? WHERE id = ? AND credits >= ?',
      [amount, userId, amount]
    );

    // Check if the update actually happened
    if (result.changes === 0) {
      // This means the WHERE condition failed - credits were used by another operation
      return { success: false, error: 'Insufficient credits (concurrent update)' };
    }

    const remainingCredits = oldBalance - amount;

    // Track credit usage in Firebase
    await logCreditsUsed(userId, amount, remainingCredits, usedFor);
    await logCreditBalanceChange(userId, oldBalance, remainingCredits, `used_for_${usedFor}`);

    // Queue sync (optimized, batched)
    queueSync('user');

    return { success: true, remainingCredits };
  } catch (error: any) {
    console.error('[Referral] Use credits error:', error);
    return { success: false, error: error.message };
  }
};

// Get user credits
export const getUserCredits = async (userId: string): Promise<number> => {
  const db = getDatabase();

  const user = await db.getFirstAsync<any>(
    'SELECT credits FROM users WHERE id = ?',
    [userId]
  );

  return user?.credits || 0;
};
