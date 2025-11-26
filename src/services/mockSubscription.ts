// Mock subscription service for Vibecode environment
// This simulates RevenueCat functionality without requiring native APIs

export type SubscriptionPlan = 'weekly' | 'yearly' | 'monthly' | 'lifetime';

export interface MockPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    priceString: string;
    price: number;
    currencyCode: string;
  };
}

export interface MockOffering {
  identifier: string;
  availablePackages: MockPackage[];
}

class MockSubscriptionService {
  private static instance: MockSubscriptionService;
  private isSubscribed: boolean = true; // Default to premium for testing
  private activePlan: SubscriptionPlan | null = 'lifetime'; // Default to lifetime plan

  private constructor() {}

  static getInstance(): MockSubscriptionService {
    if (!MockSubscriptionService.instance) {
      MockSubscriptionService.instance = new MockSubscriptionService();
    }
    return MockSubscriptionService.instance;
  }

  async getOfferings(): Promise<MockOffering> {
    console.log('[MockSubscription] Getting offerings');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      identifier: 'default',
      availablePackages: [
        {
          identifier: '$rc_weekly',
          packageType: 'WEEKLY',
          product: {
            identifier: 'weekly_subscription',
            priceString: '$4.99',
            price: 4.99,
            currencyCode: 'USD',
          },
        },
        {
          identifier: '$rc_annual',
          packageType: 'ANNUAL',
          product: {
            identifier: 'yearly_subscription',
            priceString: '$49.99',
            price: 49.99,
            currencyCode: 'USD',
          },
        },
      ],
    };
  }

  async purchasePackage(pkg: MockPackage): Promise<boolean> {
    console.log('[MockSubscription] Purchasing package:', pkg.identifier);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Determine which plan was purchased
    if (pkg.packageType === 'WEEKLY') {
      this.activePlan = 'weekly';
    } else if (pkg.packageType === 'ANNUAL') {
      this.activePlan = 'yearly';
    } else if (pkg.packageType === 'MONTHLY') {
      this.activePlan = 'monthly';
    } else if (pkg.packageType === 'LIFETIME') {
      this.activePlan = 'lifetime';
    }

    this.isSubscribed = true;
    console.log('[MockSubscription] Purchase successful:', this.activePlan);
    return true;
  }

  async restorePurchases(): Promise<boolean> {
    console.log('[MockSubscription] Restoring purchases');
    await new Promise(resolve => setTimeout(resolve, 500));

    // In mock mode, just return current subscription status
    return this.isSubscribed;
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    return this.isSubscribed;
  }

  getActivePlan(): SubscriptionPlan | null {
    return this.activePlan;
  }

  // For testing: manually set subscription status
  setSubscribed(subscribed: boolean, plan?: SubscriptionPlan) {
    this.isSubscribed = subscribed;
    if (plan) {
      this.activePlan = plan;
    }
  }
}

export default MockSubscriptionService.getInstance();
