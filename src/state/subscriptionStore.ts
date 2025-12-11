import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import revenueCatService from '../services/revenueCat';

type SubscriptionPlan = "yearly" | "monthly" | "weekly" | "lifetime";

interface SubscriptionState {
  isSubscribed: boolean;
  activePlan: SubscriptionPlan | null;
  subscriptionDate: string | null;

  // Actions
  setSubscription: (plan: SubscriptionPlan) => void;
  clearSubscription: () => void;
  checkSubscriptionStatus: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      isSubscribed: false,
      activePlan: null,
      subscriptionDate: null,

      setSubscription: (plan: SubscriptionPlan) => {
        console.log('[SubscriptionStore] Setting subscription:', plan);
        set({
          isSubscribed: true,
          activePlan: plan,
          subscriptionDate: new Date().toISOString(),
        });
      },

      clearSubscription: () => {
        console.log('[SubscriptionStore] Clearing subscription');
        set({
          isSubscribed: false,
          activePlan: null,
          subscriptionDate: null,
        });
      },

      checkSubscriptionStatus: async () => {
        try {
          const isSubscribed = await revenueCatService.isUserSubscribed();
          // Note: RevenueCat doesn't provide the specific plan type directly,
          // so we rely on the stored activePlan from when the subscription was purchased
          const currentState = get();
          
          set({
            isSubscribed,
            // Keep the existing activePlan if user is still subscribed
            activePlan: isSubscribed ? currentState.activePlan : null,
          });

          console.log('[SubscriptionStore] Subscription status:', { isSubscribed, activePlan: isSubscribed ? currentState.activePlan : null });
        } catch (error) {
          console.error('[SubscriptionStore] Failed to check subscription status:', error);
        }
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
