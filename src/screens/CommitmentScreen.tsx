import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProgressBar } from "../components/ProgressBar";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Commitment'>;

export default function CommitmentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.8)).current;
  const iconPulseAnim = useRef(new Animated.Value(1)).current;

  // Card animations for staggered appearance
  const cardAnims = useRef(
    Array.from({ length: 3 }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(40),
      scale: new Animated.Value(0.9),
    }))
  ).current;

  useEffect(() => {
    // Initial fade and slide animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        tension: 30,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(iconPulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

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
      }, 800 + index * 150); // Start after icon, stagger by 150ms
    });
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleNext = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('PersonalizationTransition');
  };

  const handleCardPress = (cardIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCard(expandedCard === cardIndex ? null : cardIndex);
  };

  const features = [
    {
      icon: "layers-outline",
      title: "Smart Organization",
      description: "Auto-categorize and structure your notes",
      details: "Our AI automatically organizes your notes by topic, creates smart folders, and links related content together. Never lose track of important information again."
    },
    {
      icon: "document-text-outline",
      title: "Instant Summaries",
      description: "Get key insights in seconds",
      details: "Save hours by getting AI-generated summaries of your lectures, meetings, and readings. Focus on what matters most with intelligent key point extraction."
    },
    {
      icon: "flash-outline",
      title: "Better Focus",
      description: "Stay on track with AI assistance",
      details: "Get personalized study recommendations, smart reminders, and focus mode features that help you stay productive and reach your learning goals."
    }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
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

      {/* Subtle texture overlay with dots */}
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
            <ProgressBar currentScreen="Commitment" />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-8"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        {/* Icon Feature */}
        <Animated.View
          style={{
            alignItems: "center",
            marginTop: 40,
            marginBottom: 32,
            opacity: fadeAnim,
            transform: [{ scale: iconScaleAnim }],
          }}
        >
          <Animated.View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#60A5FA",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#60A5FA",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 10,
              transform: [{ scale: iconPulseAnim }],
            }}
          >
            <Ionicons name="sparkles" size={56} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>

        {/* Main Title */}
        <Animated.View
          className="mb-10"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={{
            color: "#1e293b",
            fontSize: 32,
            fontWeight: "800",
            lineHeight: 40,
            textAlign: "center",
            marginBottom: 16,
          }}>
            Here's what you'll get with your personalized AI plan
          </Text>
          <Text style={{
            color: "#64748b",
            fontSize: 18,
            lineHeight: 28,
            textAlign: "center",
            fontWeight: "500",
          }}>
            NoteBoost AI will handle organization, summaries, and focus — so you can learn faster with less effort
          </Text>
        </Animated.View>

        {/* Features Grid */}
        <View style={{ gap: 16, marginBottom: 24 }}>
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              style={{
                opacity: cardAnims[index].opacity,
                transform: [
                  { translateY: cardAnims[index].translateY },
                  { scale: cardAnims[index].scale },
                ],
              }}
            >
              <Pressable
                onPress={() => handleCardPress(index)}
                style={({ pressed }) => ({
                  backgroundColor: "#FFFFFF",
                  borderRadius: 20,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: expandedCard === index ? "#60A5FA" : "#E2E8F0",
                  shadowColor: "#7DD3FC",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: expandedCard === index ? 0.2 : 0.12,
                  shadowRadius: 12,
                  elevation: 4,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: "rgba(96, 165, 250, 0.15)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name={feature.icon as any} size={28} color="#60A5FA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#1e293b", fontSize: 18, fontWeight: "700", marginBottom: 4 }}>
                      {feature.title}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 15, lineHeight: 22 }}>
                      {feature.description}
                    </Text>

                    {/* Expanded Details - directly under the heading */}
                    {expandedCard === index && (
                      <Text style={{ color: "#475569", fontSize: 14, lineHeight: 22, marginTop: 8 }}>
                        {feature.details}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={expandedCard === index ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#60A5FA"
                  />
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Unlock Button - Fixed at bottom */}
      <Animated.View
        style={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 20,
          opacity: fadeAnim,
        }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(214, 234, 248, 0.8)', '#D6EAF8']}
          className="absolute bottom-0 left-0 right-0 h-40"
          pointerEvents="none"
        />
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700", letterSpacing: -0.3 }}>
                Continue
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}
