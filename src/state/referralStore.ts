import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGamificationStore } from './gamificationStore';

export interface ReferredUser {
  id: string;
  code: string;
  redeemedAt: number;
}

interface ReferralState {
  // User's own referral code
  myReferralCode: string;

  // Credits earned from referrals
  credits: number;

  // Users who used my code
  referredUsers: ReferredUser[];

  // Track if user has redeemed a code
  hasRedeemedCode: boolean;
  redeemedCode: string | null;

  // Cycle tracking
  completedCycles: number;
  maxCycles: number;

  // Actions
  setMyReferralCode: (code: string) => void;
  addReferredUser: (user: ReferredUser) => void;
  addCredits: (amount: number) => void;
  useCredits: (amount: number) => boolean;
  setRedeemedCode: (code: string) => void;
  resetReferralProgress: () => void;
  setCompletedCycles: (cycles: number) => void;
  clearAllData: () => void;
}

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      myReferralCode: '',
      credits: 0,
      referredUsers: [],
      hasRedeemedCode: false,
      redeemedCode: null,
      completedCycles: 0,
      maxCycles: 5,

      setMyReferralCode: (code) => set({ myReferralCode: code }),

      addReferredUser: (user) => {
        const state = get();
        const newReferredUsers = [...state.referredUsers, user];

        // Award 25 XP for each successful referral
        useGamificationStore.getState().addXP(25);

        // Check if we reached 3 referrals (reset threshold)
        if (newReferredUsers.length === 3) {
          // Award 5 credits and reset
          set({
            referredUsers: [],
            credits: state.credits + 5,
          });
        } else {
          set({ referredUsers: newReferredUsers });
        }
      },

      addCredits: (amount) => set((state) => ({
        credits: state.credits + amount
      })),

      useCredits: (amount) => {
        const state = get();
        if (state.credits >= amount) {
          set({ credits: state.credits - amount });
          return true;
        }
        return false;
      },

      setRedeemedCode: (code) => set({
        hasRedeemedCode: true,
        redeemedCode: code
      }),

      resetReferralProgress: () => set({
        referredUsers: [],
      }),

      setCompletedCycles: (cycles) => set({
        completedCycles: cycles,
      }),

      clearAllData: () => set({
        myReferralCode: '',
        credits: 0,
        referredUsers: [],
        hasRedeemedCode: false,
        redeemedCode: null,
        completedCycles: 0,
      }),
    }),
    {
      name: 'referral-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
