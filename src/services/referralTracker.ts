import { getDatabase } from './database';
import {
  logReferredUserNoteCreated,
  logReferredUserQuizTaken,
  logReferredUserFlashcardSession,
  logReferredUserPodcastGenerated,
  logReferredUserFeynmanUsed,
  logReferredUserChatUsed,
  logReferredUserLearningPathUsed,
  logReferredUserVisualsGenerated,
  logReferredUserFirstNote,
  logReferredUserBecameReferrer,
  getReferralContext,
  calculateTimeSinceReferral,
} from './firebaseAnalytics';

/**
 * Tracks feature usage for referred users in real-time
 * Call these functions whenever a referred user uses a feature
 */

// Track note creation
export const trackReferredUserNote = async (
  userId: string,
  noteSource: 'text' | 'audio' | 'youtube' | 'document' | 'image',
  totalNotes: number,
  isFirstNote: boolean = false
) => {
  const db = getDatabase();
  const context = await getReferralContext(db, userId);

  if (context.isReferred && context.referrerCode && context.redeemedAt) {
    const { days, hours } = calculateTimeSinceReferral(context.redeemedAt);

    // Track first note milestone
    if (isFirstNote) {
      await logReferredUserFirstNote(userId, context.referrerCode, hours);
    }

    // Track note creation
    await logReferredUserNoteCreated(
      userId,
      context.referrerCode,
      days,
      totalNotes,
      noteSource
    );
  }
};

// Track quiz completion
export const trackReferredUserQuiz = async (
  userId: string,
  quizScore: number,
  totalQuizzes: number
) => {
  const db = getDatabase();
  const context = await getReferralContext(db, userId);

  if (context.isReferred && context.referrerCode && context.redeemedAt) {
    const { days } = calculateTimeSinceReferral(context.redeemedAt);

    await logReferredUserQuizTaken(
      userId,
      context.referrerCode,
      days,
      quizScore,
      totalQuizzes
    );
  }
};

// Track flashcard study session
export const trackReferredUserFlashcards = async (
  userId: string,
  cardsStudied: number,
  totalSessions: number
) => {
  const db = getDatabase();
  const context = await getReferralContext(db, userId);

  if (context.isReferred && context.referrerCode && context.redeemedAt) {
    const { days } = calculateTimeSinceReferral(context.redeemedAt);

    await logReferredUserFlashcardSession(
      userId,
      context.referrerCode,
      days,
      cardsStudied,
      totalSessions
    );
  }
};

// Track podcast generation
export const trackReferredUserPodcast = async (
  userId: string,
  totalPodcasts: number
) => {
  const db = getDatabase();
  const context = await getReferralContext(db, userId);

  if (context.isReferred && context.referrerCode && context.redeemedAt) {
    const { days } = calculateTimeSinceReferral(context.redeemedAt);

    await logReferredUserPodcastGenerated(
      userId,
      context.referrerCode,
      days,
      totalPodcasts
    );
  }
};

// Track Feynman technique usage
export const trackReferredUserFeynman = async (
  userId: string,
  totalFeynmanSessions: number
) => {
  const db = getDatabase();
  const context = await getReferralContext(db, userId);

  if (context.isReferred && context.referrerCode && context.redeemedAt) {
    const { days } = calculateTimeSinceReferral(context.redeemedAt);

    await logReferredUserFeynmanUsed(
      userId,
      context.referrerCode,
      days,
      totalFeynmanSessions
    );
  }
};

// Track chat usage
export const trackReferredUserChat = async (
  userId: string,
  messageCount: number,
  roastMode: boolean
) => {
  const db = getDatabase();
  const context = await getReferralContext(db, userId);

  if (context.isReferred && context.referrerCode && context.redeemedAt) {
    const { days } = calculateTimeSinceReferral(context.redeemedAt);

    await logReferredUserChatUsed(
      userId,
      context.referrerCode,
      days,
      messageCount,
      roastMode
    );
  }
};

// Track learning path usage
export const trackReferredUserLearningPath = async (
  userId: string,
  totalLearningPaths: number
) => {
  const db = getDatabase();
  const context = await getReferralContext(db, userId);

  if (context.isReferred && context.referrerCode && context.redeemedAt) {
    const { days } = calculateTimeSinceReferral(context.redeemedAt);

    await logReferredUserLearningPathUsed(
      userId,
      context.referrerCode,
      days,
      totalLearningPaths
    );
  }
};

// Track visuals generation
export const trackReferredUserVisuals = async (
  userId: string,
  totalVisuals: number
) => {
  const db = getDatabase();
  const context = await getReferralContext(db, userId);

  if (context.isReferred && context.referrerCode && context.redeemedAt) {
    const { days } = calculateTimeSinceReferral(context.redeemedAt);

    await logReferredUserVisualsGenerated(
      userId,
      context.referrerCode,
      days,
      totalVisuals
    );
  }
};

// Track when a referred user gets their first referral (becoming a referrer)
export const trackReferredUserBecameReferrer = async (userId: string) => {
  const db = getDatabase();
  const context = await getReferralContext(db, userId);

  if (context.isReferred && context.referrerCode && context.redeemedAt) {
    const { days } = calculateTimeSinceReferral(context.redeemedAt);

    await logReferredUserBecameReferrer(
      userId,
      context.referrerCode,
      days
    );
  }
};
