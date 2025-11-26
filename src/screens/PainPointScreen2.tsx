import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";
import { ProgressBar } from "../components/ProgressBar";

type PainPointScreen2Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "PainPoint2">;
};

export default function PainPointScreen2({ navigation }: PainPointScreen2Props) {
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const questionMark1Anim = useRef(new Animated.Value(0)).current;
  const questionMark2Anim = useRef(new Animated.Value(0)).current;
  const questionMark3Anim = useRef(new Animated.Value(0)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;

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

    // Staggered fade-in for question marks
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(questionMark1Anim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(200),
      Animated.timing(questionMark2Anim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(200),
      Animated.timing(questionMark3Anim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous floating animations for question marks
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(floatAnim2, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(floatAnim3, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim3, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PainPoint3");
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
            <ProgressBar currentScreen="PainPoint2" />
          </View>
        </View>
      </View>

      {/* Content */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          justifyContent: "space-between",
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Visual representation - messy notes scattered */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginTop: -20 }}>
          <View style={{ position: "relative", width: 300, height: 360 }}>
            {/* Scattered notes background - representing chaos */}
            <View
              style={{
                position: "absolute",
                width: 240,
                height: 280,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                borderWidth: 2,
                borderColor: "#E2E8F0",
                padding: 20,
                top: 20,
                left: 30,
                shadowColor: "#60A5FA",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              {/* Messy scribbles and lines representing unorganized notes */}
              {[...Array(12)].map((_, i) => (
                <View
                  key={i}
                  style={{
                    height: 3,
                    backgroundColor: "#CBD5E1",
                    marginTop: i === 0 ? 0 : 10,
                    width: `${Math.random() * 40 + 40}%`,
                    borderRadius: 1.5,
                    opacity: 0.6,
                  }}
                />
              ))}

              {/* Random dots and marks */}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                {[...Array(8)].map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: Math.random() * 30 + 20,
                      height: 6,
                      backgroundColor: "#E2E8F0",
                      borderRadius: 3,
                    }}
                  />
                ))}
              </View>

              {/* More messy lines */}
              {[...Array(6)].map((_, i) => (
                <View
                  key={`bottom-${i}`}
                  style={{
                    height: 3,
                    backgroundColor: "#CBD5E1",
                    marginTop: 12,
                    width: `${Math.random() * 50 + 35}%`,
                    borderRadius: 1.5,
                    opacity: 0.5,
                  }}
                />
              ))}
            </View>

            {/* Blur/fog overlay effect to show "hidden potential" */}
            <View
              style={{
                position: "absolute",
                width: 240,
                height: 280,
                backgroundColor: "rgba(148, 163, 184, 0.3)",
                borderRadius: 16,
                top: 20,
                left: 30,
              }}
            />

            {/* Question marks floating around - blue theme for confusion */}
            <Animated.View
              style={{
                position: "absolute",
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(96, 165, 250, 0.9)",
                justifyContent: "center",
                alignItems: "center",
                top: 10,
                right: 60,
                shadowColor: "#60A5FA",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 6,
                opacity: questionMark1Anim,
                transform: [
                  {
                    scale: questionMark1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                  {
                    translateY: floatAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -15],
                    }),
                  },
                ],
              }}
            >
              <Text style={{ fontSize: 24, color: "#FFFFFF", fontWeight: "bold" }}>?</Text>
            </Animated.View>

            <Animated.View
              style={{
                position: "absolute",
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(96, 165, 250, 0.85)",
                justifyContent: "center",
                alignItems: "center",
                bottom: 40,
                left: 10,
                shadowColor: "#60A5FA",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 5,
                opacity: questionMark2Anim,
                transform: [
                  {
                    scale: questionMark2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                  {
                    translateY: floatAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -12],
                    }),
                  },
                ],
              }}
            >
              <Text style={{ fontSize: 20, color: "#FFFFFF", fontWeight: "bold" }}>?</Text>
            </Animated.View>

            <Animated.View
              style={{
                position: "absolute",
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(96, 165, 250, 0.8)",
                justifyContent: "center",
                alignItems: "center",
                top: 120,
                right: 20,
                shadowColor: "#60A5FA",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 4,
                opacity: questionMark3Anim,
                transform: [
                  {
                    scale: questionMark3Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                  {
                    translateY: floatAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -10],
                    }),
                  },
                ],
              }}
            >
              <Text style={{ fontSize: 18, color: "#FFFFFF", fontWeight: "bold" }}>?</Text>
            </Animated.View>
          </View>

          {/* Main message */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              marginTop: 40,
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
              Disorganized notes hide the true potential of your learning
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: "#64748b",
                textAlign: "center",
                lineHeight: 24,
                paddingHorizontal: 15,
              }}
            >
              It affects how you retain information and makes you less effective at studying
            </Text>
          </Animated.View>
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
