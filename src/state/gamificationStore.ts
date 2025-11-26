import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useXPNotificationStore } from './xpNotificationStore';

export interface QuizStats {
  completed: boolean;
  bestScore: number; // percentage 0-100
  attempts: number;
  lastAttemptDate: number;
  perfectScores: number; // count of 100% completions
}

export interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: number; // timestamp
  totalStudyDays: number;
}

interface GamificationState {
  // XP and Level
  totalXP: number;
  level: number;

  // Streaks
  streak: StudyStreak;

  // Quiz Stats
  totalQuizzes: number;
  quizzesCompleted: number;
  perfectScores: number;

  // Flashcard Stats
  flashcardsStudiedToday: number;
  totalFlashcardSessions: number;
  lastFlashcardStudyDate: number;

  // Actions
  addXP: (amount: number) => void;
  updateStreak: () => void;
  checkAndResetStreak: () => void;
  recordQuizCompletion: (score: number) => void;
  recordFlashcardSession: () => void;
  getStreakStatus: () => { isActive: boolean; daysAgo: number };
  resetDailyStats: () => void;
  clearAllData: () => void;
}

const calculateLevel = (xp: number): number => {
  // Level formula: level = floor(sqrt(xp / 100))
  // Level 1: 100 XP, Level 2: 400 XP, Level 3: 900 XP, etc.
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

const getXPForLevel = (level: number): number => {
  // XP required to reach this level
  return Math.pow(level - 1, 2) * 100;
};

const isSameDay = (timestamp1: number, timestamp2: number): boolean => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const getDaysDifference = (timestamp1: number, timestamp2: number): number => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  date1.setHours(0, 0, 0, 0);
  date2.setHours(0, 0, 0, 0);
  const diffTime = date2.getTime() - date1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      totalXP: 0,
      level: 1,
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: 0,
        totalStudyDays: 0,
      },
      totalQuizzes: 0,
      quizzesCompleted: 0,
      perfectScores: 0,
      flashcardsStudiedToday: 0,
      totalFlashcardSessions: 0,
      lastFlashcardStudyDate: 0,

      // Add XP and check for level up
      addXP: (amount: number) => {
        set((state) => {
          const newXP = state.totalXP + amount;
          const newLevel = calculateLevel(newXP);

          console.log(`[Gamification] Added ${amount} XP. Total: ${newXP}, Level: ${newLevel}`);

          // Show XP notification
          useXPNotificationStore.getState().showXPNotification(amount);

          return {
            totalXP: newXP,
            level: newLevel,
          };
        });
      },

      // Update streak based on current date
      updateStreak: () => {
        const now = Date.now();
        const state = get();
        const lastStudyDate = state.streak.lastStudyDate;

        // First time studying
        if (lastStudyDate === 0) {
          set({
            streak: {
              currentStreak: 1,
              longestStreak: 1,
              lastStudyDate: now,
              totalStudyDays: 1,
            },
          });
          console.log('[Gamification] Started first streak!');
          return;
        }

        // Already studied today
        if (isSameDay(lastStudyDate, now)) {
          console.log('[Gamification] Already studied today, streak maintained');
          return;
        }

        const daysDiff = getDaysDifference(lastStudyDate, now);

        // Studied yesterday - increment streak
        if (daysDiff === 1) {
          const newStreak = state.streak.currentStreak + 1;
          set({
            streak: {
              ...state.streak,
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, state.streak.longestStreak),
              lastStudyDate: now,
              totalStudyDays: state.streak.totalStudyDays + 1,
            },
          });
          console.log(`[Gamification] Streak increased to ${newStreak}! 🔥`);
        }
        // Missed a day - reset streak
        else {
          set({
            streak: {
              ...state.streak,
              currentStreak: 1,
              lastStudyDate: now,
              totalStudyDays: state.streak.totalStudyDays + 1,
            },
          });
          console.log('[Gamification] Streak broken, starting fresh at 1');
        }
      },

      // Check and reset streak if inactive
      checkAndResetStreak: () => {
        const state = get();
        const now = Date.now();
        const lastStudyDate = state.streak.lastStudyDate;

        // No streak to check
        if (lastStudyDate === 0) {
          return;
        }

        const daysDiff = getDaysDifference(lastStudyDate, now);

        // If more than 1 day has passed, reset the streak
        if (daysDiff > 1) {
          set({
            streak: {
              ...state.streak,
              currentStreak: 0,
            },
          });
          console.log('[Gamification] Streak expired, reset to 0');
        }
      },

      // Record quiz completion
      recordQuizCompletion: (score: number) => {
        const isPerfect = score === 100;
        const xpReward = Math.round(score / 2); // 50 XP for perfect score

        set((state) => ({
          quizzesCompleted: state.quizzesCompleted + 1,
          perfectScores: isPerfect ? state.perfectScores + 1 : state.perfectScores,
        }));

        // Add XP and update streak
        get().addXP(xpReward);
        get().updateStreak();

        console.log(`[Gamification] Quiz completed! Score: ${score}%, XP: +${xpReward}`);
      },

      // Record flashcard study session
      recordFlashcardSession: () => {
        const now = Date.now();
        const state = get();

        // Reset daily count if new day
        const isNewDay = !isSameDay(state.lastFlashcardStudyDate, now);

        set({
          flashcardsStudiedToday: isNewDay ? 1 : state.flashcardsStudiedToday + 1,
          totalFlashcardSessions: state.totalFlashcardSessions + 1,
          lastFlashcardStudyDate: now,
        });

        // Add XP and update streak
        get().addXP(15);
        get().updateStreak();

        console.log('[Gamification] Flashcard session recorded! XP: +15');
      },

      // Get streak status
      getStreakStatus: () => {
        const state = get();
        const now = Date.now();
        const lastStudyDate = state.streak.lastStudyDate;

        if (lastStudyDate === 0) {
          return { isActive: false, daysAgo: 0 };
        }

        const daysAgo = getDaysDifference(lastStudyDate, now);
        const isActive = daysAgo <= 1; // Active if studied today or yesterday

        return { isActive, daysAgo };
      },

      // Reset daily stats (called on app start if new day)
      resetDailyStats: () => {
        const now = Date.now();
        const state = get();

        if (!isSameDay(state.lastFlashcardStudyDate, now)) {
          set({
            flashcardsStudiedToday: 0,
          });
        }

        // Also check and reset streak if needed
        get().checkAndResetStreak();
      },

      // Clear all gamification data
      clearAllData: () =>
        set({
          totalXP: 0,
          level: 1,
          streak: {
            currentStreak: 0,
            longestStreak: 0,
            lastStudyDate: 0,
            totalStudyDays: 0,
          },
          totalQuizzes: 0,
          quizzesCompleted: 0,
          perfectScores: 0,
          flashcardsStudiedToday: 0,
          totalFlashcardSessions: 0,
          lastFlashcardStudyDate: 0,
        }),
    }),
    {
      name: 'gamification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper function to get XP progress for current level
export const getLevelProgress = (totalXP: number, level: number) => {
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpIntoLevel = totalXP - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progress = (xpIntoLevel / xpNeededForNextLevel) * 100;

  return {
    current: xpIntoLevel,
    needed: xpNeededForNextLevel,
    progress: Math.min(Math.max(progress, 0), 100),
  };
};
