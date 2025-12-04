/**
 * Local Analytics Service
 *
 * Now integrated with Firebase Analytics for real event tracking
 * Can be extended to integrate with:
 * - Amplitude
 * - Mixpanel
 * - Segment
 */

import { getCurrentUserId } from './supabase/auth';
import analytics from '@react-native-firebase/analytics';

// ============================================
// ANALYTICS CONFIGURATION
// ============================================

interface AnalyticsConfig {
  enabled: boolean;
  logToConsole: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const config: AnalyticsConfig = {
  enabled: true,
  logToConsole: true,
  logLevel: 'info',
};

// ============================================
// SCREEN TRACKING CONFIGURATION
// ============================================

export type ScreenName =
  | 'HomeScreen'
  | 'OnboardingScreen'
  | 'ReferralScreen'
  | 'SettingsScreen'
  | 'NoteDetailScreen'
  | 'CreateNoteScreen'
  | 'ProfileScreen'
  | 'CreditsScreen'
  | 'SubscriptionScreen'
  | 'SearchScreen'
  | 'LibraryScreen'
  | 'FolderDetailScreen'
  | 'ChatScreen'
  | 'FeynmanScreen'
  | 'QuizScreen'
  | 'FlashcardsScreen'
  | 'PodcastScreen'
  | 'VisualContentScreen'
  | 'LearningPathScreen';

interface ScreenProperties {
  screen_name: ScreenName;
  screen_class: string;
  timestamp: number;
  user_id?: string;
  [key: string]: any;
}

// Track current screen
let currentScreen: ScreenName | null = null;

// ============================================
// CORE LOGGING FUNCTIONS
// ============================================

/**
 * Log a generic event
 */
export const logEvent = async (
  eventName: string,
  properties?: Record<string, any>
): Promise<void> => {
  if (!config.enabled) return;

  try {
    const timestamp = Date.now();
    let userId: string | undefined;

    try {
      userId = getCurrentUserId();
    } catch {
      // User not initialized yet
    }

    const eventData = {
      event: eventName,
      timestamp,
      user_id: userId,
      ...properties,
    };

    if (config.logToConsole) {
      console.log(`[Analytics] EVENT: ${eventName}`, eventData);
    }

    // Send to Firebase Analytics
    await analytics().logEvent(eventName, eventData);
  } catch (error) {
    console.error(`[Analytics] Error logging event ${eventName}:`, error);
  }
};

/**
 * Log screen view with auto-user-id
 */
export const logScreenView = async (screenName: ScreenName, properties?: Record<string, any>): Promise<void> => {
  if (!config.enabled) return;

  try {
    let userId: string | undefined;

    try {
      userId = getCurrentUserId();
    } catch {
      // User not initialized yet
    }

    currentScreen = screenName;

    const screenData: ScreenProperties = {
      screen_name: screenName,
      screen_class: screenName,
      timestamp: Date.now(),
      user_id: userId,
      ...properties,
    };

    if (config.logToConsole) {
      console.log(`[Analytics] SCREEN: ${screenName}`, screenData);
    }

    // Send screen view to Firebase Analytics
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    console.error(`[Analytics] Error logging screen view:`, error);
  }
};

/**
 * Set user properties for segmentation
 */
export const setUserProperty = async (property: string, value: string | number | boolean): Promise<void> => {
  if (!config.enabled) return;

  try {
    if (config.logToConsole) {
      console.log(`[Analytics] USER PROPERTY: ${property} = ${value}`);
    }

    // Send to Firebase Analytics
    await analytics().setUserProperty(property, value.toString());
  } catch (error) {
    console.error(`[Analytics] Error setting user property:`, error);
  }
};

/**
 * Get current screen
 */
export const getCurrentScreen = (): ScreenName | null => {
  return currentScreen;
};

/**
 * Configure analytics
 */
export const configureAnalytics = (newConfig: Partial<AnalyticsConfig>): void => {
  Object.assign(config, newConfig);
  console.log('[Analytics] Configuration updated:', config);
};

// ============================================
// PREDEFINED EVENT LOGGING
// ============================================

/**
 * Log app startup
 */
export const logAppStartup = async (): Promise<void> => {
  await logEvent('app_startup', {
    timestamp: Date.now(),
  });
};

/**
 * Log note creation
 */
export const logNoteCreated = async (noteId: string, source: string, contentLength: number): Promise<void> => {
  await logEvent('note_created', {
    note_id: noteId,
    source: source, // 'text', 'audio', 'youtube', 'document', 'image'
    content_length: contentLength,
  });
};

/**
 * Log note viewed
 */
export const logNoteViewed = async (noteId: string, source: string): Promise<void> => {
  await logEvent('note_viewed', {
    note_id: noteId,
    source: source,
  });
};

/**
 * Log note deleted
 */
export const logNoteDeleted = async (noteId: string): Promise<void> => {
  await logEvent('note_deleted', {
    note_id: noteId,
  });
};

/**
 * Log feature used
 */
export const logFeatureUsed = async (
  featureName: 'quiz' | 'flashcards' | 'podcast' | 'visual' | 'chat' | 'feynman' | 'learning_path',
  noteId: string
): Promise<void> => {
  await logEvent('feature_used', {
    feature: featureName,
    note_id: noteId,
  });
};

/**
 * Log search performed
 */
export const logSearch = async (query: string, resultCount: number): Promise<void> => {
  await logEvent('search_performed', {
    query: query,
    result_count: resultCount,
  });
};

/**
 * Log credits consumed
 */
export const logCreditsConsumed = async (amount: number, reason: string, remaining: number): Promise<void> => {
  await logEvent('credits_consumed', {
    amount: amount,
    reason: reason,
    remaining_credits: remaining,
  });
};

/**
 * Log subscription action
 */
export const logSubscriptionAction = async (
  action: 'view' | 'purchase' | 'cancel' | 'renew',
  plan: string
): Promise<void> => {
  await logEvent('subscription_action', {
    action: action,
    plan: plan,
  });
};

/**
 * Log referral action
 */
export const logReferralAction = async (
  action: 'view' | 'share' | 'redeem' | 'reward_earned',
  referralCode?: string
): Promise<void> => {
  await logEvent('referral_action', {
    action: action,
    referral_code: referralCode,
  });
};

/**
 * Log error/crash
 */
export const logError = async (errorName: string, errorMessage: string, context?: Record<string, any>): Promise<void> => {
  await logEvent('error_occurred', {
    error_name: errorName,
    error_message: errorMessage,
    context: context,
  });
};

/**
 * Log timing (for performance monitoring)
 */
export const logTiming = async (
  timingName: string,
  durationMs: number,
  context?: Record<string, any>
): Promise<void> => {
  await logEvent('timing_recorded', {
    timing_name: timingName,
    duration_ms: durationMs,
    context: context,
  });
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize analytics on app startup
 */
export const initializeAnalytics = async (): Promise<void> => {
  try {
    console.log('[Analytics] Initializing...');
    await logAppStartup();

    // Set initial user properties
    try {
      const userId = getCurrentUserId();
      await setUserProperty('app_version', '1.0.0');
      await setUserProperty('has_user', 'true');
    } catch {
      await setUserProperty('has_user', 'false');
    }

    console.log('[Analytics] ✅ Initialized successfully');
  } catch (error) {
    console.error('[Analytics] ❌ Initialization error:', error);
  }
};
