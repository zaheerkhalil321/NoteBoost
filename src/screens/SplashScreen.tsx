import React, { useEffect, useRef } from "react";
import { View, Text, Image, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial fade and scale animation
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

    // Subtle floating animation for mascot
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Beautiful gradient background matching the app */}
      <LinearGradient
        colors={["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]}
        locations={[0, 0.4, 0.7, 1]}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />

      {/* Content - Centered */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 40,
        }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            alignItems: "center",
          }}
        >
          {/* Mascot with floating animation */}
          <Animated.View
            style={{
              transform: [{ translateY: floatAnim }],
              marginBottom: 40,
            }}
          >
            <View
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              <Image
                source={require("../assets/images/mascot.png")}
                style={{
                  width: 160,
                  height: 160,
                }}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* App Name with elegant styling */}
          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontSize: 52,
                fontWeight: "700",
                color: "#334155",
                textAlign: "center",
                letterSpacing: -2,
                marginBottom: 8,
              }}
            >
              NoteBoost
            </Text>

            {/* AI Badge */}
            <View
              style={{
                backgroundColor: "rgba(6, 182, 212, 0.15)",
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: "rgba(6, 182, 212, 0.3)",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#06b6d4",
                  letterSpacing: 2,
                }}
              >
                AI POWERED
              </Text>
            </View>
          </View>

          {/* Tagline */}
          <Text
            style={{
              fontSize: 16,
              color: "#64748B",
              textAlign: "center",
              marginTop: 24,
              fontWeight: "500",
              letterSpacing: 0.5,
            }}
          >
            Your Intelligent Study Companion
          </Text>
        </Animated.View>
      </View>

      {/* Bottom decorative element */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          alignItems: "center",
          opacity: fadeAnim,
        }}
      >
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(125, 211, 252, 0.4)",
          }}
        />
      </Animated.View>
    </View>
  );
}
