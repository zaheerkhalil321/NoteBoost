import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressBar } from "../components/ProgressBar";
import { Gift, UserPlus, Users, Sparkles } from 'lucide-react-native';
import InviteBottomSheet from '../components/InviteBottomSheet';
import { BlurView } from 'expo-blur';
import { checkNoteAccess } from '../services/noteAccessService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'InviteReferral'>;

// Animated Feature Card Component
const AnimatedFeatureCard = ({
  children,
  delay = 0
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
      }}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

export default function InviteReferralScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [showInviteSheet, setShowInviteSheet] = useState(false);

  // Animation values for hero section
  const heroFadeAnim = useRef(new Animated.Value(0)).current;
  const heroScaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(heroScaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Ensure sheet is closed before navigating back
    setShowInviteSheet(false);
    navigation.goBack();
  };

  const handleGetStarted = async() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // check if user has subscription or credits
    const noteAccess = await checkNoteAccess();
    if (noteAccess.canCreate) {
      navigation.navigate('Home');
      return;
    }
    navigation.navigate('Paywall');
  };

  const handleInviteFriends = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowInviteSheet(true);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Beautiful gradient background - matching app design system */}
      <LinearGradient
        colors={["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]}
        locations={[0, 0.4, 0.7, 1]}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />

      {/* Subtle texture overlay */}
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0.05,
        }}
      >
        {Array.from({ length: 60 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              borderRadius: 50,
              backgroundColor: "#60A5FA",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.4 + 0.1,
            }}
          />
        ))}
      </View>

      {/* Header with progress bar and back button */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.8)",
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.6 : 1,
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 2,
            })}
          >
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <ProgressBar currentScreen="InviteReferral" />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180, paddingHorizontal: 24 }}
      >
        {/* Hero Section with Animation */}
        <Animated.View
          style={{
            alignItems: "center",
            marginTop: 20,
            opacity: heroFadeAnim,
            transform: [{ scale: heroScaleAnim }],
          }}
        >
          {/* Modern gift icon with clean design */}
          <View
            style={{
              marginBottom: 32,
              alignItems: "center",
            }}
          >
            {/* Main gift container with modern flat design */}
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: "#3B82F6",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#3B82F6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              <Gift size={38} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </View>

          {/* Title and Description */}
          <Text
            style={{
              fontSize: 36,
              fontWeight: "800",
              color: "#1e293b",
              textAlign: "center",
              marginBottom: 12,
              lineHeight: 42,
              letterSpacing: -0.5,
            }}
          >
            Invite Friends
          </Text>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "500",
              color: "#64748b",
              textAlign: "center",
              lineHeight: 26,
              paddingHorizontal: 12,
              marginBottom: 40,
            }}
          >
            Invite 3 friends and unlock 5 free credits together
          </Text>
        </Animated.View>

        {/* Feature Cards - Clean and Minimal with Animations */}
        <View style={{ gap: 16, marginBottom: 20 }}>
          {/* Feature 1 - Glassmorphic */}
          <AnimatedFeatureCard delay={200}>
            <BlurView
              intensity={20}
              tint="light"
              style={{
                borderRadius: 20,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: "rgba(255, 255, 255, 0.8)",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.75)",
                }}
              />
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: "rgba(239, 246, 255, 0.9)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(147, 197, 253, 0.3)",
                }}
              >
                <UserPlus size={26} color="#3B82F6" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: 3,
                  }}
                >
                  Unlock Premium Together
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#64748b",
                    lineHeight: 20,
                  }}
                >
                  Share the power of AI learning
                </Text>
              </View>
            </BlurView>
          </AnimatedFeatureCard>

          {/* Feature 2 - Glassmorphic */}
          <AnimatedFeatureCard delay={400}>
            <BlurView
              intensity={20}
              tint="light"
              style={{
                borderRadius: 20,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: "rgba(255, 255, 255, 0.8)",
                shadowColor: "#FCD34D",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.75)",
                }}
              />
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: "rgba(255, 251, 235, 0.9)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(251, 191, 36, 0.3)",
                }}
              >
                <Gift size={26} color="#F59E0B" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: 3,
                  }}
                >
                  Earn Exclusive Rewards
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#64748b",
                    lineHeight: 20,
                  }}
                >
                  Get bonuses for each friend
                </Text>
              </View>
            </BlurView>
          </AnimatedFeatureCard>

          {/* Feature 3 - Glassmorphic */}
          <AnimatedFeatureCard delay={600}>
            <BlurView
              intensity={20}
              tint="light"
              style={{
                borderRadius: 20,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
                overflow: 'hidden',
                borderWidth: 1.5,
                borderColor: "rgba(255, 255, 255, 0.8)",
                shadowColor: "#6EE7B7",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.75)",
                }}
              />
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: "rgba(240, 253, 244, 0.9)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(110, 231, 183, 0.3)",
                }}
              >
                <Users size={26} color="#10B981" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: 3,
                  }}
                >
                  Build a Learning Community
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#64748b",
                    lineHeight: 20,
                  }}
                >
                  Learn smarter with friends
                </Text>
              </View>
            </BlurView>
          </AnimatedFeatureCard>
        </View>
      </ScrollView>

      {/* Fixed Bottom Buttons - Matching App Style */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View style={{ paddingHorizontal: 24, gap: 16 }}>
          <Pressable
            onPress={handleInviteFriends}
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <View
              style={{
                borderRadius: 16,
                borderWidth: 2,
                borderColor: "#60A5FA",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                paddingVertical: 18,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  color: "#60A5FA",
                  fontSize: 18,
                  fontWeight: "700",
                  letterSpacing: -0.3,
                }}
              >
                Invite 3 Friends
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              {
                overflow: "hidden",
                borderRadius: 16,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                shadowColor: "#3B82F6",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 4,
              }
            ]}
          >
            <LinearGradient
              colors={["#60A5FA", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 18,
                alignItems: "center",
                borderRadius: 16,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 18,
                  fontWeight: "700",
                  letterSpacing: -0.3,
                }}
              >
                Get Started
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      {/* Invite Bottom Sheet with integrated redeem functionality */}
      <InviteBottomSheet
        visible={showInviteSheet}
        onClose={() => setShowInviteSheet(false)}
      />
    </View>
  );
}
