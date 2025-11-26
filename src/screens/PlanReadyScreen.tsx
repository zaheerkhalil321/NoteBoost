import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Dimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useOnboardingStore } from "../state/onboardingStore";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { ProgressBar } from "../components/ProgressBar";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const { width } = Dimensions.get("window");

type PlanReadyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PlanReady">;
};

export default function PlanReadyScreen({ navigation }: PlanReadyScreenProps) {
  const insets = useSafeAreaInsets();
  const { userName } = useOnboardingStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;
  const pathDrawAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 12 }, () => ({
      translateY: new Animated.Value(-50),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Success haptic on load
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 1500,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // SVG path draw animation
    Animated.timing(pathDrawAnim, {
      toValue: 1,
      duration: 2000,
      delay: 600,
      useNativeDriver: false, // Can't use native driver for strokeDashoffset
    }).start();

    // Confetti animation - staggered particles
    confettiAnims.forEach((confetti, index) => {
      const delay = 200 + index * 50; // Stagger confetti
      const randomX = (Math.random() - 0.5) * 200; // Random horizontal spread

      setTimeout(() => {
        // Haptic feedback for each confetti burst
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        Animated.parallel([
          Animated.timing(confetti.opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(confetti.translateY, {
            toValue: 400, // Fall down
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(confetti.translateX, {
            toValue: randomX,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(confetti.rotate, {
            toValue: Math.random() * 720 - 360, // Random rotation
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Fade out at the end
          Animated.timing(confetti.opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        });
      }, delay);
    });
  }, []);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("EffectivenessComparison");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("AIGeneration");
  };

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

      {/* Subtle texture overlay */}
      <View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0.06,
        }}
      >
        {Array.from({ length: 120 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: 1.5,
              height: 1.5,
              borderRadius: 0.75,
              backgroundColor: "#ffffff",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.1,
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
        {/* Back button and Progress Bar in horizontal layout */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* Back button - Glassmorphic rounded square design */}
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

          {/* Progress Bar takes remaining space */}
          <View style={{ flex: 1 }}>
            <ProgressBar currentScreen="PlanReady" />
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 32,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Heading */}
          <View style={{ marginTop: 48, marginBottom: 48 }}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "800",
                color: "#1e293b",
                lineHeight: 40,
                marginBottom: 14,
                letterSpacing: -1,
              }}
            >
              Your AI learning system is ready
            </Text>
            <Text
              style={{
                fontSize: 17,
                color: "#64748b",
                lineHeight: 26,
                fontWeight: "500",
              }}
            >
              Master your notes and boost retention in just 4 weeks
            </Text>
          </View>

          {/* Stats cards */}
          <View
            style={{
              flexDirection: "row",
              gap: 14,
              marginBottom: 36,
            }}
          >
            {/* Duration card */}
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderRadius: 20,
                padding: 24,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.8)",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 5,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: "rgba(125, 211, 252, 0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 14,
                  borderWidth: 2,
                  borderColor: "rgba(125, 211, 252, 0.3)",
                }}
              >
                <Ionicons name="time-outline" size={26} color="#7DD3FC" />
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  marginBottom: 6,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                Duration
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: "#1e293b",
                  letterSpacing: -0.5,
                }}
              >
                4 weeks
              </Text>
            </View>

            {/* Daily practice card */}
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderRadius: 20,
                padding: 24,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.8)",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 5,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: "rgba(125, 211, 252, 0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 14,
                  borderWidth: 2,
                  borderColor: "rgba(125, 211, 252, 0.3)",
                }}
              >
                <Ionicons name="stats-chart" size={26} color="#7DD3FC" />
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  marginBottom: 6,
                  fontWeight: "600",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                Daily practice
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: "#1e293b",
                  letterSpacing: -0.5,
                }}
              >
                10 minutes
              </Text>
            </View>
          </View>

          {/* Journey chart - Current → Goal graph */}
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              borderRadius: 24,
              padding: 28,
              marginBottom: 32,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.8)",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 5,
            }}
          >
            {/* Chart title */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: 8,
                letterSpacing: -0.3,
              }}
            >
              Your Learning Progress
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#64748b",
                marginBottom: 24,
                fontWeight: "500",
              }}
            >
              Expected retention improvement over 4 weeks
            </Text>

            {/* Chart */}
            <View style={{ height: 200, position: "relative", paddingLeft: 40, paddingBottom: 30 }}>
              {/* Confetti particles */}
              {confettiAnims.map((confetti, index) => {
                const colors = ["#60A5FA", "#7DD3FC", "#93C5FD", "#BFDBFE", "#FCD34D", "#F59E0B"];
                const shapes = ["●", "■", "▲", "★"];
                return (
                  <Animated.View
                    key={index}
                    style={{
                      position: "absolute",
                      top: -30,
                      left: "50%",
                      opacity: confetti.opacity,
                      transform: [
                        { translateY: confetti.translateY },
                        { translateX: confetti.translateX },
                        { rotate: confetti.rotate.interpolate({
                          inputRange: [-360, 360],
                          outputRange: ['-360deg', '360deg'],
                        })},
                      ],
                    }}
                  >
                    <Text style={{ fontSize: 20, color: colors[index % colors.length] }}>
                      {shapes[index % shapes.length]}
                    </Text>
                  </Animated.View>
                );
              })}

              {/* Y-axis labels */}
              {[100, 75, 50, 25, 0].map((value, i) => (
                <View
                  key={value}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: i * 42.5,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#94a3b8",
                      fontWeight: "600",
                      width: 35,
                      textAlign: "right",
                    }}
                  >
                    {value}%
                  </Text>
                </View>
              ))}

              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: 1,
                    backgroundColor: "#E2E8F0",
                    top: i * 42.5,
                    left: 40,
                  }}
                />
              ))}

              {/* Chart curve */}
              <Animated.View
                style={{
                  position: "absolute",
                  bottom: 30,
                  left: 40,
                  right: 0,
                  height: 170,
                  opacity: chartAnim,
                }}
              >
                <Svg width={width - 152} height={170} viewBox="0 0 280 170">
                  {/* Animated path drawing */}
                  <AnimatedPath
                    d="M 0 140 Q 70 120, 95 90 T 185 40 T 280 5"
                    fill="none"
                    stroke="#7DD3FC"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="500"
                    strokeDashoffset={pathDrawAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [500, 0],
                    })}
                  />
                  <AnimatedPath
                    d="M 0 170 L 0 140 Q 70 120, 95 90 T 185 40 T 280 5 L 280 170 Z"
                    fill="rgba(125, 211, 252, 0.2)"
                    opacity={pathDrawAnim} // Fade in the fill as path draws
                  />
                </Svg>
              </Animated.View>

              {/* Current marker */}
              <View
                style={{
                  position: "absolute",
                  bottom: 48,
                  left: 42,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#64748b",
                  }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    fontWeight: "700",
                    letterSpacing: 0.3,
                  }}
                >
                  Current
                </Text>
              </View>

              {/* Goal marker - positioned on the line */}
              <View
                style={{
                  position: "absolute",
                  top: 5,
                  right: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#7DD3FC",
                  }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    color: "#1e293b",
                    fontWeight: "700",
                    letterSpacing: 0.3,
                  }}
                >
                  Goal
                </Text>
              </View>

              {/* X-axis labels */}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 40,
                  right: 0,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingRight: 10,
                }}
              >
                {["Week 1", "Week 2", "Week 3", "Week 4"].map((week) => (
                  <Text
                    key={week}
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      fontWeight: "600",
                    }}
                  >
                    {week}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Personalized AI Features Card */}
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              borderRadius: 24,
              padding: 28,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.8)",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 5,
            }}
          >
            {/* Header with icon */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "rgba(125, 211, 252, 0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 16,
                  borderWidth: 2,
                  borderColor: "rgba(125, 211, 252, 0.3)",
                }}
              >
                <Ionicons name="sparkles" size={28} color="#7DD3FC" />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#1e293b",
                  letterSpacing: -0.5,
                  flex: 1,
                }}
              >
                Personalized AI Features
              </Text>
            </View>

            {/* Description */}
            <Text
              style={{
                fontSize: 15,
                color: "#64748b",
                lineHeight: 22,
                marginBottom: 20,
                fontWeight: "500",
              }}
            >
              We've curated smart AI tools tailored to your learning style and goals.
            </Text>

            {/* Feature list */}
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="arrow-forward" size={20} color="#7DD3FC" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 15, color: "#1e293b", fontWeight: "600", flex: 1 }}>
                  Smart summaries adapted to your pace
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="arrow-forward" size={20} color="#7DD3FC" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 15, color: "#1e293b", fontWeight: "600", flex: 1 }}>
                  Interactive quizzes for your weak areas
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="arrow-forward" size={20} color="#7DD3FC" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 15, color: "#1e293b", fontWeight: "600", flex: 1 }}>
                  Difficulty levels that grow with you
                </Text>
              </View>
            </View>
          </View>

          {/* Expected Results Card */}
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              borderRadius: 24,
              padding: 28,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.8)",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 5,
            }}
          >
            {/* Header */}
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: "#1e293b",
                marginBottom: 20,
                letterSpacing: -0.5,
              }}
            >
              Expected Results
            </Text>

            {/* Results list */}
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(125, 211, 252, 0.15)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 14,
                    borderWidth: 2,
                    borderColor: "#7DD3FC",
                  }}
                >
                  <Ionicons name="checkmark" size={20} color="#7DD3FC" />
                </View>
                <Text style={{ fontSize: 16, color: "#1e293b", fontWeight: "600", flex: 1 }}>
                  Better information retention
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(125, 211, 252, 0.15)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 14,
                    borderWidth: 2,
                    borderColor: "#7DD3FC",
                  }}
                >
                  <Ionicons name="checkmark" size={20} color="#7DD3FC" />
                </View>
                <Text style={{ fontSize: 16, color: "#1e293b", fontWeight: "600", flex: 1 }}>
                  Improved study efficiency
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(125, 211, 252, 0.15)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 14,
                    borderWidth: 2,
                    borderColor: "#7DD3FC",
                  }}
                >
                  <Ionicons name="checkmark" size={20} color="#7DD3FC" />
                </View>
                <Text style={{ fontSize: 16, color: "#1e293b", fontWeight: "600", flex: 1 }}>
                  Faster learning speed
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(125, 211, 252, 0.15)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 14,
                    borderWidth: 2,
                    borderColor: "#7DD3FC",
                  }}
                >
                  <Ionicons name="checkmark" size={20} color="#7DD3FC" />
                </View>
                <Text style={{ fontSize: 16, color: "#1e293b", fontWeight: "600", flex: 1 }}>
                  Enhanced academic performance
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Fixed Continue button at bottom */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
          paddingTop: 24,
          backgroundColor: "transparent",
        }}
      >
        {/* Gradient fade at bottom - light theme */}
        <LinearGradient
          colors={["rgba(255, 249, 230, 0)", "rgba(255, 249, 230, 0.98)", "#FFF9E6"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 140,
          }}
        />

        <Animated.View style={{ opacity: fadeAnim }}>
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              {
                backgroundColor: "transparent",
                borderRadius: 16,
                overflow: "hidden",
                shadowColor: "#3B82F6",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 6,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <LinearGradient
              colors={["#60A5FA", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 20,
                paddingHorizontal: 32,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 19,
                  fontWeight: "700",
                  letterSpacing: -0.5,
                }}
              >
                Let's Get Started
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
