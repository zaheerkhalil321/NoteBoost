import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import revenueCatService from '../services/revenueCat';

type SubscriptionPlan = "yearly" | "monthly" | "weekly" | "lifetime";

interface SubscriptionState {
  isSubscribed: boolean;
  activePlan: SubscriptionPlan | null;
  subscriptionDate: string | null;
  expirationDate: string | null;
  productIdentifier: string | null;
  allPurchasedProducts: string[];

  // Actions
  setSubscription: (plan: SubscriptionPlan) => void;
  clearSubscription: () => void;
  checkSubscriptionStatus: () => Promise<void>;
  getSubscriptionDetails: () => Promise<{
    isSubscribed: boolean;
    activePlan: SubscriptionPlan | null;
    expirationDate: Date | null;
    productIdentifier: string | null;
    allPurchasedProducts: string[];
  }>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      isSubscribed: false,
      activePlan: null,
      subscriptionDate: null,
      expirationDate: null,
      productIdentifier: null,
      allPurchasedProducts: [],

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
          expirationDate: null,
          productIdentifier: null,
          allPurchasedProducts: [],
        });
      },

      checkSubscriptionStatus: async () => {
        try {
          const subscriptionDetails = await revenueCatService.getSubscriptionDetails();
          console.log("🚀 ~ subscriptionDetails:", subscriptionDetails)
          if (!subscriptionDetails) {
            set({
              isSubscribed: false,
              activePlan: null,
              expirationDate: null,
              productIdentifier: null,
              allPurchasedProducts: [],
            });
            return;
          }

          // Determine the active plan from product identifier
          let activePlan: SubscriptionPlan | null = null;
          if (subscriptionDetails.productIdentifier) {
            const productId = subscriptionDetails.productIdentifier.toLowerCase();
            console.log('[SubscriptionStore] Determining plan from product ID:', productId);
            
            if (productId.includes('yearly') || productId.includes('annual') || productId.includes('year')) {
              activePlan = 'yearly';
              console.log('[SubscriptionStore] Matched yearly pattern');
            } else if (productId.includes('weekly') || productId.includes('week')) {
              activePlan = 'weekly';
              console.log('[SubscriptionStore] Matched weekly pattern');
            } else if (productId.includes('monthly') || productId.includes('month')) {
              activePlan = 'monthly';
              console.log('[SubscriptionStore] Matched monthly pattern');
            } else if (productId.includes('lifetime') || productId.includes('forever') || productId.includes('one-time')) {
              activePlan = 'lifetime';
              console.log('[SubscriptionStore] Matched lifetime pattern');
            } else {
              // If we can't identify the plan but user is subscribed, default to yearly
              console.log('[SubscriptionStore] Unknown product ID pattern, defaulting to yearly:', productId);
              activePlan = 'yearly';
            }
          } else if (subscriptionDetails.isSubscribed) {
            // If subscribed but no product identifier, default to yearly
            console.log('[SubscriptionStore] No product identifier found, but user is subscribed, defaulting to yearly');
            activePlan = 'yearly';
          }
          
          console.log('[SubscriptionStore] Final activePlan determined:', activePlan, 'from productIdentifier:', subscriptionDetails.productIdentifier);
          
          set({
            isSubscribed: subscriptionDetails.isSubscribed,
            activePlan: subscriptionDetails.isSubscribed ? activePlan : null,
            expirationDate: subscriptionDetails.expirationDate?.toISOString() || null,
            productIdentifier: subscriptionDetails.productIdentifier || null,
            allPurchasedProducts: subscriptionDetails.allPurchasedProducts,
          });

          console.log('[SubscriptionStore] Subscription status updated:', {
            isSubscribed: subscriptionDetails.isSubscribed,
            activePlan: subscriptionDetails.isSubscribed ? activePlan : null,
            expirationDate: subscriptionDetails.expirationDate,
            productIdentifier: subscriptionDetails.productIdentifier,
            allPurchasedProducts: subscriptionDetails.allPurchasedProducts,
          });
        } catch (error) {
          console.error('[SubscriptionStore] Failed to check subscription status:', error);
        }
      },

      getSubscriptionDetails: async () => {
        const state = get();
        return {
          isSubscribed: state.isSubscribed,
          activePlan: state.activePlan,
          expirationDate: state.expirationDate ? new Date(state.expirationDate) : null,
          productIdentifier: state.productIdentifier,
          allPurchasedProducts: state.allPurchasedProducts,
        };
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
