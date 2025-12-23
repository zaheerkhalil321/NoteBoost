import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSubscriptionStore } from "../state/subscriptionStore";
import revenueCatService from "../services/revenueCat";

// Type for PurchasesPackage
type PurchasesPackage = any;

type SubscriptionDetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "SubscriptionDetails">;
};

interface Feature {
  icon: string;
  title: string;
  description: string;
  premiumOnly: boolean;
}

interface PlanOption {
  id: "yearly" | "weekly";
  name: string;
  description: string;
  savings?: string;
  popular?: boolean;
  package?: PurchasesPackage;
  isCurrentPlan?: boolean;
}

const premiumFeatures: Feature[] = [
  {
    icon: "sparkles",
    title: "AI-Powered Summaries",
    description: "Get instant, intelligent summaries of your notes and lectures with advanced AI technology",
    premiumOnly: true,
  },
  {
    icon: "mic",
    title: "Audio Transcription",
    description: "Convert voice recordings and lectures into accurate, searchable text automatically",
    premiumOnly: true,
  },
  {
    icon: "school",
    title: "Smart Quizzes",
    description: "Generate personalized quizzes from your notes to test and reinforce your knowledge",
    premiumOnly: true,
  },
  {
    icon: "chatbubbles",
    title: "AI Chat Assistant",
    description: "Ask questions about your notes and get instant, contextual answers from AI",
    premiumOnly: true,
  },
  {
    icon: "document-text",
    title: "Multi-Format Support",
    description: "Import and work with PDFs, images, audio files, and more - all in one place",
    premiumOnly: true,
  },
  {
    icon: "flash",
    title: "Instant Flashcards",
    description: "Automatically create flashcards from your notes for efficient spaced repetition learning",
    premiumOnly: true,
  },
  {
    icon: "images",
    title: "Visual Content Analysis",
    description: "Extract and understand text from images, charts, and handwritten notes",
    premiumOnly: true,
  },
  {
    icon: "headset",
    title: "Podcast Transcription",
    description: "Transcribe podcasts and audio content into searchable, organized notes",
    premiumOnly: true,
  },
  {
    icon: "globe",
    title: "Multi-Language Support",
    description: "Work with content in multiple languages with automatic translation and transcription",
    premiumOnly: true,
  },
  {
    icon: "shield-checkmark",
    title: "Priority Support",
    description: "Get fast, personalized help from our expert support team whenever you need it",
    premiumOnly: true,
  },
  {
    icon: "infinite",
    title: "Unlimited Notes",
    description: "Create as many AI-powered notes as you need without any limits",
    premiumOnly: true,
  },
  {
    icon: "cloud-upload",
    title: "Cloud Sync",
    description: "Access your notes across all your devices with seamless cloud synchronization",
    premiumOnly: true,
  },
];

function SubscriptionDetailsScreen({
  navigation,
}: SubscriptionDetailsScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    isSubscribed,
    activePlan,
    expirationDate,
    productIdentifier,
    checkSubscriptionStatus,
    getSubscriptionDetails,
    setSubscription,
  } = useSubscriptionStore();
console.log(isSubscribed,activePlan)
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [offeringsWithPricing, setOfferingsWithPricing] = useState<any>(null);

  const planOptions: PlanOption[] = [
    {
      id: "weekly",
      name: "Weekly Plan",
      description: "Perfect for trying out premium features",
      package: offeringsWithPricing?.weekly?.package || null,
      isCurrentPlan: activePlan === "weekly",
    },
    {
      id: "yearly",
      name: "Yearly Plan",
      description: "Best value - save 50%",
      savings: "Save 50%",
      popular: true,
      package: offeringsWithPricing?.yearly?.package || null,
      isCurrentPlan: activePlan === "yearly",
    },
  ];

  useEffect(() => {
    loadSubscriptionDetails();
    loadOfferings();
    console.log('[SubscriptionDetailsScreen] Current activePlan:', activePlan, 'isSubscribed:', isSubscribed, 'productIdentifier:', productIdentifier);
  }, [activePlan, isSubscribed, productIdentifier]);

  const loadOfferings = async () => {
    try {
      const offerings = await revenueCatService.getOfferingsWithPricing();
      if (offerings) {
        setOfferingsWithPricing(offerings);
      }
    } catch (error) {
      console.error('Failed to load offerings:', error);
    }
  };

  const loadSubscriptionDetails = async () => {
    setLoading(true);
    try {
      // Refresh subscription status
      await checkSubscriptionStatus();

      // Get detailed subscription info
      const details = await getSubscriptionDetails();
      setSubscriptionDetails(details);

      // Also get RevenueCat details for more info
      const revenueCatDetails = await revenueCatService.getSubscriptionDetails();
      if (revenueCatDetails) {
        setSubscriptionDetails((prev: any) => ({ ...prev, ...revenueCatDetails }));
      }
    } catch (error) {
      console.error('Failed to load subscription details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId: "yearly" | "weekly") => {
    if (purchasing) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPurchasing(true);

    try {
      const selectedOffering = offeringsWithPricing?.[planId];
      if (!selectedOffering?.package) {
        console.error('[Subscription] No package found for plan:', planId);
        Alert.alert('Error', 'Unable to process purchase. Please try again.');
        setPurchasing(false);
        return;
      }

      console.log('[Subscription] Purchasing package:', selectedOffering.package.identifier);

      const customerInfo = await revenueCatService.purchasePackage(selectedOffering.package);

      if (customerInfo) {
        // Update subscription store - removed setSubscription(planId) to rely only on RevenueCat data
        // setSubscription(planId);

        // Refresh subscription status
        await checkSubscriptionStatus();
        await loadSubscriptionDetails();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('[Subscription] Purchase successful');

        Alert.alert(
          "Success!",
          `Your ${getPlanDisplayName(planId)} is now active!`,
          [{ text: "OK" }]
        );
      } else {
        console.log('[Subscription] Purchase cancelled or failed');
      }
    } catch (error) {
      console.error('[Subscription] Purchase error:', error);
      Alert.alert('Purchase Failed', 'Unable to complete purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (purchasing) return;

    setLoading(true);
    try {
      const customerInfo = await revenueCatService.restorePurchases();
      if (customerInfo) {
        await checkSubscriptionStatus();
        await loadSubscriptionDetails();
        Alert.alert("Success", "Purchases restored successfully!");
      } else {
        Alert.alert("No Purchases", "No purchases found to restore.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPlanDisplayName = (plan: string | null) => {
    switch (plan) {
      case "yearly":
        return "Yearly Plan";
      case "monthly":
        return "Monthly Plan";
      case "weekly":
        return "Weekly Plan";
      case "lifetime":
        return "Lifetime Plan";
      default:
        return "Premium Plan";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FC5C65" />
        <Text style={styles.loadingText}>Loading subscription details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    >
      {/* Header */}
      <View
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            style={({ pressed }) => [
              styles.backButtonContainer,
              pressed && styles.backButton,
            ]}
          >
            <Ionicons name="arrow-back" size={24} color="#FC5C65" />
          </Pressable>
          <Text style={styles.headerTitle}>
            Subscription Details
          </Text>
        </View>
      </View>

      {/* Subscription Status Card */}
      <View style={styles.statusCard}>
        <LinearGradient
          colors={
           isSubscribed && activePlan 
              ? ["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]
              : ["#FEE2E2", "#FECACA", "#FBD5D5"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusCardGradient}
        >
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusIconContainer,
                isSubscribed && activePlan ? styles.statusIconActive : styles.statusIconInactive,
              ]}
            >
              <Ionicons
                name={isSubscribed && activePlan  ? "checkmark-circle" : "close-circle"}
                size={24}
                color={isSubscribed && activePlan  ? "#10B981" : "#EF4444"}
              />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                {isSubscribed && activePlan ? "Premium Active" : "Free Plan"}
              </Text>
              {isSubscribed && activePlan && (
                <Text style={styles.statusSubtitle}>
                  {getPlanDisplayName(activePlan)}
                </Text>
              )}
            </View>
          </View>

          {isSubscribed && activePlan  && (
            <View style={styles.statusDetails}>
              {expirationDate && (
                <View style={styles.statusDetailRow}>
                  <Ionicons name="calendar" size={16} style={styles.statusDetailIcon} />
                  <Text style={styles.statusDetailText}>
                    Expires: {formatDate(expirationDate)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {!isSubscribed && activePlan  && (
            <Text style={styles.statusMessage}>
              Upgrade to premium to unlock all features and create unlimited notes.
            </Text>
          )}
        </LinearGradient>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={loadSubscriptionDetails}
          style={{
            ...styles.actionButton,
            ...styles.refreshButton,
          }}
        >
          <View style={styles.actionButtonContent}>
            <Ionicons name="refresh" size={20} style={styles.actionButtonIcon} />
            <Text style={styles.actionButtonText}>
              Refresh Status
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRestorePurchases}
          style={{
            ...styles.actionButton,
            ...styles.restoreButton,
          }}
        >
          <View style={styles.actionButtonContent}>
            <Ionicons name="refresh-circle" size={20} style={styles.restoreButtonIcon} />
            <Text style={styles.restoreButtonText}>
              Restore Purchases
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Plan Options */}
      <View style={styles.planSection}>
        <Text style={styles.planSectionTitle}>
          {isSubscribed && activePlan  ? "Change Plan" : "Choose Your Plan"}
        </Text>

        <View style={styles.planOptions}>
          {planOptions.map((plan) => {
            const isCurrentPlan = isSubscribed && activePlan === plan.id;
            const isPopular = plan.popular;
            const offering = offeringsWithPricing?.[plan.id];
            const priceString = offering?.priceString || "Loading...";
            const perDayPrice = offering?.perDayPrice || "";

            return (
              <TouchableOpacity
                key={plan.id}
                onPress={() => {
                  if (isCurrentPlan) return; // Don't allow purchasing current plan
                  handlePurchase(plan.id);
                }}
                disabled={purchasing || isCurrentPlan}
                style={{
                  ...styles.planCard,
                  ...(isCurrentPlan && styles.planCardCurrent),
                  ...(isPopular && !isCurrentPlan && styles.planCardPopular),
                  ...(!isCurrentPlan && !isPopular && styles.planCardDefault)
                }}
              >
                <View style={styles.planCardHeader}>
                  <View style={styles.planCardContent}>
                    <View style={styles.planCardTitleRow}>
                      <Text style={[
                        styles.planCardTitle,
                        isCurrentPlan ? styles.planCardTitleCurrent : styles.planCardTitleDefault,
                      ]}>
                        {plan.name}
                      </Text>
                      {isPopular && !isCurrentPlan && (
                        <View style={[styles.planCardBadge, styles.planCardBadgePopular]}>
                          <Text style={styles.planCardBadgeText}>POPULAR</Text>
                        </View>
                      )}
                      {isCurrentPlan && (
                        <View style={[styles.planCardBadge, styles.planCardBadgeCurrent]}>
                          <Text style={styles.planCardBadgeText}>CURRENT</Text>
                        </View>
                      )}
                      {plan.savings && !isCurrentPlan && (
                        <View style={[styles.planCardBadge, styles.planCardBadgeSavings]}>
                          <Text style={styles.planCardBadgeText}>{plan.savings}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.planCardDescription}>
                      {plan.description}
                    </Text>
                    <View>
                      <Text style={[
                        styles.planCardPrice,
                        isCurrentPlan ? styles.planCardPriceCurrent : styles.planCardPriceDefault,
                      ]}>
                        {priceString}
                      </Text>
                      {perDayPrice && (
                        <Text style={styles.planCardPricePerDay}>
                          {perDayPrice}
                        </Text>
                      )}
                    </View>
                  </View>

                  {!isCurrentPlan && (
                    <View style={styles.planCardAction}>
                      {purchasing ? (
                        <ActivityIndicator size="small" color="#FC5C65" />
                      ) : (
                        <View style={styles.planCardActionButton}>
                          <Ionicons name="chevron-forward" size={16} style={styles.planCardActionIcon} />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {isSubscribed && activePlan  && (
          <Text style={styles.planSwitchNote}>
            Switching plans will prorate the charges. Your current plan will be cancelled.
          </Text>
        )}
      </View>

      {/* Features List */}
      <View style={styles.featuresSection}>
        <Text style={styles.featuresSectionTitle}>
          Premium Features
        </Text>

        <View style={styles.featuresList}>
          {premiumFeatures.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureCard,
                isSubscribed && activePlan ? styles.featureCardActive : styles.featureCardInactive,
              ]}
            >
              <View style={styles.featureContent}>
                <View
                  style={[
                    styles.featureIconContainer,
                    isSubscribed && activePlan ? styles.featureIconActive : styles.featureIconInactive,
                  ]}
                >
                  <Ionicons
                    name={feature.icon as any}
                    size={20}
                    color={isSubscribed && activePlan  ? "#10B981" : "#9CA3AF"}
                  />
                </View>
                <View style={styles.featureTextContainer}>
                  <View style={styles.featureHeader}>
                    <Text style={styles.featureTitle}>
                      {feature.title}
                    </Text>
                    {isSubscribed && activePlan  && (
                      <View style={styles.featureBadge}>
                        <Text style={styles.featureBadgeText}>
                          Active
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    opacity: 0.6,
  },
  backButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FC5C65',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  statusCardGradient: {
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusIconActive: {
    backgroundColor: '#dcfce7',
  },
  statusIconInactive: {
    backgroundColor: '#fef2f2',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statusSubtitle: {
    color: '#64748b',
    fontSize: 16,
  },
  statusDetails: {
    gap: 8,
  },
  statusDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDetailIcon: {
    color: '#64748b',
  },
  statusDetailText: {
    marginLeft: 8,
    color: '#64748b',
  },
  statusMessage: {
    color: '#64748b',
    fontSize: 14,
  },
  actionButtons: {
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    opacity: 0.6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  refreshButton: {
    backgroundColor: '#f3f4f6',
  },
  restoreButton: {
    backgroundColor: '#eff6ff',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonIcon: {
    color: '#64748b',
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#64748b',
    fontWeight: '500',
  },
  restoreButtonIcon: {
    color: '#2563eb',
  },
  restoreButtonText: {
    marginLeft: 8,
    color: '#2563eb',
    fontWeight: '500',
  },
  planSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  planSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  planOptions: {
    gap: 12,
  },
  planCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  planCardCurrent: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  planCardPopular: {
    borderColor: '#FC5C65',
    backgroundColor: '#fdf2f8',
  },
  planCardDefault: {
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCardContent: {
    flex: 1,
  },
  planCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planCardTitleCurrent: {
    color: '#047857',
  },
  planCardTitleDefault: {
    color: '#1e293b',
  },
  planCardBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planCardBadgePopular: {
    backgroundColor: '#FC5C65',
  },
  planCardBadgeCurrent: {
    backgroundColor: '#10b981',
  },
  planCardBadgeSavings: {
    backgroundColor: '#10b981',
  },
  planCardBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planCardDescription: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 8,
  },
  planCardPrice: {
    fontWeight: '600',
    fontSize: 18,
  },
  planCardPriceCurrent: {
    color: '#047857',
  },
  planCardPriceDefault: {
    color: '#1e293b',
  },
  planCardPricePerDay: {
    color: '#64748b',
    fontSize: 14,
  },
  planCardAction: {
    marginLeft: 16,
  },
  planCardActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FC5C65',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  planCardActionIcon: {
    color: 'white',
  },
  planSwitchNote: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  featuresSection: {
    marginHorizontal: 20,
  },
  featuresSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureCard: {
    borderRadius: 12,
    padding: 16,
  },
  featureCardActive: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  featureCardInactive: {
    backgroundColor: '#f9fafb',
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureIconActive: {
    backgroundColor: '#dcfce7',
  },
  featureIconInactive: {
    backgroundColor: '#e5e7eb',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  featureBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureBadgeText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '500',
  },
  featureDescription: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SubscriptionDetailsScreen;
