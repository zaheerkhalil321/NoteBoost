import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";
import { ProgressBar } from "../components/ProgressBar";

type AIGenerationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "AIGeneration">;
};

const steps = [
  "Analyzing your learning preferences",
  "Building personalized AI model",
  "Crafting study strategies",
  "Finalizing your AI system",
];

export default function AIGenerationScreen({ navigation }: AIGenerationScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(-1);
  const [typedText, setTypedText] = useState<string[]>(steps.map(() => "")); // Track typed text for each step
  const [headingText, setHeadingText] = useState(""); // Track typed heading text
  const [displayProgress, setDisplayProgress] = useState(0); // For displaying percentage

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const orbitRotation = useRef(new Animated.Value(0)).current;
  const sparkleScale = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Bullet point animations (one for each step)
  const bulletAnims = useRef(
    steps.map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(-20),
    }))
  ).current;

  // Typewriter effect function
  const typewriterEffect = (text: string, stepIndex: number, startDelay: number) => {
    const chars = text.split("");
    chars.forEach((char, charIndex) => {
      setTimeout(() => {
        setTypedText((prev) => {
          const newTypedText = [...prev];
          newTypedText[stepIndex] = text.substring(0, charIndex + 1);
          return newTypedText;
        });

        // Haptic feedback every 3 characters
        if (charIndex % 3 === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, startDelay + charIndex * 40); // 40ms per character
    });
  };

  // Typewriter effect for heading
  const typewriterHeading = (text: string, startDelay: number) => {
    console.log("[AIGeneration] Starting heading typewriter:", text);
    const chars = text.split("");
    chars.forEach((char, charIndex) => {
      setTimeout(() => {
        setHeadingText(text.substring(0, charIndex + 1));
        if (charIndex === 0) {
          console.log("[AIGeneration] First character typed:", text.substring(0, 1));
        }
        if (charIndex === chars.length - 1) {
          console.log("[AIGeneration] Heading complete:", text);
        }

        // Haptic feedback every 3 characters for heading (less frequent)
        if (charIndex % 3 === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }, startDelay + charIndex * 100); // 100ms per character for heading (slower)
    });
  };

  useEffect(() => {
    console.log("[AIGeneration] Component mounted");

    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Start heading typewriter effect
    typewriterHeading("Generating personalized plan", 400);

    // Continuous orbit rotation
    Animated.loop(
      Animated.timing(orbitRotation, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    // Sparkle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleScale, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Progress animation with bullet points
    const headingDuration = 400 + (30 * 100); // 400ms delay + 30 chars * 100ms = 3400ms
    const totalDuration = 8000; // 8 seconds total for bullets
    const stepDuration = totalDuration / steps.length;

    // Animate progress bar - start after heading completes
    setTimeout(() => {
      // Add listener to update display progress
      progressAnim.addListener(({ value }) => {
        setDisplayProgress(Math.round(value * 100));
      });

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: totalDuration,
        useNativeDriver: false,
      }).start();
    }, headingDuration);

    // Show bullet points one by one - start after heading completes
    steps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index);

        // Haptic feedback for bullet appearing
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Animate bullet point
        Animated.parallel([
          Animated.timing(bulletAnims[index].opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(bulletAnims[index].translateX, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();

        // Start typewriter effect for this step
        typewriterEffect(step, index, 200); // Start typing 200ms after bullet appears
      }, headingDuration + (stepDuration * index));
    });

    // Navigate to plan ready screen after completion
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace("PlanReady");
    }, headingDuration + totalDuration + 500);

    // Cleanup listener on unmount
    return () => {
      progressAnim.removeAllListeners();
    };
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const rotate = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Unified light gradient background */}
      <LinearGradient
        colors={["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]}
        locations={[0, 0.4, 0.7, 1]}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />

      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          marginBottom: 12,
        }}
      >
        {/* Back button and Progress Bar in horizontal layout */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* Back button */}
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
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

          {/* Progress Bar takes remaining space */}
          <View style={{ flex: 1 }}>
            <ProgressBar currentScreen="AIGeneration" />
          </View>
        </View>
      </View>

      {/* Content */}
      <Animated.View
        style={{
          flex: 1,
          paddingHorizontal: 32,
          paddingBottom: insets.bottom + 40,
          opacity: fadeAnim,
        }}
      >
        {/* Heading with typewriter effect */}
        <Text
          numberOfLines={0}
          style={{
            fontSize: 32,
            fontWeight: "800",
            color: "#0f172a",
            textAlign: "center",
            lineHeight: 40,
            marginTop: 60,
            marginBottom: 60,
            minHeight: 80,
            height: undefined,
          }}
        >
          {headingText || " "}
        </Text>

        {/* Animated orbit visualization */}
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            height: 320,
            marginBottom: 40,
          }}
        >
          {/* Outer orbit ring */}
          <View
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              borderRadius: 140,
              borderWidth: 1,
              borderColor: "rgba(96, 165, 250, 0.3)",
              borderStyle: "dashed",
            }}
          />

          {/* Middle orbit ring */}
          <View
            style={{
              position: "absolute",
              width: 200,
              height: 200,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: "rgba(96, 165, 250, 0.4)",
              borderStyle: "dashed",
            }}
          />

          {/* Rotating orbit items */}
          <Animated.View
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              transform: [{ rotate }],
            }}
          >
            {/* Brain icon */}
            <View
              style={{
                position: "absolute",
                top: -15,
                left: "50%",
                marginLeft: -15,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "rgba(96, 165, 250, 0.2)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="bulb-outline" size={16} color="#60A5FA" />
            </View>

            {/* Book icon */}
            <View
              style={{
                position: "absolute",
                right: -15,
                top: "50%",
                marginTop: -15,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "rgba(96, 165, 250, 0.2)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="book-outline" size={16} color="#60A5FA" />
            </View>

            {/* Sparkle icon */}
            <View
              style={{
                position: "absolute",
                bottom: -15,
                left: "50%",
                marginLeft: -15,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "rgba(96, 165, 250, 0.2)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="flash-outline" size={16} color="#60A5FA" />
            </View>

            {/* Chart icon */}
            <View
              style={{
                position: "absolute",
                left: -15,
                top: "50%",
                marginTop: -15,
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "rgba(96, 165, 250, 0.2)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="bar-chart-outline" size={16} color="#60A5FA" />
            </View>
          </Animated.View>

          {/* Center glowing circle */}
          <Animated.View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#60A5FA",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#60A5FA",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
              shadowRadius: 40,
              elevation: 10,
            }}
          >
            <Animated.View style={{ transform: [{ scale: sparkleScale }] }}>
              <Ionicons name="sparkles" size={50} color="white" />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Progress section */}
        <View style={{ marginTop: 20 }}>
          {/* Progress bar */}
          <View
            style={{
              height: 6,
              backgroundColor: "rgba(96, 165, 250, 0.2)",
              borderRadius: 3,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: progressWidth,
                backgroundColor: "#60A5FA",
                borderRadius: 3,
              }}
            />
          </View>

          {/* Status text */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#60A5FA",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {currentStep === steps.length - 1 ? "FINALIZING" : "PROCESSING"}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#60A5FA",
              }}
            >
              {displayProgress}%
            </Text>
          </View>

          {/* Bullet points - animated one by one with typewriter effect */}
          <View style={{ gap: 16 }}>
            {steps.map((step, index) => (
              <Animated.View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  opacity: bulletAnims[index].opacity,
                  transform: [{ translateX: bulletAnims[index].translateX }],
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#60A5FA",
                  }}
                />
                <Text
                  numberOfLines={0}
                  style={{
                    fontSize: 16,
                    color: "#0f172a",
                    flex: 1,
                    fontWeight: "600",
                    height: undefined,
                    minHeight: 20,
                  }}
                >
                  {typedText[index] || " "}
                </Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
