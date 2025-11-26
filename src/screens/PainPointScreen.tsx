import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";
import { ProgressBar } from "../components/ProgressBar";

type PainPointScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PainPoint">;
};

export default function PainPointScreen({ navigation }: PainPointScreenProps) {
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Shake animation for red X - starts after initial animations
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(2000), // Pause before next shake
        ])
      ).start();
    }, 1200);
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PainPoint2");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Gradient Background - Blue to Yellow (same as Welcome) */}
      <LinearGradient
        colors={["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]}
        locations={[0, 0.4, 0.7, 1]}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />

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
            <ProgressBar currentScreen="PainPoint" />
          </View>
        </View>
      </View>

      {/* Content */}
      <View
        style={{
          flex: 1,
          paddingTop: 24,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 24,
          justifyContent: "space-between",
        }}
      >
        {/* Top section - Visual representation */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          {/* Illustration of notes piling up */}
          <View style={{ position: "relative", marginBottom: 60 }}>
            {/* Stack of messy notes visual */}
            <View
              style={{
                width: 280,
                height: 320,
                position: "relative",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Background note - tilted left */}
              <View
                style={{
                  position: "absolute",
                  width: 180,
                  height: 220,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  transform: [{ rotate: "-12deg" }],
                  top: 20,
                  left: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                {/* Simulated text lines */}
                {[...Array(8)].map((_, i) => (
                  <View
                    key={i}
                    style={{
                      height: 2,
                      backgroundColor: "rgba(30, 41, 59, 0.2)",
                      marginHorizontal: 16,
                      marginTop: i === 0 ? 20 : 12,
                      width: i % 3 === 0 ? "60%" : "80%",
                      borderRadius: 1,
                    }}
                  />
                ))}
              </View>

              {/* Middle note - tilted right */}
              <View
                style={{
                  position: "absolute",
                  width: 180,
                  height: 220,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  transform: [{ rotate: "8deg" }],
                  top: 30,
                  right: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                {[...Array(8)].map((_, i) => (
                  <View
                    key={i}
                    style={{
                      height: 2,
                      backgroundColor: "rgba(30, 41, 59, 0.2)",
                      marginHorizontal: 16,
                      marginTop: i === 0 ? 20 : 12,
                      width: i % 2 === 0 ? "70%" : "85%",
                      borderRadius: 1,
                    }}
                  />
                ))}
              </View>

              {/* Front note - straight, most visible */}
              <View
                style={{
                  position: "absolute",
                  width: 200,
                  height: 240,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: "rgba(239, 68, 68, 0.5)",
                  top: 40,
                  shadowColor: "#ef4444",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 5,
                }}
              >
                {[...Array(9)].map((_, i) => (
                  <View
                    key={i}
                    style={{
                      height: 2.5,
                      backgroundColor: "rgba(30, 41, 59, 0.25)",
                      marginHorizontal: 20,
                      marginTop: i === 0 ? 24 : 14,
                      width: i % 3 === 1 ? "75%" : "90%",
                      borderRadius: 1,
                    }}
                  />
                ))}
              </View>

              {/* Red X mark overlay */}
              <Animated.View
                style={{
                  position: "absolute",
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "rgba(239, 68, 68, 0.9)",
                  justifyContent: "center",
                  alignItems: "center",
                  top: 160,
                  shadowColor: "#ef4444",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.6,
                  shadowRadius: 20,
                  elevation: 10,
                  transform: [{ rotate: shakeAnim.interpolate({
                    inputRange: [-10, 10],
                    outputRange: ['-10deg', '10deg'],
                  })}],
                }}
              >
                <Text style={{ fontSize: 48, color: "white", fontWeight: "bold" }}>✗</Text>
              </Animated.View>
            </View>
          </View>

          {/* Main message */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "#1e293b",
                textAlign: "center",
                lineHeight: 40,
                marginBottom: 20,
                paddingHorizontal: 10,
              }}
            >
              Most notes go unread and your effort is wasted
            </Text>

            <Text
              style={{
                fontSize: 17,
                color: "#64748b",
                textAlign: "center",
                lineHeight: 26,
                paddingHorizontal: 15,
              }}
            >
              Let's change that and make every note count.
            </Text>
          </Animated.View>
        </View>

        {/* Next button - Same gradient style as Welcome */}
        <Animated.View
          style={{
            opacity: fadeAnim,
          }}
        >
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => ({
              overflow: "hidden",
              borderRadius: 16,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 4,
            })}
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
