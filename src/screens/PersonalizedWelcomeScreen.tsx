import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useOnboardingStore } from "../state/onboardingStore";
import * as Haptics from "expo-haptics";

export default function PersonalizedWelcomeScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const { userName, userProfile } = useOnboardingStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Haptic feedback on load
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.sequence([
      // Fade in main content
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Animate icon
      Animated.delay(200),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      // Animate progress bar
      Animated.parallel([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]),
      // Wait then fade out
      Animated.delay(500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, []);

  // Personalized message based on answers
  const getPersonalizedMessage = () => {
    if (!userProfile) return "You're all set!";

    const { mainStruggle, dreamOutcome, commitment } = userProfile;

    if (commitment === "all-in" || commitment === "serious") {
      return "Your transformation starts now";
    }

    if (mainStruggle === "retention" && dreamOutcome === "retention") {
      return "Master and retain your knowledge";
    }

    if (mainStruggle === "overwhelm" && dreamOutcome === "efficient") {
      return "Work smarter, not harder";
    }

    if (mainStruggle === "grades" && dreamOutcome === "top-grades") {
      return "Achieve your goals faster";
    }

    return "Your personalized experience awaits";
  };

  const getMotivationalIcon = () => {
    if (!userProfile) return "flash";
    const { commitment, dreamOutcome } = userProfile;

    if (commitment === "all-in") return "rocket-outline";
    if (dreamOutcome === "top-grades") return "trophy-outline";
    if (dreamOutcome === "confident") return "shield-checkmark-outline";
    return "flash-outline";
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={["#0a0a0a", "#1a1a1a", "#0f2a2a"]}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 32,
        }}
      >
        <View style={{ alignItems: "center", width: "100%" }}>
          {/* Icon Circle with subtle shadow */}
          <Animated.View
            style={{
              transform: [{ scale: iconScaleAnim }],
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#06b6d4",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 40,
              shadowColor: "#06b6d4",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <Ionicons name={getMotivationalIcon() as any} size={56} color="white" />
          </Animated.View>

          {/* Success indicator */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: "rgba(6, 182, 212, 0.1)",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(6, 182, 212, 0.3)",
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#10b981",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 10,
              }}
            >
              <Ionicons name="checkmark" size={14} color="white" />
            </View>
            <Text
              style={{
                color: "#06b6d4",
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              Setup Complete
            </Text>
          </View>

          {/* Main heading */}
          <Text
            style={{
              color: "white",
              fontSize: 32,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 16,
              letterSpacing: -0.5,
            }}
          >
            Welcome, {userName}!
          </Text>

          {/* Personalized message */}
          <Text
            style={{
              color: "#06b6d4",
              fontSize: 20,
              fontWeight: "600",
              textAlign: "center",
              marginBottom: 24,
              lineHeight: 28,
            }}
          >
            {getPersonalizedMessage()}
          </Text>

          {/* Description */}
          <Text
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: 16,
              textAlign: "center",
              lineHeight: 24,
              marginBottom: 40,
              paddingHorizontal: 16,
            }}
          >
            We've set everything up just for you. Your personalized learning experience is ready.
          </Text>

          {/* Progress bar */}
          <View style={{ width: "100%", maxWidth: 300 }}>
            <View
              style={{
                height: 4,
                backgroundColor: "rgba(6, 182, 212, 0.2)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Animated.View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: progressWidth,
                  backgroundColor: "#06b6d4",
                  borderRadius: 2,
                }}
              />
            </View>
            <Text
              style={{
                color: "rgba(255, 255, 255, 0.4)",
                fontSize: 13,
                textAlign: "center",
                marginTop: 12,
              }}
            >
              Loading your experience...
            </Text>
          </View>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}
