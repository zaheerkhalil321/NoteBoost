import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Dimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";
import { ProgressBar } from "../components/ProgressBar";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { getPremiumPressableStyle } from "../config/animations";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const { width } = Dimensions.get("window");

type SuccessRateScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "SuccessRate">;
};

export default function SuccessRateScreen({ navigation }: SuccessRateScreenProps) {
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const stat1Anim = useRef(new Animated.Value(0)).current;
  const stat2Anim = useRef(new Animated.Value(0)).current;
  const stat3Anim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const icon1PulseAnim = useRef(new Animated.Value(1)).current;
  const icon2PulseAnim = useRef(new Animated.Value(1)).current;
  const icon3PulseAnim = useRef(new Animated.Value(1)).current;

  // Circle dimensions
  const circleSize = Math.min(width * 0.55, 220);
  const strokeWidth = 12;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate circular progress
    Animated.timing(progressAnim, {
      toValue: 0.943,
      duration: 2000,
      delay: 400,
      useNativeDriver: true,
    }).start();

    // Continuous rotation animation for the circle gradient
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Pulsing glow animation
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

    // Animate stats with delay
    setTimeout(() => {
      Animated.timing(stat1Anim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // Start icon pulse animation after card appears
        Animated.loop(
          Animated.sequence([
            Animated.timing(icon1PulseAnim, {
              toValue: 1.15,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(icon1PulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 1200);

    setTimeout(() => {
      Animated.timing(stat2Anim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // Start icon pulse animation after card appears
        Animated.loop(
          Animated.sequence([
            Animated.timing(icon2PulseAnim, {
              toValue: 1.15,
              duration: 1100,
              useNativeDriver: true,
            }),
            Animated.timing(icon2PulseAnim, {
              toValue: 1,
              duration: 1100,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 1500);

    setTimeout(() => {
      Animated.timing(stat3Anim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // Start icon pulse animation after card appears
        Animated.loop(
          Animated.sequence([
            Animated.timing(icon3PulseAnim, {
              toValue: 1.15,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(icon3PulseAnim, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 1800);
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace("ResultsTimeline");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
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
            style={({ pressed }) => getPremiumPressableStyle(pressed, {
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.8)",
              justifyContent: "center",
              alignItems: "center",
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
            <ProgressBar currentScreen="SuccessRate" />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: insets.bottom + 100
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Beautiful Circular Progress with 94.3% in center */}
          <View style={{ alignItems: "center", marginTop: 10, marginBottom: 40 }}>
            <Animated.View
              style={{
                transform: [{ scale: scaleAnim }],
              }}
            >
              {/* Outer glow effect */}
              <Animated.View
                style={{
                  position: "absolute",
                  width: circleSize + 40,
                  height: circleSize + 40,
                  left: -20,
                  top: -20,
                  borderRadius: (circleSize + 40) / 2,
                  backgroundColor: "#60A5FA",
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 0.25],
                  }),
                }}
              />

              {/* Glassmorphic circle container */}
              <View
                style={{
                  width: circleSize,
                  height: circleSize,
                  borderRadius: circleSize / 2,
                  backgroundColor: "rgba(255, 255, 255, 0.65)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.9)",
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#7DD3FC",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 20,
                  elevation: 8,
                }}
              >
                {/* SVG Animated Circle */}
                <Svg
                  width={circleSize}
                  height={circleSize}
                  style={{ position: "absolute" }}
                >
                  <Defs>
                    <RadialGradient id="grad" cx="50%" cy="50%" r="50%">
                      <Stop offset="0%" stopColor="#60A5FA" stopOpacity="1" />
                      <Stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
                    </RadialGradient>
                  </Defs>

                  {/* Background circle */}
                  <Circle
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={radius}
                    stroke="rgba(96, 165, 250, 0.15)"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />

                  {/* Animated progress circle */}
                  <AnimatedCircle
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={radius}
                    stroke="url(#grad)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [circumference, 0],
                    })}
                    transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
                  />
                </Svg>

                {/* Center text - 94.3% */}
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 52,
                      fontWeight: "800" as any,
                      color: "#1e293b",
                      letterSpacing: -1,
                    }}
                  >
                    94.3%
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600" as any,
                      color: "#60A5FA",
                      marginTop: 4,
                      letterSpacing: 0.5,
                    }}
                  >
                    SUCCESS RATE
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Subheading */}
            <Text
              style={{
                fontSize: 16,
                color: "#64748b",
                lineHeight: 24,
                textAlign: "center",
                marginTop: 32,
                marginBottom: 8,
                fontWeight: "500" as any,
                letterSpacing: 0.3,
              }}
            >
              Join thousands who've mastered their notes
            </Text>
          </View>

          {/* Stats section heading */}
          <View style={{ marginBottom: 16, marginTop: 8 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#1e293b",
                textAlign: "center",
                lineHeight: 32,
              }}
            >
              Real Results from Real Users
            </Text>
          </View>

          {/* Glassmorphic stat cards - Redesigned */}
          <View style={{ gap: 16, marginTop: 10 }}>
            {/* Stat 1 - Results Timeline */}
            <Animated.View
              style={{
                opacity: stat1Anim,
                transform: [
                  {
                    translateY: stat1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                  {
                    scale: stat1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  borderWidth: 1.5,
                  borderColor: "rgba(226, 232, 240, 0.5)",
                  borderRadius: 24,
                  padding: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: "#7DD3FC",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                {/* Icon in circle */}
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "rgba(96, 165, 250, 0.15)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: icon1PulseAnim }],
                    }}
                  >
                    <Ionicons name="time-outline" size={32} color="#60A5FA" />
                  </Animated.View>
                </View>

                {/* Text content */}
                <View style={{ flex: 1, marginLeft: 20 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: "#1e293b",
                      marginBottom: 4,
                    }}
                  >
                    Save 2+ Hours Daily
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#64748b",
                      lineHeight: 20,
                    }}
                  >
                    Stop wasting time searching through notes
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Stat 2 - Effortless System */}
            <Animated.View
              style={{
                opacity: stat2Anim,
                transform: [
                  {
                    translateY: stat2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                  {
                    scale: stat2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  borderWidth: 1.5,
                  borderColor: "rgba(226, 232, 240, 0.5)",
                  borderRadius: 24,
                  padding: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: "#7DD3FC",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                {/* Icon in circle */}
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "rgba(34, 197, 94, 0.15)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: icon2PulseAnim }],
                    }}
                  >
                    <Ionicons name="checkmark-circle-outline" size={32} color="#22C55E" />
                  </Animated.View>
                </View>

                {/* Text content */}
                <View style={{ flex: 1, marginLeft: 20 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: "#1e293b",
                      marginBottom: 4,
                    }}
                  >
                    Effortless Organization
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#64748b",
                      lineHeight: 20,
                    }}
                  >
                    AI keeps everything perfectly organized
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Stat 3 - Focus & Confidence */}
            <Animated.View
              style={{
                opacity: stat3Anim,
                transform: [
                  {
                    translateY: stat3Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                  {
                    scale: stat3Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ],
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  borderWidth: 1.5,
                  borderColor: "rgba(226, 232, 240, 0.5)",
                  borderRadius: 24,
                  padding: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: "#7DD3FC",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                {/* Icon in circle */}
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: icon3PulseAnim }],
                    }}
                  >
                    <Ionicons name="star" size={32} color="#F59E0B" />
                  </Animated.View>
                </View>

                {/* Text content */}
                <View style={{ flex: 1, marginLeft: 20 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "700",
                      color: "#1e293b",
                      marginBottom: 4,
                    }}
                  >
                    Better Grades & Focus
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#64748b",
                      lineHeight: 20,
                    }}
                  >
                    Students report higher test scores
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Fixed Next button at bottom */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 20,
          paddingTop: 20,
          backgroundColor: "transparent",
        }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => getPremiumPressableStyle(pressed, {
              overflow: "hidden",
              borderRadius: 16,
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }, 0.98)}
          >
            <LinearGradient
              colors={["#60A5FA", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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
                Next
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
