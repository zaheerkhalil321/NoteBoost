import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";
import { ProgressBar } from "../components/ProgressBar";

type PainPointScreen3Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PainPoint3">;
};

export default function PainPointScreen3({ navigation }: PainPointScreen3Props) {
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Card animations for staggered appearance
  const cardAnims = useRef(
    Array.from({ length: 3 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(40),
      scale: new Animated.Value(0.9),
    }))
  ).current;

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

    // Stagger card animations
    cardAnims.forEach((card, index) => {
      setTimeout(() => {
        // Haptic feedback as card appears
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        Animated.parallel([
          Animated.timing(card.opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(card.translateY, {
            toValue: 0,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.spring(card.scale, {
            toValue: 1,
            tension: 40,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      }, 800 + index * 150); // Start after text, stagger by 150ms
    });
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("Commitment");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Multi-layer gradient background */}
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
            <ProgressBar currentScreen="PainPoint3" />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 40,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main heading */}
        <Animated.Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#1e293b",
            textAlign: "center",
            lineHeight: 40,
            marginBottom: 50,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          Poor notes are costing you more than you think
        </Animated.Text>

        {/* Problem cards */}
        <Animated.View
          style={{
            gap: 16,
            opacity: fadeAnim,
          }}
        >
          {/* Card 1 - Wasted Time */}
          <Animated.View
            style={{
              opacity: cardAnims[0].opacity,
              transform: [
                { translateY: cardAnims[0].translateY },
                { scale: cardAnims[0].scale },
              ],
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderRadius: 20,
                padding: 24,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 16,
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
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 32 }}>⏰</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: 8,
                  }}
                >
                  Wasted Time
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: "#64748b",
                    lineHeight: 22,
                  }}
                >
                  Hours spent re-reading content you already covered because your notes didn't stick
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Card 2 - Stress & Anxiety */}
          <Animated.View
            style={{
              opacity: cardAnims[1].opacity,
              transform: [
                { translateY: cardAnims[1].translateY },
                { scale: cardAnims[1].scale },
              ],
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderRadius: 20,
                padding: 24,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 16,
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
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "rgba(251, 146, 60, 0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 32 }}>😰</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 20,
                  fontWeight: "700",
                  color: "#1e293b",
                  marginBottom: 8,
                }}
              >
                Stress & Anxiety
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: "#64748b",
                  lineHeight: 22,
                }}
              >
                Constant worry about missing key points or falling behind your peers
              </Text>
            </View>
          </View>
          </Animated.View>

          {/* Card 3 - Missed Opportunities */}
          <Animated.View
            style={{
              opacity: cardAnims[2].opacity,
              transform: [
                { translateY: cardAnims[2].translateY },
                { scale: cardAnims[2].scale },
              ],
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderRadius: 20,
                padding: 24,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 16,
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
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "rgba(96, 165, 250, 0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 32 }}>📉</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#1e293b",
                    marginBottom: 8,
                  }}
                >
                  Missed Opportunities
                </Text>
                <Text
                style={{
                  fontSize: 15,
                  color: "#64748b",
                  lineHeight: 22,
                }}
              >
                Lower performance affecting grades, promotions, and career advancement
              </Text>
            </View>
          </View>
          </Animated.View>
        </Animated.View>

        {/* Bottom message */}
        <Animated.Text
          style={{
            fontSize: 17,
            color: "#64748b",
            textAlign: "center",
            lineHeight: 26,
            marginTop: 40,
            paddingHorizontal: 10,
            opacity: fadeAnim,
            fontWeight: "500",
          }}
        >
          NoteBoost AI can eliminate all these problems and unlock your full potential
        </Animated.Text>
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
        }}
      >
        {/* Gradient fade at bottom */}
        <LinearGradient
          colors={["rgba(255, 249, 230, 0)", "rgba(255, 249, 230, 0.95)", "#FFF9E6"]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 150,
            pointerEvents: "none",
          }}
        />

        <Animated.View style={{ opacity: fadeAnim }}>
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
