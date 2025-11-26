import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'FinalCommit'>;

export default function FinalCommitScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [isCommitted, setIsCommitted] = useState(false);

  // Animation values
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageSlide = useRef(new Animated.Value(20)).current;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleCheckboxToggle = () => {
    if (!isCommitted) {
      // Committing - play success haptic and animate
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsCommitted(true);

      // Button scale animation (bounce effect)
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Checkmark pop-in animation
      Animated.spring(checkmarkScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }).start();

      // Success message fade in and slide up
      Animated.parallel([
        Animated.timing(messageOpacity, {
          toValue: 1,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.spring(messageSlide, {
          toValue: 0,
          friction: 8,
          tension: 40,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Uncommitting - play light haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsCommitted(false);

      // Reset animations
      checkmarkScale.setValue(0);
      messageOpacity.setValue(0);
      messageSlide.setValue(20);
    }
  };

  const handleNext = () => {
    if (!isCommitted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('Paywall');
  };

  return (
    <View style={{ flex: 1, backgroundColor: isCommitted ? '#0a1a0a' : '#0a0a0a' }}>
      {/* Multi-layer gradient background */}
      <LinearGradient
        colors={
          isCommitted
            ? ["#0a1a0a", "#0f2e1f", "#0d3d2d", "#0a2e1a", "#0a1a0a"]
            : ["#0a0a0a", "#1a1a2e", "#16213e", "#0f1f2e", "#0a0a0a"]
        }
        locations={[0, 0.3, 0.5, 0.7, 1]}
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

      {/* Progress Bar */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 24 }}>
        <View className="flex-row items-center mb-6">
          <Pressable
            onPress={handleBack}
            className="w-14 h-14 rounded-full bg-[#2a2a2a] items-center justify-center mr-4 active:opacity-70"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <View className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
            <View className="h-full bg-purple-500 rounded-full" style={{ width: '98%' }} />
          </View>
        </View>
      </View>

      {/* Content - Centered */}
      <View className="flex-1 justify-center px-6" style={{ marginTop: -100 }}>
        {/* Main Title */}
        <Text className="text-white text-4xl font-bold text-center leading-tight mb-8">
          Ready to commit to your plan?
        </Text>

        {/* Success Rate Text */}
        <View className="mb-12">
          <Text className="text-gray-400 text-lg text-center leading-relaxed">
            We measured{' '}
            <Text className="text-green-500 font-bold">80% higher success rate</Text>
            {' '}for committed users.
          </Text>
        </View>

        {/* Commitment Checkbox */}
        <Animated.View
          style={{
            transform: [{ scale: buttonScale }],
            opacity: buttonOpacity,
          }}
        >
          <Pressable
            onPress={handleCheckboxToggle}
            className="rounded-3xl px-8 py-6 active:opacity-90"
            style={{
              backgroundColor: isCommitted ? '#10b981' : 'rgba(26, 26, 46, 0.6)',
              borderWidth: 2,
              borderColor: isCommitted ? '#10b981' : '#374151',
              shadowColor: isCommitted ? '#10b981' : 'transparent',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isCommitted ? 0.4 : 0,
              shadowRadius: 16,
              elevation: isCommitted ? 8 : 0,
            }}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-white text-xl font-semibold text-center">
                {isCommitted ? "I'm committed to my plan" : "Tap to commit to your plan"}
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Success Message */}
        {isCommitted && (
          <Animated.View
            className="mt-8"
            style={{
              opacity: messageOpacity,
              transform: [{ translateY: messageSlide }],
            }}
          >
            <View className="bg-green-500/20 rounded-3xl p-6 border border-green-500/40">
              <Text className="text-white text-base text-center leading-relaxed">
                <Text className="text-green-400 font-bold">Amazing!</Text>
                {' '}Your commitment is the first step toward your transformation.
              </Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Next Button - Fixed at bottom */}
      <View
        className="px-6"
        style={{ paddingBottom: insets.bottom + 24 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(10, 10, 10, 0.8)', '#0a0a0a']}
          className="absolute bottom-0 left-0 right-0 h-40"
          pointerEvents="none"
        />
        <Pressable
          onPress={handleNext}
          disabled={!isCommitted}
          className="py-6 rounded-full items-center justify-center"
          style={{
            backgroundColor: isCommitted ? '#8b5cf6' : '#374151',
            opacity: isCommitted ? 1 : 0.5,
            shadowColor: isCommitted ? '#8b5cf6' : 'transparent',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isCommitted ? 0.5 : 0,
            shadowRadius: 20,
            elevation: isCommitted ? 10 : 0,
          }}
        >
          <Text className="text-white text-lg font-bold">Next</Text>
        </Pressable>
      </View>
    </View>
  );
}
