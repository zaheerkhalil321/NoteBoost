import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mockSubscriptionService, { SubscriptionPlan } from '../services/mockSubscription';

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
          const isSubscribed = await mockSubscriptionService.checkSubscriptionStatus();
          const activePlan = mockSubscriptionService.getActivePlan();

          set({
            isSubscribed,
            activePlan,
          });

          console.log('[SubscriptionStore] Subscription status:', { isSubscribed, activePlan });
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
