import { Platform } from "react-native";

// Lazy import types
type CustomerInfo = any;
type PurchasesPackage = any;
type PurchasesOffering = any;

class RevenueCatService {
  private static instance: RevenueCatService;
  private initialized = false;
  private Purchases: any = null;
  private LOG_LEVEL: any = null;

  private constructor() {}

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  // Lazy load Purchases module to avoid NativeEventEmitter error
  private async loadPurchases() {
    if (!this.Purchases) {
      try {
        const purchasesModule = await import("react-native-purchases");
        this.Purchases = purchasesModule.default;
        this.LOG_LEVEL = (purchasesModule as any).LOG_LEVEL;
        return purchasesModule;
      } catch (error) {
        console.error("[RevenueCat] Failed to load Purchases module:", error);
        throw error;
      }
    }
    return { default: this.Purchases, LOG_LEVEL: this.LOG_LEVEL };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log("[RevenueCat] Already initialized");
      return;
    }

    try {
      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
        android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
      });

      if (!apiKey) {
        throw new Error(
          "RevenueCat API key not found. Please set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY or EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY environment variables."
        );
      }

      // Lazy load Purchases module
      await this.loadPurchases();

      // Configure SDK
      this.Purchases.setLogLevel(this.LOG_LEVEL.DEBUG);
      await this.Purchases.configure({ apiKey });

      this.initialized = true;
      console.log("[RevenueCat] Initialized successfully");

      // Log initial customer info (non-blocking)
      try {
        const customerInfo = await this.Purchases.getCustomerInfo();
        console.log("[RevenueCat] Customer Info:", {
          activeSubscriptions: customerInfo.activeSubscriptions,
          allPurchasedProductIdentifiers: customerInfo.allPurchasedProductIdentifiers,
        });
      } catch (infoError) {
        console.warn("[RevenueCat] Could not fetch initial customer info:", infoError);
      }
    } catch (error) {
      console.error("[RevenueCat] Initialization failed:", error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    // Ensure Purchases is loaded
    if (!this.Purchases) {
      await this.loadPurchases();
    }

    if (!this.Purchases) {
      console.warn("[RevenueCat] Not initialized");
      return null;
    }

    try {
      const offerings = await this.Purchases.getOfferings();
      if (offerings.current !== null) {
        console.log("[RevenueCat] Current offering:", offerings.current.identifier);
        return offerings.current;
      } else {
        console.warn("[RevenueCat] No current offering found");
        return null;
      }
    } catch (error) {
      console.error("[RevenueCat] Failed to get offerings:", error);
      return null;
    }
  }

  async getOfferingsWithPricing(): Promise<{
    yearly?: { package: PurchasesPackage; price: number; priceString: string; perDayPrice: string };
    weekly?: { package: PurchasesPackage; price: number; priceString: string; perDayPrice: string };
  } | null> {
    // Ensure Purchases is loaded
    if (!this.Purchases) {
      await this.loadPurchases();
    }

    if (!this.Purchases) {
      console.warn("[RevenueCat] Not initialized");
      return null;
    }

    try {
      const offerings = await this.Purchases.getOfferings();
      console.log("offerings available", offerings);
      if (!offerings.current?.availablePackages) {
        console.warn("[RevenueCat] No offerings available");
        return null;
      }

      const result: any = {};

      // Find yearly package
      const yearly = offerings.current.availablePackages.find(
        (pkg: any) =>
          pkg.identifier === "$rc_annual" ||
          pkg.packageType === "ANNUAL" ||
          pkg.product.identifier.toLowerCase().includes("yearly") ||
          pkg.product.identifier.toLowerCase().includes("annual")
      );

      if (yearly) {
        result.yearly = {
          package: yearly,
          price: yearly.product.price,
          priceString: yearly.product.priceString,
          perDayPrice: yearly.product.price
            ? `${yearly.product?.currencyCode} ${(yearly.product.price / 365.25).toFixed(2)}/day`
            : "Best savings",
        };
      }

      // Find weekly package
      const weekly = offerings.current.availablePackages.find(
        (pkg: any) =>
          pkg.identifier === "$rc_weekly" ||
          pkg.packageType === "WEEKLY" ||
          pkg.product.identifier.toLowerCase().includes("weekly")
      );

      if (weekly) {
        result.weekly = {
          package: weekly,
          price: weekly.product.price,
          priceString: weekly.product.priceString,
          perDayPrice: weekly.product.price ? `${yearly.product?.currencyCode} ${(weekly.product.price / 7).toFixed(2)}/day` : "Best for trying out",
        };
      }

      console.log("[RevenueCat] Offerings with pricing:", result);
      return result;
    } catch (error) {
      console.error("[RevenueCat] Failed to get offerings with pricing:", error);
      return null;
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
    if (!this.Purchases) {
      console.warn("[RevenueCat] Not initialized");
      return null;
    }

    try {
      console.log("[RevenueCat] Attempting to purchase package:", pkg.identifier);
      const { customerInfo } = await this.Purchases.purchasePackage(pkg);
      console.log("[RevenueCat] Purchase successful:", {
        activeSubscriptions: customerInfo.activeSubscriptions,
        allPurchasedProductIdentifiers: customerInfo.allPurchasedProductIdentifiers,
      });
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log("[RevenueCat] User cancelled purchase");
      } else {
        console.error("[RevenueCat] Purchase failed:", error);
      }
      return null;
    }
  }

  async restorePurchases(): Promise<CustomerInfo | null> {
    if (!this.Purchases) {
      console.warn("[RevenueCat] Not initialized");
      return null;
    }

    try {
      console.log("[RevenueCat] Restoring purchases...");
      const customerInfo = await this.Purchases.restorePurchases();
      console.log("[RevenueCat] Purchases restored:", {
        activeSubscriptions: customerInfo.activeSubscriptions,
        allPurchasedProductIdentifiers: customerInfo.allPurchasedProductIdentifiers,
      });
      return customerInfo;
    } catch (error) {
      console.error("[RevenueCat] Failed to restore purchases:", error);
      return null;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.Purchases) {
      console.warn("[RevenueCat] Not initialized");
      return null;
    }

    try {
      const customerInfo = await this.Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error("[RevenueCat] Failed to get customer info:", error);
      return null;
    }
  }

  async isUserSubscribed(): Promise<boolean> {
    if (!this.Purchases) {
      console.warn("[RevenueCat] Not initialized");
      return false;
    }

    try {
      const customerInfo = await this.Purchases.getCustomerInfo();
      console.log("🚀 ~ RevenueCatService ~ isUserSubscribed ~ customerInfo:", customerInfo);
      const hasActiveSubscription = typeof customerInfo.entitlements.active["premium"] !== "undefined";
      console.log("[RevenueCat] User subscription status:", hasActiveSubscription);
      return hasActiveSubscription;
    } catch (error) {
      console.error("[RevenueCat] Failed to check subscription status:", error);
      return false;
    }
  }

  async getSubscriptionDetails(): Promise<{
    isSubscribed: boolean;
    activeSubscriptions: string[];
    allPurchasedProducts: string[];
    entitlements: any;
    expirationDate?: Date;
    productIdentifier?: string;
  } | null> {
    if (!this.Purchases) {
      console.warn("[RevenueCat] Not initialized");
      return null;
    }

    try {
      const customerInfo = await this.Purchases.getCustomerInfo();
      console.log("🚀 ~ RevenueCatService ~ getSubscriptionDetails ~ customerInfo:", customerInfo)
      const hasActiveSubscription = typeof customerInfo.entitlements.active["premium"] !== "undefined";

      // Get subscription details - prioritize entitlements over activeSubscriptions
      const activeSubscriptionKeys = Object.keys(customerInfo.activeSubscriptions);
      let expirationDate: Date | undefined;
      let productIdentifier: string | undefined;

      // First, try to get from entitlements (most reliable)
      if (customerInfo.entitlements?.active?.premium?.productIdentifier) {
        productIdentifier = customerInfo.entitlements.active.premium.productIdentifier;
        expirationDate = customerInfo.entitlements.active.premium.expirationDateMillis 
          ? new Date(customerInfo.entitlements.active.premium.expirationDateMillis)
          : undefined;
        console.log('[RevenueCat] Using entitlement product identifier:', {
          productIdentifier,
          expirationDate,
        });
      } else if (activeSubscriptionKeys.length > 0) {
        // Fallback to activeSubscriptions if no entitlement
        const firstSubscription = customerInfo.activeSubscriptions[activeSubscriptionKeys[0]];
        console.log('[RevenueCat] Using activeSubscriptions fallback:', {
          key: activeSubscriptionKeys[0],
          productIdentifier: firstSubscription?.productIdentifier,
          fullSubscription: firstSubscription,
        });
        if (firstSubscription?.expirationDateMillis) {
          expirationDate = new Date(firstSubscription.expirationDateMillis);
        }
        productIdentifier = firstSubscription?.productIdentifier;
      } else {
        console.log('[RevenueCat] No active subscriptions or entitlements found');
      }

      return {
        isSubscribed: hasActiveSubscription,
        activeSubscriptions: activeSubscriptionKeys,
        allPurchasedProducts: customerInfo.allPurchasedProductIdentifiers || [],
        entitlements: customerInfo.entitlements,
        expirationDate,
        productIdentifier,
      };
    } catch (error) {
      console.error("[RevenueCat] Failed to get subscription details:", error);
      return null;
    }
  }

  async setUserId(userId: string): Promise<void> {
    if (!this.Purchases) {
      console.warn("[RevenueCat] Not initialized");
      return;
    }

    try {
      await this.Purchases.logIn(userId);
      console.log("[RevenueCat] User ID set:", userId);
    } catch (error) {
      console.error("[RevenueCat] Failed to set user ID:", error);
    }
  }

  async logout(): Promise<void> {
    if (!this.Purchases) {
      console.warn("[RevenueCat] Not initialized");
      return;
    }

    try {
      await this.Purchases.logOut();
      console.log("[RevenueCat] User logged out");
    } catch (error) {
      console.error("[RevenueCat] Failed to logout:", error);
    }
  }
}

export default RevenueCatService.getInstance();
