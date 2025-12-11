import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";
import revenueCatService from "../services/revenueCat";
import { useSubscriptionStore } from "../state/subscriptionStore";
import { getUserCredits } from "../services/referralService";
import * as SecureStore from 'expo-secure-store';

// Type for PurchasesPackage
type PurchasesPackage = any;

const { width } = Dimensions.get("window");

type PaywallScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Paywall">;
};

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  { icon: "sparkles", title: "AI-Powered Summaries", description: "Get instant, intelligent summaries of your notes and lectures with advanced AI technology" },
  { icon: "mic", title: "Audio Transcription", description: "Convert voice recordings and lectures into accurate, searchable text automatically" },
  { icon: "school", title: "Smart Quizzes", description: "Generate personalized quizzes from your notes to test and reinforce your knowledge" },
  { icon: "chatbubbles", title: "AI Chat Assistant", description: "Ask questions about your notes and get instant, contextual answers from AI" },
  { icon: "document-text", title: "Multi-Format Support", description: "Import and work with PDFs, images, audio files, and more - all in one place" },
  { icon: "flash", title: "Instant Flashcards", description: "Automatically create flashcards from your notes for efficient spaced repetition learning" },
  { icon: "images", title: "Visual Content Analysis", description: "Extract and understand text from images, charts, and handwritten notes" },
  { icon: "headset", title: "Podcast Transcription", description: "Transcribe podcasts and audio content into searchable, organized notes" },
  { icon: "globe", title: "Multi-Language Support", description: "Work with content in multiple languages with automatic translation and transcription" },
  { icon: "shield-checkmark", title: "Priority Support", description: "Get fast, personalized help from our expert support team whenever you need it" },
];

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "This app helped me ace my finals! The AI summaries saved me hours of study time.",
    author: "Sarah M.",
    role: "Medical Student"
  },
  {
    quote: "I went from struggling with notes to getting straight A's. The quiz feature is a game-changer!",
    author: "Marcus T.",
    role: "Engineering Student"
  },
  {
    quote: "Best investment in my education. I can finally keep up with all my lectures and readings.",
    author: "Emily Chen",
    role: "Law Student"
  },
  {
    quote: "As a working professional taking night classes, this app is invaluable. Saves me so much time!",
    author: "David R.",
    role: "MBA Student"
  }
];

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
  const insets = useSafeAreaInsets();
  const setSubscription = useSubscriptionStore((s) => s.setSubscription);
  const [selectedPlan, setSelectedPlan] = useState<"yearly" | "monthly" | "weekly" | "lifetime">("weekly");
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [yearlyPackage, setYearlyPackage] = useState<PurchasesPackage | null>(null);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [weeklyPackage, setWeeklyPackage] = useState<PurchasesPackage | null>(null);
  const [lifetimePackage, setLifetimePackage] = useState<PurchasesPackage | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Scroll hint animation
  const scrollHintOpacity = useRef(new Animated.Value(0)).current;
  const scrollHintTranslateY = useRef(new Animated.Value(0)).current;
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    loadOfferings();
  }, []);

  // Rotate testimonials every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Scroll hint animation - bounce effect
  useEffect(() => {
    if (!loading && showScrollHint) {
      // Delay before showing hint
      const timeout = setTimeout(() => {
        // Fade in and bounce animation
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scrollHintOpacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(scrollHintTranslateY, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          // Bounce loop
          Animated.loop(
            Animated.sequence([
              Animated.timing(scrollHintTranslateY, {
                toValue: 10,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(scrollHintTranslateY, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
              }),
            ])
          ),
        ]).start();
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [loading, showScrollHint]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    // Hide scroll hint after user scrolls
    if (offsetY > 50 && showScrollHint) {
      setShowScrollHint(false);
      Animated.timing(scrollHintOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const loadOfferings = async () => {
    try {
      setLoading(true);

      // Initialize RevenueCat if not already done
      await revenueCatService.initialize();

      // Load subscription offerings
      console.log('[Paywall] Loading RevenueCat subscription offerings');
      const offering = await revenueCatService.getOfferings();
      console.log("🚀 ~ loadOfferings ~ offering:", offering)

      if (offering && offering.availablePackages) {
        setPackages(offering.availablePackages);

        // Find all subscription packages
        const yearly = offering.availablePackages.find(
          (pkg: any) => pkg.identifier === "$rc_annual" ||
                 pkg.packageType === "ANNUAL" ||
                 pkg.product.identifier.toLowerCase().includes("yearly") ||
                 pkg.product.identifier.toLowerCase().includes("annual")
        );

        const monthly = offering.availablePackages.find(
          (pkg: any) => pkg.identifier === "$rc_monthly" ||
                 pkg.packageType === "MONTHLY" ||
                 pkg.product.identifier.toLowerCase().includes("monthly")
        );

        const weekly = offering.availablePackages.find(
          (pkg: any) => pkg.identifier === "$rc_weekly" ||
                 pkg.packageType === "WEEKLY" ||
                 pkg.product.identifier.toLowerCase().includes("weekly")
        );

        const lifetime = offering.availablePackages.find(
          (pkg: any) => pkg.identifier === "$rc_lifetime" ||
                 pkg.packageType === "LIFETIME" ||
                 pkg.product.identifier.toLowerCase().includes("lifetime")
        );

        setYearlyPackage(yearly || null);
        setMonthlyPackage(monthly || null);
        setWeeklyPackage(weekly || null);
        setLifetimePackage(lifetime || null);

        console.log('[Paywall] Loaded packages:', {
          total: offering.availablePackages.length,
          yearly: yearly?.product.priceString,
          monthly: monthly?.product.priceString,
          weekly: weekly?.product.priceString,
          lifetime: lifetime?.product.priceString,
        });
      } else {
        console.warn('[Paywall] No offerings available');
      }
    } catch (error) {
      console.error('[Paywall] Failed to load offerings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Check if user has any credits from redeeming a code
    try {
      const userId = await SecureStore.getItemAsync('user_id');
      if (userId) {
        const credits = await getUserCredits(userId);

        // If user has at least 1 credit, allow them to proceed to the app
        if (credits >= 1) {
          console.log('[Paywall] User has credits, allowing access to app');
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
          return;
        }
      }
    } catch (error) {
      console.error('[Paywall] Error checking credits:', error);
    }

    // Otherwise, just go back
    navigation.goBack();
  };

  const handleSelectPlan = (plan: "yearly" | "monthly" | "weekly" | "lifetime") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(plan);
  };

  const handleUnlock = async () => {
    if (purchasing) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setPurchasing(true);

    try {
      let selectedPackage;
      if (selectedPlan === "yearly") selectedPackage = yearlyPackage;
      else if (selectedPlan === "monthly") selectedPackage = monthlyPackage;
      else if (selectedPlan === "weekly") selectedPackage = weeklyPackage;
      else if (selectedPlan === "lifetime") selectedPackage = lifetimePackage;

      if (!selectedPackage) {
        console.error('[Paywall] No package selected');
        alert('Unable to process purchase. Please try again.');
        setPurchasing(false);
        return;
      }

      console.log('[Paywall] Purchasing package:', selectedPackage.identifier);

      // Use RevenueCat service
      const customerInfo = await revenueCatService.purchasePackage(selectedPackage);

      if (customerInfo) {
        // Save subscription to store
        setSubscription(selectedPlan);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('[Paywall] Purchase successful');
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      } else {
        console.log('[Paywall] Purchase cancelled or failed');
      }
    } catch (error) {
      console.error('[Paywall] Purchase error:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (purchasing) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPurchasing(true);

    try {
      console.log('[Paywall] Restoring purchases...');

      // Use RevenueCat service
      const customerInfo = await revenueCatService.restorePurchases();

      if (customerInfo && Object.keys(customerInfo.activeSubscriptions).length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        alert('Purchases restored successfully!');
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      } else {
        alert('No purchases found to restore.');
      }
    } catch (error) {
      console.error('[Paywall] Restore error:', error);
      alert('Failed to restore purchases. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Gradient Background - Blue to Yellow (matching onboarding) */}
      <LinearGradient
        colors={["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]}
        locations={[0, 0.4, 0.7, 1]}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />

      {/* Loading State */}
      {loading && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#60A5FA" />
          <Text style={{ marginTop: 16, color: "#64748b", fontSize: 16 }}>
            Loading subscription options...
          </Text>
        </View>
      )}

      {/* Main Content */}
      {!loading && (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 500 }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            decelerationRate="normal"
            bounces={true}
          >
            {/* Close button */}
            <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24 }}>
              <Pressable
                onPress={handleClose}
                style={{
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "flex-end",
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.8)",
                  shadowColor: "#7DD3FC",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Ionicons name="close" size={24} color="#1e293b" />
              </Pressable>
            </View>

            {/* Mascot and Hero Section */}
            <View style={{ alignItems: "center", paddingHorizontal: 24, paddingTop: 8 }}>
              {/* Mascot Image with Glow */}
              <View style={{
                width: 180,
                height: 180,
                marginBottom: 24,
                borderRadius: 90,
                backgroundColor: "rgba(96, 165, 250, 0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Image
                  source={require("../assets/images/mascot-new.png")}
                  style={{ width: 160, height: 160 }}
                  resizeMode="contain"
                />
              </View>

              {/* Title */}
              <Text style={{
                color: "#1e293b",
                fontSize: 38,
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: 12,
                letterSpacing: -1,
              }}>
                Unlock Premium
              </Text>

              {/* Subtitle */}
              <Text style={{
                color: "#64748b",
                fontSize: 17,
                textAlign: "center",
                lineHeight: 24,
                marginBottom: 24,
              }}>
                Join thousands of users achieving their goals
              </Text>

              {/* <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 32,
              }}>
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginRight: 16,
                }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name="star" size={16} color="#FCD34D" style={{ marginRight: 2 }} />
                  ))}
                  <Text style={{ color: "#1e293b", fontSize: 15, fontWeight: "600", marginLeft: 4 }}>
                    4.9
                  </Text>
                </View>

                <View style={{ width: 1, height: 20, backgroundColor: "#CBD5E1", marginHorizontal: 16 }} />

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="people" size={18} color="#60A5FA" style={{ marginRight: 6 }} />
                  <Text style={{ color: "#1e293b", fontSize: 15, fontWeight: "600" }}>
                    100K+ Users
                  </Text>
                </View>
              </View> */}
            </View>

            {/* Testimonials Carousel - Moved Higher for Better Conversion */}
            {/* <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
              <View style={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.9)",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 3,
                minHeight: 150,
              }}>
              <View style={{ flexDirection: "row", marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons key={star} name="star" size={18} color="#FCD34D" style={{ marginRight: 2 }} />
                ))}
              </View>
              <Text style={{
                color: "#1e293b",
                fontSize: 16,
                lineHeight: 24,
                fontWeight: "500",
                marginBottom: 12,
              }}>
                "{testimonials[currentTestimonial].quote}"
              </Text>
              <Text style={{
                color: "#64748b",
                fontSize: 14,
                fontWeight: "600",
              }}>
                {testimonials[currentTestimonial].author}, {testimonials[currentTestimonial].role}
              </Text>

              <View style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 12,
                gap: 6,
              }}>
                {testimonials.map((_, index) => (
                  <View
                    key={index}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: index === currentTestimonial ? "#60A5FA" : "#CBD5E1",
                    }}
                  />
                ))}
              </View>
            </View>
            </View> */}

            {/* <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
              <Text style={{
                color: "#94A3B8",
                fontSize: 11,
                fontWeight: "600",
                textAlign: "center",
                marginBottom: 20,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}>
                As Featured In
              </Text>
              <View style={{
                flexDirection: "row",
                justifyContent: "space-around",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 24,
              }}>
                <View style={{ alignItems: "center", opacity: 0.6 }}>
                  <Ionicons name="rocket" size={28} color="#94A3B8" />
                  <Text style={{
                    color: "#64748b",
                    fontSize: 10,
                    fontWeight: "600",
                    marginTop: 6,
                  }}>
                    Product Hunt
                  </Text>
                  <Text style={{
                    color: "#94A3B8",
                    fontSize: 8,
                    fontWeight: "500",
                  }}>
                    #1 Product
                  </Text>
                </View>

                <View style={{ alignItems: "center", opacity: 0.6 }}>
                  <Ionicons name="ribbon" size={28} color="#94A3B8" />
                  <Text style={{
                    color: "#64748b",
                    fontSize: 10,
                    fontWeight: "600",
                    marginTop: 6,
                  }}>
                    Editor's Choice
                  </Text>
                  <Text style={{
                    color: "#94A3B8",
                    fontSize: 8,
                    fontWeight: "500",
                  }}>
                    App Store
                  </Text>
                </View>

                <View style={{ alignItems: "center", opacity: 0.6 }}>
                  <Ionicons name="newspaper" size={28} color="#94A3B8" />
                  <Text style={{
                    color: "#64748b",
                    fontSize: 10,
                    fontWeight: "600",
                    marginTop: 6,
                  }}>
                    TechCrunch
                  </Text>
                  <Text style={{
                    color: "#94A3B8",
                    fontSize: 8,
                    fontWeight: "500",
                  }}>
                    Featured
                  </Text>
                </View>

                <View style={{ alignItems: "center", opacity: 0.6 }}>
                  <Ionicons name="briefcase" size={28} color="#94A3B8" />
                  <Text style={{
                    color: "#64748b",
                    fontSize: 10,
                    fontWeight: "600",
                    marginTop: 6,
                  }}>
                    Forbes
                  </Text>
                  <Text style={{
                    color: "#94A3B8",
                    fontSize: 8,
                    fontWeight: "500",
                  }}>
                    Top EdTech
                  </Text>
                </View>
              </View>
            </View> */}

            {/* <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
              <View style={{
                backgroundColor: "rgba(96, 165, 250, 0.15)",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(96, 165, 250, 0.3)",
              }}>
                <Text style={{
                  color: "#1e293b",
                  fontSize: 15,
                  fontWeight: "700",
                  textAlign: "center",
                  marginBottom: 16,
                }}>
                  Trusted by Students Worldwide
                </Text>
                <View style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: "#60A5FA", fontSize: 28, fontWeight: "bold" }}>
                      95%
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 12, textAlign: "center" }}>
                      Report Better{"\n"}Grades
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: "#60A5FA", fontSize: 28, fontWeight: "bold" }}>
                      1M+
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 12, textAlign: "center" }}>
                      Summaries{"\n"}Created
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: "#60A5FA", fontSize: 28, fontWeight: "bold" }}>
                      4.5h
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 12, textAlign: "center" }}>
                      Saved Per{"\n"}Week
                    </Text>
                  </View>
                </View>
              </View>
            </View> */}

            {/* Features Grid */}
            <View style={{
              paddingHorizontal: 24,
              marginBottom: 32,
            }}>
              <Text style={{
                color: "#1e293b",
                fontSize: 20,
                fontWeight: "700",
                marginBottom: 16,
              }}>
                Everything You Need
              </Text>
              <View style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}>
                {features.map((feature, index) => (
                  <View
                    key={index}
                    style={{
                      width: "48%",
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.8)",
                      shadowColor: "#7DD3FC",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "rgba(96, 165, 250, 0.2)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}>
                      <Ionicons name={feature.icon as any} size={22} color="#60A5FA" />
                    </View>
                    <Text style={{
                      color: "#1e293b",
                      fontSize: 14,
                      fontWeight: "600",
                      lineHeight: 18,
                      marginBottom: 8,
                    }}>
                      {feature.title}
                    </Text>
                    <Text style={{
                      color: "#64748b",
                      fontSize: 12,
                      lineHeight: 16,
                    }}>
                      {feature.description}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Money Back Guarantee */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderRadius: 16,
                padding: 16,
                marginTop: 8,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.8)",
                shadowColor: "#10b981",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#10b981",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}>
                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                </View>
                <Text style={{
                  color: "#1e293b",
                  fontSize: 16,
                  fontWeight: "700",
                  flex: 1,
                }}>
                  Money Back Guaranteed
                </Text>
              </View>

              {/* Trust Badges Row */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-around",
                marginTop: 12,
                gap: 8,
              }}>
                {/* Cancel Anytime */}
                <View style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.8)",
                }}>
                  <Ionicons name="close-circle-outline" size={20} color="#60A5FA" style={{ marginRight: 6 }} />
                  <Text style={{
                    color: "#1e293b",
                    fontSize: 13,
                    fontWeight: "600",
                  }}>
                    Cancel Anytime
                  </Text>
                </View>

                {/* Secured by Apple */}
                <View style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.8)",
                }}>
                  <Ionicons name="shield-checkmark" size={20} color="#60A5FA" style={{ marginRight: 6 }} />
                  <Text style={{
                    color: "#1e293b",
                    fontSize: 13,
                    fontWeight: "600",
                  }}>
                    Secured by Apple
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Section - Pricing Plans with Glassmorphic Design */}
          <View style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.25,
            shadowRadius: 24,
            elevation: 20,
          }}>
            <BlurView
              intensity={80}
              tint="light"
              style={{
                paddingTop: 16,
                paddingBottom: insets.bottom,
                paddingHorizontal: 24,
                backgroundColor: "rgba(255, 255, 255, 0.85)",
                borderTopWidth: 1,
                borderTopColor: "rgba(255, 255, 255, 0.5)",
              }}
            >
            {/* Pricing Plans - Glassmorphic Design */}
            <View>
              {/* Yearly Plan */}
              {yearlyPackage && (
                <Pressable
                  onPress={() => handleSelectPlan("yearly")}
                  disabled={!yearlyPackage}
                  style={{ marginBottom: 12 }}
                >
                  <BlurView
                    intensity={20}
                    tint="light"
                    style={{
                      borderRadius: 20,
                      overflow: "hidden",
                      borderWidth: selectedPlan === "yearly" ? 3 : 2,
                      borderColor: selectedPlan === "yearly" ? "#60A5FA" : "#94A3B8",
                      shadowColor: selectedPlan === "yearly" ? "#60A5FA" : "#000",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: selectedPlan === "yearly" ? 0.3 : 0.1,
                      shadowRadius: 16,
                      elevation: 5,
                    }}
                  >
                    <View style={{ backgroundColor: "rgba(255, 255, 255, 0.75)", padding: 12 }}>
                      {/* Save 50% Badge */}
                      <View style={{
                        position: "absolute",
                        top: -2,
                        right: 20,
                        backgroundColor: "#86efac",
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                        shadowColor: "#22c55e",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      }}>
                        <Text style={{ color: "#166534", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>
                          SAVE 50%
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: 18,
                            fontWeight: "400",
                            color: "#1e293b",
                            marginBottom: 2,
                          }}>
                            Yearly Plan
                          </Text>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: "#64748b",
                          }}>
                            {yearlyPackage.product.price ? `$${(yearlyPackage.product.price / 365).toFixed(2)}/day` : "Best savings"}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{
                            fontSize: 24,
                            fontWeight: "400",
                            color: selectedPlan === "yearly" ? "#60A5FA" : "#1e293b",
                            letterSpacing: -1,
                          }}>
                            {yearlyPackage.product.priceString}
                          </Text>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: "#64748b",
                          }}>
                            per year
                          </Text>
                        </View>
                      </View>
                    </View>
                  </BlurView>
                </Pressable>
              )}

              {/* Monthly Plan */}
              {monthlyPackage && (
                <Pressable
                  onPress={() => handleSelectPlan("monthly")}
                  disabled={!monthlyPackage}
                  style={{ marginBottom: 12 }}
                >
                  <BlurView
                    intensity={20}
                    tint="light"
                    style={{
                      borderRadius: 20,
                      overflow: "hidden",
                      borderWidth: selectedPlan === "monthly" ? 3 : 2,
                      borderColor: selectedPlan === "monthly" ? "#60A5FA" : "#94A3B8",
                      shadowColor: selectedPlan === "monthly" ? "#60A5FA" : "#000",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: selectedPlan === "monthly" ? 0.3 : 0.1,
                      shadowRadius: 16,
                      elevation: 5,
                    }}
                  >
                    <View style={{ backgroundColor: "rgba(255, 255, 255, 0.75)", padding: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: 18,
                            fontWeight: "400",
                            color: "#1e293b",
                            marginBottom: 2,
                          }}>
                            Monthly Plan
                          </Text>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: "#64748b",
                          }}>
                            {monthlyPackage.product.price ? `$${(monthlyPackage.product.price / 30).toFixed(2)}/day` : "Great value"}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{
                            fontSize: 24,
                            fontWeight: "400",
                            color: selectedPlan === "monthly" ? "#60A5FA" : "#1e293b",
                            letterSpacing: -1,
                          }}>
                            {monthlyPackage.product.priceString}
                          </Text>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: "#64748b",
                          }}>
                            per month
                          </Text>
                        </View>
                      </View>
                    </View>
                  </BlurView>
                </Pressable>
              )}

              {/* Lifetime Plan */}
              {lifetimePackage && (
                <Pressable
                  onPress={() => handleSelectPlan("lifetime")}
                  disabled={!lifetimePackage}
                  style={{ marginBottom: 12 }}
                >
                  <BlurView
                    intensity={20}
                    tint="light"
                    style={{
                      borderRadius: 20,
                      overflow: "hidden",
                      borderWidth: selectedPlan === "lifetime" ? 3 : 2,
                      borderColor: selectedPlan === "lifetime" ? "#60A5FA" : "#94A3B8",
                      shadowColor: selectedPlan === "lifetime" ? "#60A5FA" : "#000",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: selectedPlan === "lifetime" ? 0.3 : 0.1,
                      shadowRadius: 16,
                      elevation: 5,
                    }}
                  >
                    <View style={{ backgroundColor: "rgba(255, 255, 255, 0.75)", padding: 12 }}>
                      {/* Best Deal Badge */}
                      <View style={{
                        position: "absolute",
                        top: -2,
                        right: 20,
                        backgroundColor: "#60A5FA",
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                        shadowColor: "#60A5FA",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      }}>
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>
                          BEST DEAL
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: 18,
                            fontWeight: "400",
                            color: "#1e293b",
                            marginBottom: 2,
                          }}>
                            Lifetime Plan
                          </Text>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: "#64748b",
                          }}>
                            One-time payment
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{
                            fontSize: 24,
                            fontWeight: "400",
                            color: selectedPlan === "lifetime" ? "#60A5FA" : "#1e293b",
                            letterSpacing: -1,
                          }}>
                            {lifetimePackage.product.priceString}
                          </Text>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: "#64748b",
                          }}>
                            forever
                          </Text>
                        </View>
                      </View>
                    </View>
                  </BlurView>
                </Pressable>
              )}

              {/* Weekly Plan */}
              {weeklyPackage && (
                <Pressable
                  onPress={() => handleSelectPlan("weekly")}
                  disabled={!weeklyPackage}
                  style={{ marginBottom: 12 }}
                >
                  <BlurView
                    intensity={20}
                    tint="light"
                    style={{
                      borderRadius: 20,
                      overflow: "hidden",
                      borderWidth: selectedPlan === "weekly" ? 3 : 2,
                      borderColor: selectedPlan === "weekly" ? "#60A5FA" : "#94A3B8",
                      shadowColor: selectedPlan === "weekly" ? "#60A5FA" : "#000",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: selectedPlan === "weekly" ? 0.3 : 0.1,
                      shadowRadius: 16,
                      elevation: 5,
                    }}
                  >
                    <View style={{ backgroundColor: "rgba(255, 255, 255, 0.75)", padding: 12 }}>
                      {/* Most Popular Badge */}
                      <View style={{
                        position: "absolute",
                        top: -2,
                        right: 20,
                        backgroundColor: "#60A5FA",
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                        shadowColor: "#60A5FA",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      }}>
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>
                          MOST POPULAR
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: 18,
                            fontWeight: "400",
                            color: "#1e293b",
                            marginBottom: 2,
                          }}>
                            Weekly Plan
                          </Text>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: "#64748b",
                          }}>
                            {weeklyPackage.product.price ? `$${(weeklyPackage.product.price / 7).toFixed(2)}/day` : "Best for trying out"}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{
                            fontSize: 24,
                            fontWeight: "400",
                            color: selectedPlan === "weekly" ? "#60A5FA" : "#1e293b",
                            letterSpacing: -1,
                          }}>
                            {weeklyPackage.product.priceString}
                          </Text>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: "#64748b",
                          }}>
                            per week
                          </Text>
                        </View>
                      </View>
                    </View>
                  </BlurView>
                </Pressable>
              )}

              {/* Unlock Button */}
              <Pressable
                onPress={handleUnlock}
                disabled={purchasing || (!yearlyPackage && !monthlyPackage && !weeklyPackage && !lifetimePackage)}
                style={({ pressed }) => ({
                  overflow: "hidden",
                  borderRadius: 16,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  shadowColor: "#3B82F6",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                  opacity: purchasing || (!yearlyPackage && !monthlyPackage && !weeklyPackage && !lifetimePackage) ? 0.7 : 1,
                  marginTop: 8,
                })}
              >
                <LinearGradient
                  colors={["#60A5FA", "#3B82F6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: "center",
                    borderRadius: 16,
                  }}
                >
                  {purchasing ? (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={{
                        color: "#FFFFFF",
                        fontSize: 17,
                        fontWeight: "700",
                        letterSpacing: -0.3,
                      }}>
                        Processing...
                      </Text>
                    </View>
                  ) : (
                    <Text style={{
                      color: "#FFFFFF",
                      fontSize: 17,
                      fontWeight: "700",
                      letterSpacing: -0.3,
                    }}>
                      Unlock My Plan
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Footer Links */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 16,
              }}>
                <Pressable onPress={handleRestore}>
                  <Text style={{ color: "#64748b", fontSize: 12 }}>Terms</Text>
                </Pressable>
                <Text style={{ color: "#94A3B8", fontSize: 12, marginHorizontal: 8 }}>•</Text>
                <Pressable onPress={handleRestore}>
                  <Text style={{ color: "#64748b", fontSize: 12 }}>Privacy</Text>
                </Pressable>
                <Text style={{ color: "#94A3B8", fontSize: 12, marginHorizontal: 8 }}>•</Text>
                <Pressable onPress={handleRestore}>
                  <Text style={{ color: "#64748b", fontSize: 12 }}>Restore</Text>
                </Pressable>
              </View>
            </View>
            </BlurView>
          </View>
        </>
      )}
    </View>
  );
}
