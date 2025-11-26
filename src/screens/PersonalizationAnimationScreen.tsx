import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useOnboardingStore } from "../state/onboardingStore";

const personalizationSteps = [
  { icon: "person", emoji: "👤", text: "Setting up your profile", subtext: "Creating your personalized experience..." },
  { icon: "scan", emoji: "🔍", text: "Analyzing your responses", subtext: "Processing your preferences" },
  { icon: "analytics", emoji: "📊", text: "Mapping your strengths", subtext: "Identifying your unique patterns" },
  { icon: "brain", emoji: "🧠", text: "Building AI model", subtext: "Training personalized recommendations" },
  { icon: "bulb", emoji: "💡", text: "Crafting strategies", subtext: "Designing your success roadmap" },
  { icon: "trending-up", emoji: "📈", text: "Optimizing for growth", subtext: "Calibrating difficulty and pacing" },
  { icon: "target", emoji: "🎯", text: "Aligning with goals", subtext: "Matching content to your objectives" },
  { icon: "construct", emoji: "🛠️", text: "Configuring workspace", subtext: "Setting up your environment" },
  { icon: "rocket", emoji: "🚀", text: "Finalizing setup", subtext: "Preparing your personalized experience" },
  { icon: "sparkles", emoji: "✨", text: "Almost ready!", subtext: "Last touches on your journey..." },
];

export default function PersonalizationAnimationScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {

  const { userName, userProfile } = useOnboardingStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  const MAX_CYCLES = 15;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Cycle through steps with a max cycle limit
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = prev + 1;

        // Check if we've reached max cycles
        if (cycleCount >= MAX_CYCLES - 1) {
          clearInterval(stepInterval);
          // Show final message
          setTimeout(() => {
            setShowFinal(true);
          }, 1200);
          return prev;
        }

        // Loop through steps or complete
        if (nextStep >= personalizationSteps.length) {
          setCycleCount(c => c + 1);
          return 0; // Loop back to first step
        }

        setCycleCount(c => c + 1);
        return nextStep;
      });
    }, 2200);

    // Animate progress bar based on max cycles
    const totalDuration = MAX_CYCLES * 2200;
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: totalDuration,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(stepInterval);
  }, [cycleCount]);

  useEffect(() => {
    // Fade in and slide animation for each step
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    pulseAnim.setValue(1);
    iconRotateAnim.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      // Subtle rotation for icon
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [currentStep]);

  useEffect(() => {
    if (showFinal) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(() => {
            onComplete();
          });
        }, 2000);
      });
    }
  }, [showFinal]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const iconRotation = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const getPersonalizedMessage = () => {
    if (!userProfile) return "Your workspace is ready!";

    const { commitment, dreamOutcome, urgency } = userProfile;

    if (commitment === "all-in") {
      return `${userName}, your success starts now!`;
    }

    if (urgency === "now" && dreamOutcome === "top-performance") {
      return `${userName}, you're ready to excel!`;
    }

    if (dreamOutcome === "efficient") {
      return `${userName}, work smarter starts today!`;
    }

    if (dreamOutcome === "confident") {
      return `${userName}, confidence mode activated!`;
    }

    return `Welcome, ${userName}! You're all set!`;
  };

  const getStepSpecificInfo = () => {
    // Different messages based on current step
    if (currentStep === 0) {
      return {
        title: `Welcome, ${userName}!`,
        subtitle: "Building your unique profile"
      };
    } else if (currentStep === 1 || currentStep === 2) {
      return {
        title: "Processing responses",
        subtitle: `Analyzing your key insights`
      };
    } else if (currentStep === 3 || currentStep === 4) {
      return {
        title: "AI training in progress",
        subtitle: userProfile?.learningGoal === "education"
          ? "Optimizing for academic excellence"
          : userProfile?.learningGoal === "professional"
          ? "Tailoring for professional growth"
          : "Customizing for your needs"
      };
    } else if (currentStep === 5 || currentStep === 6) {
      return {
        title: "Goal alignment",
        subtitle: userProfile?.dreamOutcome === "top-performance"
          ? "Calibrating for peak performance"
          : userProfile?.dreamOutcome === "efficient"
          ? "Maximizing efficiency"
          : "Building confidence"
      };
    } else if (currentStep === 7 || currentStep === 8) {
      return {
        title: "Workspace setup",
        subtitle: userProfile?.commitment === "all-in"
          ? "Premium experience activated"
          : "Personalized environment ready"
      };
    } else {
      return {
        title: "Final touches",
        subtitle: "Your journey begins now"
      };
    }
  };

  if (showFinal) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        {/* Multi-layer gradient background - brighter, fading from bottom to corner */}
        <LinearGradient
          colors={["#1a1a1a", "#0f1f1f", "#001a1a", "#0a0a0a"]}
          locations={[0, 0.3, 0.6, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        />

        {/* Subtle noise/texture overlay */}
        <View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0.04,
          }}
        >
          {Array.from({ length: 200 }).map((_, i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                width: 1.5,
                height: 1.5,
                borderRadius: 0.75,
                backgroundColor: "#06b6d4",
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.6 + 0.4,
              }}
            />
          ))}
        </View>

        <Animated.View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* Success checkmark with glow */}
          <View
            style={{
              width: 120,
              height: 120,
              backgroundColor: "#06b6d4",
              borderRadius: 60,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
              shadowColor: "#06b6d4",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Ionicons name="checkmark" size={64} color="white" />
          </View>

          <Text
            style={{
              color: "#1e293b",
              fontSize: 32,
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            {getPersonalizedMessage()}
          </Text>

          <Text
            style={{
              color: "#06b6d4",
              fontSize: 18,
              textAlign: "center",
              marginBottom: 32,
              fontWeight: "500",
            }}
          >
            Your personalized learning experience is ready
          </Text>

          {/* Feature highlights */}
          <View style={{ width: "100%", maxWidth: 340, marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <Ionicons name="flash" size={20} color="#06b6d4" />
              <Text style={{ color: "#d1d5db", fontSize: 14, marginLeft: 12, flex: 1 }}>
                AI-powered notes generation
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <Ionicons name="trophy" size={20} color="#06b6d4" />
              <Text style={{ color: "#d1d5db", fontSize: 14, marginLeft: 12, flex: 1 }}>
                Interactive quizzes & flashcards
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderRadius: 12,
              }}
            >
              <Ionicons name="mic" size={20} color="#06b6d4" />
              <Text style={{ color: "#d1d5db", fontSize: 14, marginLeft: 12, flex: 1 }}>
                Audio & video transcription
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(6, 182, 212, 0.1)",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(6, 182, 212, 0.3)",
            }}
          >
            <Ionicons name="sparkles" size={20} color="#06b6d4" />
            <Text style={{ color: "#06b6d4", fontSize: 14, marginLeft: 8, fontWeight: "600" }}>
              Tailored specifically for you
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Multi-layer gradient background - brighter, fading from bottom to corner */}
      <LinearGradient
        colors={["#1a1a1a", "#0f1f1f", "#001a1a", "#0a0a0a"]}
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />

      {/* Subtle noise/texture overlay */}
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0.04,
        }}
      >
        {Array.from({ length: 200 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: 1.5,
              height: 1.5,
              borderRadius: 0.75,
              backgroundColor: "#06b6d4",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.4,
            }}
          />
        ))}
      </View>

      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
        {/* Main Card Container - similar to onboarding question cards */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            width: "100%",
            maxWidth: 400,
          }}
        >
          {/* Icon Card */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 32,
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            {/* Large Emoji Icon with animations */}
            <Animated.View
              style={{
                width: 100,
                height: 100,
                backgroundColor: "rgba(6, 182, 212, 0.15)",
                borderRadius: 50,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                transform: [{ scale: pulseAnim }, { rotate: iconRotation }],
              }}
            >
              <Text style={{ fontSize: 56 }}>{personalizationSteps[currentStep].emoji}</Text>
            </Animated.View>

            {/* Step Text */}
            <Text
              style={{
                color: "#1e293b",
                fontSize: 24,
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {personalizationSteps[currentStep].text}
            </Text>

            {/* Subtext */}
            <Text
              style={{
                color: "#9ca3af",
                fontSize: 16,
                textAlign: "center",
                marginBottom: 28,
              }}
            >
              {personalizationSteps[currentStep].subtext}
            </Text>

            {/* Progress Bar with glow effect */}
            <View style={{ width: "100%", marginBottom: 12 }}>
              <View
                style={{
                  height: 6,
                  backgroundColor: "#2a2a2a",
                  borderRadius: 3,
                  overflow: "hidden",
                  shadowColor: "#06b6d4",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                }}
              >
                <Animated.View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    backgroundColor: "#06b6d4",
                    borderRadius: 3,
                    width: progressWidth,
                    shadowColor: "#06b6d4",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 6,
                  }}
                />
              </View>
            </View>

            {/* Step Counter */}
            <Text style={{ color: "#6b7280", fontSize: 14 }}>
              {currentStep + 1} of {personalizationSteps.length}
            </Text>
          </View>

          {/* Bottom Info Card - Dynamic based on step */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(6, 182, 212, 0.2)",
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: "rgba(6, 182, 212, 0.15)",
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <Ionicons name="sparkles" size={24} color="#06b6d4" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#1e293b", fontSize: 15, fontWeight: "600", marginBottom: 2 }}>
                {getStepSpecificInfo().title}
              </Text>
              <Text style={{ color: "#9ca3af", fontSize: 13 }}>
                {getStepSpecificInfo().subtitle}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
