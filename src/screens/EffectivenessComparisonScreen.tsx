import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";
import { ProgressBar } from "../components/ProgressBar";

type EffectivenessComparisonScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "EffectivenessComparison">;
};

export default function EffectivenessComparisonScreen({ navigation }: EffectivenessComparisonScreenProps) {
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const bar1Anim = useRef(new Animated.Value(0)).current;
  const bar2Anim = useRef(new Animated.Value(0)).current;
  const bar1ScaleAnim = useRef(new Animated.Value(1)).current;
  const bar2ScaleAnim = useRef(new Animated.Value(1)).current;

  // Percentage counter states
  const [bar1Percentage, setBar1Percentage] = useState(0);
  const [bar2Percentage, setBar2Percentage] = useState(0);

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
    ]).start();

    // Animate bar 1 with easing and counter
    setTimeout(() => {
      Animated.timing(bar1Anim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        // Haptic when bar 1 completes
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Bounce effect
        Animated.sequence([
          Animated.spring(bar1ScaleAnim, {
            toValue: 1.05,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(bar1ScaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      });

      // Animate percentage counter for bar 1
      const bar1Interval = setInterval(() => {
        setBar1Percentage((prev) => {
          if (prev >= 28) {
            clearInterval(bar1Interval);
            return 28;
          }
          return prev + 1;
        });
      }, 1500 / 28); // Duration divided by target percentage
    }, 600);

    // Animate bar 2 with easing and counter
    setTimeout(() => {
      Animated.timing(bar2Anim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        // Haptic when bar 2 completes
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Bounce effect
        Animated.sequence([
          Animated.spring(bar2ScaleAnim, {
            toValue: 1.05,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(bar2ScaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      });

      // Animate percentage counter for bar 2
      const bar2Interval = setInterval(() => {
        setBar2Percentage((prev) => {
          if (prev >= 96) {
            clearInterval(bar2Interval);
            return 96;
          }
          return prev + 1;
        });
      }, 1500 / 96); // Duration divided by target percentage
    }, 900);
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.replace("SuccessRate");
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
            <ProgressBar currentScreen="EffectivenessComparison" />
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: "center", paddingBottom: 80 }}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingHorizontal: 24,
          }}
        >
          {/* Heading */}
          <View style={{ marginBottom: 60, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "#1e293b",
                lineHeight: 40,
                textAlign: "center",
              }}
            >
              The smarter way to master information
            </Text>
          </View>

          {/* Comparison Card - Glassmorphic */}
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              borderRadius: 28,
              padding: 32,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.8)",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            {/* Title with checkmark */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                marginBottom: 40,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "rgba(96, 165, 250, 0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="checkmark" size={18} color="#60A5FA" />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#1e293b",
                  letterSpacing: 0.5,
                }}
              >
                Effectiveness Comparison
              </Text>
            </View>

            {/* Bar Chart */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "space-around",
                height: 280,
                marginBottom: 32,
              }}
            >
              {/* Bar 1 - Traditional Notes */}
              <View style={{ alignItems: "center", flex: 1 }}>
                <Animated.Text
                  style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    color: "#94A3B8",
                    marginBottom: 12,
                    transform: [{ scale: bar1ScaleAnim }],
                  }}
                >
                  {bar1Percentage}%
                </Animated.Text>
                <View style={{ height: 200, justifyContent: "flex-end" }}>
                  <Animated.View
                    style={{
                      width: 100,
                      height: 140,
                      borderRadius: 50,
                      overflow: "hidden",
                      transform: [
                        { scaleY: bar1Anim },
                        { scale: bar1ScaleAnim }
                      ],
                      transformOrigin: "bottom",
                    }}
                  >
                  <LinearGradient
                    colors={["#CBD5E1", "#CBD5E1"]}
                    style={{
                      flex: 1,
                      width: "100%",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      width: "100%",
                      height: "72%",
                      backgroundColor: "rgba(226, 232, 240, 0.8)",
                      borderTopLeftRadius: 50,
                      borderTopRightRadius: 50,
                    }}
                  />
                </Animated.View>
                </View>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#64748b",
                    marginTop: 16,
                    textAlign: "center",
                  }}
                >
                  Traditional Notes
                </Text>
              </View>

              {/* Bar 2 - NoteBoost AI */}
              <View style={{ alignItems: "center", flex: 1 }}>
                <Animated.Text
                  style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    color: "#60A5FA",
                    marginBottom: 12,
                    transform: [{ scale: bar2ScaleAnim }],
                  }}
                >
                  {bar2Percentage}%
                </Animated.Text>
                <View style={{ height: 200, justifyContent: "flex-end" }}>
                  <Animated.View
                    style={{
                      width: 100,
                      height: 200,
                      borderRadius: 50,
                      overflow: "hidden",
                      transform: [
                        { scaleY: bar2Anim },
                        { scale: bar2ScaleAnim }
                      ],
                      transformOrigin: "bottom",
                    }}
                  >
                  <LinearGradient
                    colors={["#60A5FA", "#3B82F6", "#2563EB"]}
                    style={{
                      flex: 1,
                      width: "100%",
                    }}
                  />
                </Animated.View>
                </View>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#60A5FA",
                    marginTop: 16,
                    textAlign: "center",
                  }}
                >
                  NoteBoost AI
                </Text>
              </View>
            </View>

            {/* Bottom message */}
            <View
              style={{
                backgroundColor: "rgba(96, 165, 250, 0.1)",
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: "rgba(96, 165, 250, 0.2)",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: "#1e293b",
                  lineHeight: 24,
                  textAlign: "center",
                  fontWeight: "500",
                }}
              >
                NoteBoost AI users retain 96% more effectively than traditional note-takers — in a fraction of the time.
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

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
        }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => ({
              overflow: "hidden",
              borderRadius: 16,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            })}
          >
            <LinearGradient
              colors={["#60A5FA", "#3B82F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 20,
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
