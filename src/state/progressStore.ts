import { create } from "zustand";

// Screen-to-progress mapping with Endowed Progress Effect
// First 20%: Quick wins (ReferralCodeInput → PainPoint2) - just tapping "Next"
// Next 60%: Meaningful input (PainPoint3 → Feedback) - actual engagement
// Final 20%: Close to finish (Commitment → InviteReferral) - creates urgency to complete

export const SCREEN_PROGRESS_MAP: Record<string, number> = {
  // First 20% - Quick wins (3 screens, just tapping Next)
  ReferralCodeInput: 7,
  PainPoint: 13,
  PainPoint2: 20,

  // Next 60% - Meaningful input (9 screens, actual engagement)
  PainPoint3: 28,
  Commitment: 32, // Moved earlier in flow, after PainPoint3
  PersonalizationTransition: 35,
  Onboarding: 48, // Multi-step questions - biggest chunk
  AIGeneration: 58,
  PlanReady: 65,
  EffectivenessComparison: 72,
  SuccessRate: 80,

  // Final 20% - Finish line in sight (4 screens)
  ResultsTimeline: 87,
  Rating: 92,
  Feedback: 96,
  InviteReferral: 100,

  // Paywall is NOT included - progress bar ends at InviteReferral (last onboarding screen)
};

interface ProgressState {
  currentProgress: number;
  setProgress: (screen: string, subProgress?: number) => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  currentProgress: 0,
  setProgress: (screen: string, subProgress?: number) => {
    const baseProgress = SCREEN_PROGRESS_MAP[screen] || 0;
    // If subProgress is provided (0-100%), apply it to reach next screen's progress
    if (subProgress !== undefined && screen === "Onboarding") {
      // OnboardingScreen starts at PersonalizationTransition (35%) and goes to AIGeneration (58%)
      // So we have a 23% range to work with across all questions
      const startProgress = SCREEN_PROGRESS_MAP.PersonalizationTransition || 35;
      const nextScreenProgress = SCREEN_PROGRESS_MAP.AIGeneration || 58;
      const progressRange = nextScreenProgress - startProgress;
      const progress = startProgress + (progressRange * subProgress) / 100;
      set({ currentProgress: progress });
    } else {
      set({ currentProgress: baseProgress });
    }
  },
  resetProgress: () => set({ currentProgress: 0 }),
}));
