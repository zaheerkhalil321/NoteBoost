import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ProgressBar } from "../components/ProgressBar";
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Feedback'>;

// Simple confetti component
const ConfettiPiece = ({ delay, left }: { delay: number; left: number }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 400,
        duration: 2000 + Math.random() * 1000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: 2000,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2000,
        delay: delay + 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const colors = ['#60A5FA', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: -20,
        left: `${left}%`,
        width: 8,
        height: 8,
        backgroundColor: color,
        transform: [
          { translateY },
          {
            rotate: rotate.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '720deg'],
            }),
          },
        ],
        opacity,
      }}
    />
  );
};

export default function FeedbackScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [selectedRating, setSelectedRating] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleStarPress = (rating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRating(rating);

    // Show confetti for 5-star rating
    if (rating === 5) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowConfetti(true);

      // Bounce animation for the card
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const getRatingMessage = () => {
    if (selectedRating === 0) return 'Tap to rate your experience';
    if (selectedRating === 5) return '🎉 Amazing! We\'re thrilled you love it!';
    if (selectedRating === 4) return '😊 Great! Thanks for your feedback!';
    if (selectedRating === 3) return 'Thanks! We\'ll keep improving!';
    if (selectedRating <= 2) return 'We appreciate your honest feedback!';
    return 'Tap to rate your experience';
  };

  const handleNext = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Navigate to InviteReferral screen where user can invite friends or skip to paywall
    navigation.replace('InviteReferral');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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
            <ProgressBar currentScreen="Feedback" />
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 justify-center" style={{ marginTop: -80 }}>
        {/* Title */}
        <Text style={{ color: "#1e293b", fontSize: 32, fontWeight: "bold", textAlign: "center", lineHeight: 40, marginBottom: 16 }}>
          How was your NoteBoost AI{'\n'}experience so far?
        </Text>

        {/* Subtitle */}
        <Text style={{ color: "#64748b", fontSize: 17, textAlign: "center", marginBottom: 60 }}>
          Your feedback helps us improve
        </Text>

        {/* Star Rating Card */}
        <Animated.View style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 24,
          padding: 32,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          shadowColor: "#7DD3FC",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 4,
          transform: [{ scale: scaleAnim }],
          overflow: 'visible',
        }}>
          {/* Confetti */}
          {showConfetti && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400, overflow: 'visible' }}>
              {Array.from({ length: 30 }).map((_, i) => (
                <ConfettiPiece
                  key={i}
                  delay={i * 50}
                  left={Math.random() * 100}
                />
              ))}
            </View>
          )}

          {/* Stars */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 24 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => handleStarPress(star)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  transform: [{ scale: pressed ? 0.9 : 1 }],
                })}
              >
                <Ionicons
                  name={selectedRating >= star ? "star" : "star-outline"}
                  size={52}
                  color={selectedRating >= star ? "#60A5FA" : "#CBD5E1"}
                />
              </Pressable>
            ))}
          </View>

          {/* Dynamic feedback text */}
          <Text style={{
            color: selectedRating > 0 ? "#1e293b" : "#94A3B8",
            fontSize: 16,
            textAlign: "center",
            fontWeight: selectedRating > 0 ? "600" : "500",
            lineHeight: 22,
          }}>
            {getRatingMessage()}
          </Text>
        </Animated.View>
      </View>

      {/* Next Button - Fixed at bottom */}
      <View style={{ paddingHorizontal: 32, paddingBottom: insets.bottom + 20 }}>
        <Pressable
          onPress={handleNext}
          disabled={selectedRating === 0}
          style={({ pressed }) => ({
            overflow: "hidden",
            borderRadius: 16,
            transform: [{ scale: pressed && selectedRating > 0 ? 0.97 : 1 }],
            shadowColor: selectedRating > 0 ? "#3B82F6" : "transparent",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: selectedRating > 0 ? 4 : 0,
            opacity: selectedRating > 0 ? 1 : 0.5,
          })}
        >
          <LinearGradient
            colors={selectedRating > 0 ? ["#60A5FA", "#3B82F6"] : ["rgba(148, 163, 184, 0.3)", "rgba(148, 163, 184, 0.3)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 18,
              alignItems: "center",
              borderRadius: 16,
            }}
          >
            <Text style={{ color: selectedRating > 0 ? "#FFFFFF" : "#94A3B8", fontSize: 18, fontWeight: "700", letterSpacing: -0.3 }}>
              Next
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
