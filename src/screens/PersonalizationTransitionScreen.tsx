import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";
import { ProgressBar } from "../components/ProgressBar";

type PersonalizationTransitionScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PersonalizationTransition">;
};

export default function PersonalizationTransitionScreen({ navigation }: PersonalizationTransitionScreenProps) {
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim1 = useRef(new Animated.Value(0.8)).current;
  const scaleAnim2 = useRef(new Animated.Value(0.8)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Particle animations - 5 particles flowing from left to right
  const particleAnims = useRef(
    Array.from({ length: 5 }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim1, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(arrowAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim2, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous glow animation
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

    // Particle flow animations - staggered
    particleAnims.forEach((particle, index) => {
      const delay = 1000 + index * 300; // Start after icons appear, stagger by 300ms

      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            // Fade in and start moving
            Animated.parallel([
              Animated.timing(particle.opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ]),
            // Move from left icon to right icon with slight curve
            Animated.parallel([
              Animated.timing(particle.translateX, {
                toValue: 200, // Distance between icons
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.timing(particle.translateY, {
                  toValue: -20 + Math.random() * 40, // Random curve
                  duration: 750,
                  useNativeDriver: true,
                }),
                Animated.timing(particle.translateY, {
                  toValue: 0,
                  duration: 750,
                  useNativeDriver: true,
                }),
              ]),
            ]),
            // Fade out near destination
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            // Reset position
            Animated.timing(particle.translateX, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.delay(500), // Pause before next loop
          ])
        ).start();
      }, delay);
    });
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("Onboarding");
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
            <ProgressBar currentScreen="PersonalizationTransition" />
          </View>
        </View>
      </View>

      {/* Content */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 32,
          justifyContent: "space-between",
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Top section */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          {/* Heading */}
          <Animated.View style={{ opacity: fadeAnim, marginBottom: 60 }}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "#1e293b",
                textAlign: "center",
                lineHeight: 40,
                marginBottom: 16,
                paddingHorizontal: 8,
              }}
            >
              Let's build your personalized learning system
            </Text>
            <Text
              style={{
                fontSize: 17,
                color: "#64748b",
                textAlign: "center",
                lineHeight: 26,
                paddingHorizontal: 16,
              }}
            >
              We'll tailor your NoteBoost AI plan to how you think, learn, and retain information
            </Text>
          </Animated.View>

          {/* Flow visualization - Horizontal layout */}
          <View style={{ alignItems: "center", paddingHorizontal: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", position: "relative" }}>
              {/* Animated Particles */}
              {particleAnims.map((particle, index) => (
                <Animated.View
                  key={index}
                  style={{
                    position: "absolute",
                    left: 50, // Start from center of first icon
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#60A5FA",
                    opacity: particle.opacity,
                    transform: [
                      { translateX: particle.translateX },
                      { translateY: particle.translateY },
                      { scale: particle.scale },
                    ],
                  }}
                />
              ))}

              {/* Step 1 - Profile Icon - Glassmorphic */}
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim1 }],
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Outer glow effect */}
                <Animated.View
                  style={{
                    position: "absolute",
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: "#60A5FA",
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.08, 0.18],
                    }),
                  }}
                />

                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.9)",
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#7DD3FC",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.25,
                    shadowRadius: 16,
                    elevation: 6,
                  }}
                >
                  <Ionicons name="person" size={48} color="#60A5FA" />
                </View>
              </Animated.View>

              {/* Arrow - Enhanced */}
              <Animated.View
                style={{
                  opacity: arrowAnim,
                  marginHorizontal: 24,
                  transform: [
                    {
                      translateX: arrowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0],
                      }),
                    },
                    {
                      scale: arrowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                }}
              >
                <View
                  style={{
                    backgroundColor: "rgba(96, 165, 250, 0.15)",
                    borderRadius: 20,
                    padding: 6,
                  }}
                >
                  <Ionicons name="arrow-forward" size={32} color="#60A5FA" />
                </View>
              </Animated.View>

              {/* Step 2 - AI Plan Icon - Glassmorphic with Glow */}
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim2 }],
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Animated outer glow effect */}
                <Animated.View
                  style={{
                    position: "absolute",
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: "#60A5FA",
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.15, 0.3],
                    }),
                    transform: [
                      {
                        scale: glowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.05],
                        }),
                      },
                    ],
                  }}
                />

                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: "rgba(255, 255, 255, 0.75)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.95)",
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#7DD3FC",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    elevation: 8,
                  }}
                >
                  <Ionicons name="sparkles" size={48} color="#60A5FA" />
                </View>
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Next button */}
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
