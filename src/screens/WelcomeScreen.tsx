import React, { useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, Animated, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";

// Updated: Beautiful rounded button styling
type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Welcome">;
};

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleGetStarted = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("ReferralOnboarding");
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Gradient Background - Blue to Yellow */}
      <LinearGradient
        colors={["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]}
        locations={[0, 0.4, 0.7, 1]}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />

      {/* Content */}
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
        }}
      >
        {/* Centered mascot and branding */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: "center",
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          {/* Mascot Image - clean iOS style with glow */}
          <View
            style={{
              width: 160,
              height: 160,
              marginBottom: 24,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Animated glow effect */}
            <Animated.View
              style={{
                position: "absolute",
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: "#7DD3FC",
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.15, 0.3],
                }),
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1],
                    }),
                  },
                ],
              }}
            />
            <Image
              source={require("../assets/images/mascot-new.png")}
              style={{
                width: 160,
                height: 160,
              }}
              resizeMode="contain"
              defaultSource={require("../assets/images/mascot-new.png")}
            />
          </View>

          {/* App Name - clean and modern */}
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <Text
              style={{
                fontSize: 44,
                fontWeight: "700",
                color: "#1e293b",
                textAlign: "center",
                letterSpacing: -1,
              }}
            >
              NoteBoost{" "}
              <Text style={{ color: "#7DD3FC", fontWeight: "800" }}>AI</Text>
            </Text>
          </View>

          {/* Tagline */}
          <Text
            style={{
              fontSize: 18,
              color: "#64748b",
              textAlign: "center",
              letterSpacing: -0.2,
              lineHeight: 26,
              paddingHorizontal: 20,
              fontWeight: "500",
              marginBottom: 24,
            }}
          >
            Transform your learning in just days
          </Text>

          {/* Social Proof Badge - Glassmorphic */}
          <View
            style={{
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.5)",
              overflow: "hidden",
              shadowColor: "#60A5FA",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <BlurView
              intensity={20}
              tint="light"
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 10,
                gap: 8,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
              }}
            >
              <Text style={{ fontSize: 20 }}>⭐</Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#1e293b",
                }}
              >
                Trusted by 100K+ users
              </Text>
            </BlurView>
          </View>
        </Animated.View>

        {/* Get Started Button - Matching Onboarding Style */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => ({
              overflow: "hidden",
              borderRadius: 16,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 4,
            })}
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
        </Animated.View>
      </View>
    </View>
  );
}
