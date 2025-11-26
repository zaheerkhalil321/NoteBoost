import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface OnboardingAnswers {
  // Pain points
  mainStruggle: string;
  timeWasted: string;
  biggestFear: string;

  // Goals and desires
  dreamOutcome: string;
  learningGoal: string;

  // Identity and commitment
  studentType: string;
  commitment: string;
  obstacles: string[];

  // Social proof triggers
  peerComparison: string;
  urgency: string;
}

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  userProfile: OnboardingAnswers | null;
  userName: string | null;
}

interface OnboardingActions {
  completeOnboarding: (answers: OnboardingAnswers, name: string) => void;
  setUserName: (name: string) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      userProfile: null,
      userName: null,

      completeOnboarding: (answers, name) =>
        set({
          hasCompletedOnboarding: true,
          userProfile: answers,
          userName: name,
        }),

      setUserName: (name) =>
        set({
          userName: name,
        }),

      resetOnboarding: () =>
        set({
          hasCompletedOnboarding: false,
          userProfile: null,
          userName: null,
        }),
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
