import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, ScrollView, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Haptics from "expo-haptics";
import { ProgressBar } from "../components/ProgressBar";

const { width } = Dimensions.get("window");

type ResultsTimelineScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ResultsTimeline">;
};

const weeks = [
  {
    week: 1,
    title: "Better note organization",
    description: "Most users notice clearer structure and easier navigation through their notes.",
    icon: "document-text-outline" as const,
  },
  {
    week: 2,
    title: "Active recall made easy",
    description: "Users report better retention through AI-generated quizzes and interactive learning.",
    icon: "bulb-outline" as const,
  },
  {
    week: 3,
    title: "Smarter review automation",
    description: "Study sessions become more efficient with automated review and smart scheduling.",
    icon: "flash-outline" as const,
  },
  {
    week: 4,
    title: "Knowledge mastery",
    description: "Users see noticeable improvements in test scores and long-term information recall.",
    icon: "trophy-outline" as const,
  },
];

export default function ResultsTimelineScreen({ navigation }: ResultsTimelineScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedWeek, setSelectedWeek] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(50)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.9)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.8)).current;
  const iconRotateAnim = useRef(new Animated.Value(0)).current;
  const circleScaleAnim = useRef(new Animated.Value(0.8)).current;

  // Animation refs for each week icon
  const weekIconAnims = useRef(
    weeks.map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.8),
    }))
  ).current;

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

    // Animate week icons with stagger
    const iconAnimations = weekIconAnims.map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 500,
          delay: index * 100, // 100ms stagger between each icon
          useNativeDriver: true,
        }),
        Animated.spring(anim.scale, {
          toValue: 1,
          delay: index * 100,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.parallel(iconAnimations).start();
  }, []);

  useEffect(() => {
    // Animate card when week changes with combined animations
    cardFadeAnim.setValue(0);
    cardSlideAnim.setValue(50);
    cardScaleAnim.setValue(0.9);
    iconScaleAnim.setValue(0.8);
    iconRotateAnim.setValue(0);
    circleScaleAnim.setValue(0.8);

    Animated.parallel([
      // Card fade in
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Card slide up
      Animated.spring(cardSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      // Card scale up
      Animated.spring(cardScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      // Icon scale with bounce
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        delay: 200,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      // Icon subtle rotation
      Animated.spring(iconRotateAnim, {
        toValue: 1,
        delay: 200,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      // Decorative circles scale
      Animated.spring(circleScaleAnim, {
        toValue: 1,
        delay: 150,
        tension: 35,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Subtle pulse effect after animation completes
      Animated.sequence([
        Animated.timing(iconScaleAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(iconScaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [selectedWeek]);

  const handleWeekSelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWeek(index);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (selectedWeek < weeks.length - 1) {
      // Go to next week
      setSelectedWeek(selectedWeek + 1);
    } else {
      // If on last week, navigate to Rating screen
      navigation.replace("Rating");
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const currentWeek = weeks[selectedWeek];

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
            <ProgressBar currentScreen="ResultsTimeline" />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
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
          <View style={{ marginTop: 40, marginBottom: 40 }}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "#1e293b",
                lineHeight: 40,
                marginBottom: 16,
              }}
            >
              Your transformation starts here
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#64748b",
                lineHeight: 24,
              }}
            >
              Follow your 4-week personalized plan to master your notes
            </Text>
          </View>

          {/* Week tabs */}
          <View
            style={{
              flexDirection: "row",
              marginBottom: 32,
              gap: 8,
            }}
          >
            {weeks.map((week, index) => (
              <Animated.View
                key={index}
                style={{
                  flex: 1,
                  opacity: weekIconAnims[index].opacity,
                  transform: [{ scale: weekIconAnims[index].scale }],
                }}
              >
                <Pressable
                  onPress={() => handleWeekSelect(index)}
                  style={{
                    paddingVertical: 12,
                    alignItems: "center",
                    borderBottomWidth: 3,
                    borderBottomColor: selectedWeek === index ? "#60A5FA" : "rgba(226, 232, 240, 0.5)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: selectedWeek === index ? "#60A5FA" : "#94A3B8",
                    }}
                  >
                    Week {week.week}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {/* Result card with icon visual - Glassmorphic Design */}
          <Animated.View
            style={{
              opacity: cardFadeAnim,
              transform: [
                { translateY: cardSlideAnim },
                { scale: cardScaleAnim },
              ],
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              borderRadius: 24,
              overflow: "hidden",
              marginBottom: 32,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.9)",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 5,
            }}
          >
            {/* Icon visualization */}
            <View
              style={{
                width: "100%",
                height: 320,
                backgroundColor: "rgba(248, 250, 252, 0.5)",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}
            >
              {/* Decorative circles */}
              <Animated.View
                style={{
                  position: "absolute",
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: "rgba(96, 165, 250, 0.1)",
                  transform: [{ scale: circleScaleAnim }],
                }}
              />
              <Animated.View
                style={{
                  position: "absolute",
                  width: 280,
                  height: 280,
                  borderRadius: 140,
                  borderWidth: 1,
                  borderColor: "rgba(96, 165, 250, 0.2)",
                  borderStyle: "dashed",
                  transform: [{ scale: circleScaleAnim }],
                }}
              />

              {/* Main icon */}
              <Animated.View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: "#60A5FA",
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#60A5FA",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 30,
                  elevation: 10,
                  transform: [
                    { scale: iconScaleAnim },
                    {
                      rotate: iconRotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "10deg"],
                      }),
                    },
                  ],
                }}
              >
                <Ionicons name={currentWeek.icon} size={60} color="white" />
              </Animated.View>

              {/* Progress indicator */}
              <View
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  backgroundColor: "#60A5FA",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "white",
                  }}
                >
                  Week {currentWeek.week}/4
                </Text>
              </View>
            </View>

            {/* Card content */}
            <View style={{ padding: 24 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#1e293b",
                  marginBottom: 12,
                }}
              >
                {currentWeek.title}
              </Text>
              <View
                style={{
                  height: 1,
                  backgroundColor: "#E2E8F0",
                  marginBottom: 16,
                }}
              />
              <Text
                style={{
                  fontSize: 15,
                  color: "#64748b",
                  lineHeight: 22,
                }}
              >
                {currentWeek.description}
              </Text>
            </View>
          </Animated.View>

          {/* Info box */}
          <View
            style={{
              backgroundColor: "rgba(96, 165, 250, 0.05)",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: "rgba(96, 165, 250, 0.2)",
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <Ionicons name="information-circle" size={24} color="#60A5FA" style={{ marginTop: 2 }} />
              <Text
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: "#64748b",
                  lineHeight: 20,
                }}
              >
                Results may vary by individual. Consistency is key to seeing the best improvements in your learning.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Fixed Next button at bottom with blur gradient */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        {/* Blur gradient overlay to indicate scrollable content */}
        <LinearGradient
          colors={["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.85)", "rgba(255, 255, 255, 0.98)"]}
          locations={[0, 0.5, 1]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 150,
            pointerEvents: "none",
          }}
        />

        <View
          style={{
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
    </View>
  );
}
