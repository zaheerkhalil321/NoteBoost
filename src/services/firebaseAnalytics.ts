import analytics from '@react-native-firebase/analytics';
import { initializeAnonymousAuth, getCurrentUserId } from './supabase/auth';

// Firebase Analytics helper functions
const logAnalyticsEvent = async (eventName: string, params: Record<string, any>) => {
  try {
    await analytics().logEvent(eventName, params);
  } catch (error) {
    console.error(`[Firebase Analytics] Error logging ${eventName}:`, error);
  }
};

const logScreenView = async (params: { screen_name: string; screen_class: string }) => {
  try {
    await analytics().logScreenView(params);
  } catch (error) {
    console.error('[Firebase Analytics] Error logging screen view:', error);
  }
};

const setUserProperty = async (property: string, value: string) => {
  try {
    await analytics().setUserProperty(property, value);
  } catch (error) {
    console.error('[Firebase Analytics] Error setting user property:', error);
  }
};

const setUserId = async (userId: string) => {
  try {
    await analytics().setUserId(userId);
  } catch (error) {
    console.error('[Firebase Analytics] Error setting user ID:', error);
  }
};

// Track if user has been initialized
let supabaseUserInitialized = false;

// Initialize authentication and analytics
export const initSupabaseUser = async () => {
  // Guard: Only initialize once
  if (supabaseUserInitialized) {
    try {
      const currentUserId = getCurrentUserId();
      await setUserId(currentUserId);
      return currentUserId;
    } catch (error) {
      // Continue to create new user
    }
  }

  try {
    const user = await initializeAnonymousAuth();
    supabaseUserInitialized = true;

    // Set user ID in Supabase
    await setUserId(user.id);

    return user.id;
  } catch (error) {
    console.error('[Analytics] Auth error:', error);
    throw error;
  }
};

// ============================================
// REFERRAL CODE EVENTS (REAL-TIME)
// ============================================

// Track referral code generation (when new user joins)
export const logReferralCodeGenerated = async (userId: string, referralCode: string) => {
  await logAnalyticsEvent('referral_code_generated', {
    user_id: userId,
    referral_code: referralCode,
    timestamp: Date.now(),
  });
};

// Track when user views referral screen
export const logReferralScreenView = async () => {
  await logScreenView({
    screen_name: 'ReferralScreen',
    screen_class: 'ReferralScreen',
  });
  await logAnalyticsEvent('referral_screen_viewed', {
    timestamp: Date.now(),
  });
};

// Track referral code share (REAL-TIME: fires immediately when user shares)
export const logReferralCodeShared = async (
  userId: string,
  referralCode: string,
  shareMethod: 'copy' | 'share_api' | 'social'
) => {
  await logAnalyticsEvent('referral_code_shared', {
    user_id: userId,
    referral_code: referralCode,
    share_method: shareMethod,
    timestamp: Date.now(),
  });
};

// Track referral code redemption attempt (REAL-TIME)
export const logReferralRedemptionAttempt = async (
  refereeId: string,
  referralCode: string,
  success: boolean,
  errorReason?: string
) => {
  await logAnalyticsEvent('referral_redemption_attempt', {
    referee_id: refereeId,
    referral_code: referralCode,
    success,
    error_reason: errorReason || 'none',
    timestamp: Date.now(),
  });
};

// Track successful referral redemption (REAL-TIME: both referrer and referee notified)
export const logReferralRedeemed = async (
  refereeId: string,
  referrerId: string,
  referralCode: string,
  welcomeCredit: number
) => {
  await logAnalyticsEvent('referral_redeemed', {
    referee_id: refereeId,
    referrer_id: referrerId,
    referral_code: referralCode,
    welcome_credit: welcomeCredit,
    timestamp: Date.now(),
  });
};

// Track when referrer earns credits (3 referrals completed) - REAL-TIME
export const logReferralCycleCompleted = async (
  referrerId: string,
  referralCode: string,
  cycleNumber: number,
  creditsAwarded: number,
  totalReferrals: number
) => {
  await logAnalyticsEvent('referral_cycle_completed', {
    referrer_id: referrerId,
    referral_code: referralCode,
    cycle_number: cycleNumber,
    credits_awarded: creditsAwarded,
    total_referrals: totalReferrals,
    timestamp: Date.now(),
  });
};

// Track max cycles reached
export const logReferralMaxCyclesReached = async (
  referrerId: string,
  referralCode: string,
  totalCycles: number,
  totalReferrals: number
) => {
  await logAnalyticsEvent('referral_max_cycles_reached', {
    referrer_id: referrerId,
    referral_code: referralCode,
    total_cycles: totalCycles,
    total_referrals: totalReferrals,
    timestamp: Date.now(),
  });
};

// ============================================
// CREDIT USAGE EVENTS (REAL-TIME)
// ============================================

// Track credit usage (REAL-TIME: when user spends credits)
export const logCreditsUsed = async (
  userId: string,
  creditsUsed: number,
  remainingCredits: number,
  usedFor: string
) => {
  await logAnalyticsEvent('credits_used', {
    user_id: userId,
    credits_used: creditsUsed,
    remaining_credits: remainingCredits,
    used_for: usedFor,
    timestamp: Date.now(),
  });
};

// Track credit balance changes
export const logCreditBalanceChange = async (
  userId: string,
  oldBalance: number,
  newBalance: number,
  changeReason: string
) => {
  await logAnalyticsEvent('credit_balance_changed', {
    user_id: userId,
    old_balance: oldBalance,
    new_balance: newBalance,
    change_amount: newBalance - oldBalance,
    change_reason: changeReason,
    timestamp: Date.now(),
  });
};

// ============================================
// REFERRED USER FEATURE ENGAGEMENT (REAL-TIME)
// ============================================

// Track when referred user creates their first note
export const logReferredUserFirstNote = async (
  refereeId: string,
  referrerCode: string,
  hoursAfterReferral: number
) => {
  await logAnalyticsEvent('referred_user_first_note', {
    referee_id: refereeId,
    referrer_code: referrerCode,
    hours_after_referral: hoursAfterReferral,
    timestamp: Date.now(),
  });
};

// Track referred user note creation activity
export const logReferredUserNoteCreated = async (
  refereeId: string,
  referrerCode: string,
  daysAfterReferral: number,
  totalNotes: number,
  noteSource: 'text' | 'audio' | 'youtube' | 'document' | 'image'
) => {
  await logAnalyticsEvent('referred_user_note_created', {
    referee_id: refereeId,
    referrer_code: referrerCode,
    days_after_referral: daysAfterReferral,
    total_notes: totalNotes,
    note_source: noteSource,
    timestamp: Date.now(),
  });
};

// Track referred user quiz activity
export const logReferredUserQuizTaken = async (
  refereeId: string,
  referrerCode: string,
  daysAfterReferral: number,
  quizScore: number,
  totalQuizzes: number
) => {
  await logAnalyticsEvent('referred_user_quiz_taken', {
    referee_id: refereeId,
    referrer_code: referrerCode,
    days_after_referral: daysAfterReferral,
    quiz_score: quizScore,
    total_quizzes: totalQuizzes,
    timestamp: Date.now(),
  });
};

// Track referred user flashcard usage
export const logReferredUserFlashcardSession = async (
  refereeId: string,
  referrerCode: string,
  daysAfterReferral: number,
  cardsStudied: number,
  totalSessions: number
) => {
  await logAnalyticsEvent('referred_user_flashcard_session', {
    referee_id: refereeId,
    referrer_code: referrerCode,
    days_after_referral: daysAfterReferral,
    cards_studied: cardsStudied,
    total_sessions: totalSessions,
    timestamp: Date.now(),
  });
};

// Track referred user podcast generation
export const logReferredUserPodcastGenerated = async (
  refereeId: string,
  referrerCode: string,
  daysAfterReferral: number,
  totalPodcasts: number
) => {
  await logAnalyticsEvent('referred_user_podcast_generated', {
    referee_id: refereeId,
    referrer_code: referrerCode,
    days_after_referral: daysAfterReferral,
    total_podcasts: totalPodcasts,
    timestamp: Date.now(),
  });
};

// Track referred user Feynman technique usage
export const logReferredUserFeynmanUsed = async (
  refereeId: string,
  referrerCode: string,
  daysAfterReferral: number,
  totalFeynmanSessions: number
) => {
  await logAnalyticsEvent('referred_user_feynman_used', {
    referee_id: refereeId,
    referrer_code: referrerCode,
    days_after_referral: daysAfterReferral,
    total_feynman_sessions: totalFeynmanSessions,
    timestamp: Date.now(),
  });
};

// Track referred user chat interactions
export const logReferredUserChatUsed = async (
  refereeId: string,
  referrerCode: string,
  daysAfterReferral: number,
  messageCount: number,
  roastMode: boolean
) => {
  await logAnalyticsEvent('referred_user_chat_used', {
    referee_id: refereeId,
    referrer_code: referrerCode,
    days_after_referral: daysAfterReferral,
    message_count: messageCount,
    roast_mode: roastMode,
    timestamp: Date.now(),
  });
};

// Track referred user learning path usage
export const logReferredUserLearningPathUsed = async (
  refereeId: string,
  referrerCode: string,
  daysAfterReferral: number,
  totalLearningPaths: number
) => {
  await logAnalyticsEvent('referred_user_learning_path_used', {
    referee_id: refereeId,
    referrer_code: referrerCode,
    days_after_referral: daysAfterReferral,
    total_learning_paths: totalLearningPaths,
    timestamp: Date.now(),
  });
};

// Track referred user visuals generation
export const logReferredUserVisualsGenerated = async (
  refereeId: string,
  referrerCode: string,
  daysAfterReferral: number,
  totalVisuals: number
) => {
  await logAnalyticsEvent('referred_user_visuals_generated', {
    referee_id: refereeId,
    referrer_code: referrerCode,
    days_after_referral: daysAfterReferral,
    total_visuals: totalVisuals,
    timestamp: Date.now(),
  });
};

// Track referred user app retention
export const logReferredUserDailyActive = async (
  refereeId: string,
  referrerCode: string,
  daysAfterReferral: number,
  totalActiveDays: number
) => {
  await logAnalyticsEvent('referred_user_daily_active', {
    referee_id: refereeId,
    referrer_code: referrerCode,
    days_after_referral: daysAfterReferral,
    total_active_days: totalActiveDays,
    timestamp: Date.now(),
  });
};

// Track when referred user becomes a referrer (pays it forward)
export const logReferredUserBecameReferrer = async (
  refereeId: string,
  originalReferrerCode: string,
  daysAfterReferral: number
) => {
  await logAnalyticsEvent('referred_user_became_referrer', {
    referee_id: refereeId,
    original_referrer_code: originalReferrerCode,
    days_after_referral: daysAfterReferral,
    timestamp: Date.now(),
  });
};

// ============================================
// USER PROPERTIES (FOR SEGMENTATION)
// ============================================

// Set user properties for segmentation
export const setUserReferralProperties = async (
  userId: string,
  hasReferredUsers: boolean,
  totalReferrals: number,
  totalCredits: number,
  completedCycles: number,
  isReferredUser: boolean,
  referrerCode?: string
) => {
  await setUserProperty('has_referred_users', hasReferredUsers.toString());
  await setUserProperty('total_referrals', totalReferrals.toString());
  await setUserProperty('total_credits', totalCredits.toString());
  await setUserProperty('completed_cycles', completedCycles.toString());
  await setUserProperty('is_referred_user', isReferredUser.toString());
  if (referrerCode) {
    await setUserProperty('referred_by_code', referrerCode);
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Calculate days/hours since referral
export const calculateTimeSinceReferral = (redeemedAt: number): { days: number; hours: number } => {
  const now = Date.now();
  const diff = now - redeemedAt;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  return { days, hours };
};

// Check if user is a referred user and get their referrer code
export const getReferralContext = async (db: any, userId: string): Promise<{
  isReferred: boolean;
  referrerCode?: string;
  redeemedAt?: number;
}> => {
  try {
    const user: any = await db.getFirstAsync(
      'SELECT used_referral_code FROM users WHERE id = ?',
      [userId]
    );

    if (user?.used_referral_code) {
      const referral: any = await db.getFirstAsync(
        'SELECT created_at FROM referrals WHERE referee_id = ?',
        [userId]
      );

      return {
        isReferred: true,
        referrerCode: user.used_referral_code,
        redeemedAt: referral?.created_at,
      };
    }

    return { isReferred: false };
  } catch (error) {
    console.error('[Analytics] Error getting referral context:', error);
    return { isReferred: false };
  }
};
