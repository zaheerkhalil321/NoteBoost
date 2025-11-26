import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, TextInput, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useReferralStore } from '../state/referralStore';
import {
  createOrGetUser,
  redeemReferralCode,
} from '../services/referralService';
import { logReferralScreenView } from '../services/firebaseAnalytics';
import { BlurView } from 'expo-blur';
import { ProgressBar } from '../components/ProgressBar';

type OnboardingReferralScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ReferralOnboarding'>;
};

export default function OnboardingReferralScreen({ navigation }: OnboardingReferralScreenProps) {
  const insets = useSafeAreaInsets();
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const { setRedeemedCode } = useReferralStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initialize user
    const initUser = async () => {
      try {
        const user = await createOrGetUser();
        setUserId(user.id);

        // Track screen view in Firebase
        await logReferralScreenView();
      } catch (error) {
        console.error('[OnboardingReferral] Init error:', error);
      }
    };

    initUser();

    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
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

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PainPoint');
  }, [navigation]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  const handleContinue = useCallback(async () => {
    if (!referralCode.trim()) {
      // No code entered, just skip
      handleSkip();
      return;
    }

    const code = referralCode.trim().toUpperCase();

    // Validate format: 3 numbers + 3 letters
    if (!/^[0-9]{3}[A-Z]{3}$/.test(code)) {
      Alert.alert('Invalid Format', 'Referral code must be 3 numbers followed by 3 letters (e.g., 123ABC)');
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await redeemReferralCode(userId, code);

      if (result.success) {
        setRedeemedCode(code);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Welcome Bonus!',
          `You've received ${result.creditAwarded || 1} free credit! Your friend will also earn credits when they reach 3 referrals.`,
          [{ text: 'Continue', onPress: () => navigation.navigate('PainPoint') }]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Invalid Code', result.error || 'This referral code is not valid.');
      }
    } catch (error) {
      console.error('[OnboardingReferral] Redeem error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [referralCode, userId, navigation, setRedeemedCode, handleSkip]);

  const handleInviteFriends = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to invite flow after completing onboarding
    navigation.navigate('PainPoint');
    // TODO: Show invite modal or navigate to invite screen after onboarding completes
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Light Gradient Background - matching app theme */}
      <LinearGradient
        colors={['#D6EAF8', '#E8F4F8', '#F9F7E8', '#FFF9E6']}
        locations={[0, 0.4, 0.7, 1]}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
      />

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
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
              <ProgressBar currentScreen="ReferralOnboarding" />
            </View>
          </View>
        </View>

        {/* Skip Button */}
        <View style={{ alignItems: 'flex-end', paddingHorizontal: 24, marginTop: 16, marginBottom: 40 }}>
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => ({
              paddingHorizontal: 20,
              paddingVertical: 10,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                color: '#64748b',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Skip
            </Text>
          </Pressable>
        </View>

        {/* Main Content */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          {/* Icon - Gift with light blue glassmorphic design */}
          <View
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: 'rgba(186, 230, 253, 0.5)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
              borderWidth: 2,
              borderColor: 'rgba(125, 211, 252, 0.4)',
              shadowColor: '#7DD3FC',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <Ionicons name="gift" size={64} color="#38BDF8" />
          </View>

          {/* Headline */}
          <Text
            style={{
              fontSize: 32,
              fontWeight: '800',
              color: '#1e293b',
              textAlign: 'center',
              marginBottom: 16,
              letterSpacing: -0.5,
            }}
          >
            Do you have a{'\n'}referral code?
          </Text>

          {/* Subtext */}
          <Text
            style={{
              fontSize: 17,
              color: '#64748b',
              textAlign: 'center',
              lineHeight: 26,
              marginBottom: 48,
              paddingHorizontal: 20,
              fontWeight: '500',
            }}
          >
            Enter your friend's code to get bonus benefits
          </Text>

          {/* Glassmorphic Input Card - Light theme */}
          <View
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 24,
              padding: 24,
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.9)',
              shadowColor: '#7DD3FC',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <View>
              <Text
                style={{
                  color: '#64748b',
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 12,
                  letterSpacing: 1,
                }}
              >
                REFERRAL CODE
              </Text>

              <TextInput
                value={referralCode}
                onChangeText={(text) => setReferralCode(text.toUpperCase())}
                placeholder="123ABC"
                placeholderTextColor="#94A3B8"
                maxLength={6}
                autoCapitalize="characters"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 16,
                  padding: 18,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(125, 211, 252, 0.3)',
                  fontSize: 24,
                  fontWeight: '700',
                  color: '#38BDF8',
                  textAlign: 'center',
                  letterSpacing: 4,
                }}
              />
            </View>
          </View>
        </View>

        {/* Bottom Buttons */}
        <View style={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 24 }}>
          {/* Continue Button - Matching Welcome Screen Style */}
          <Pressable
            onPress={handleContinue}
            disabled={isLoading}
            style={({ pressed }) => ({
              overflow: 'hidden',
              borderRadius: 16,
              transform: [{ scale: pressed && !isLoading ? 0.97 : 1 }],
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 4,
            })}
          >
            <LinearGradient
              colors={isLoading ? ['#94A3B8', '#64748B'] : ['#60A5FA', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 18,
                alignItems: 'center',
                borderRadius: 16,
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                }}
              >
                {isLoading ? 'Validating...' : referralCode ? 'Apply Code' : 'Get Started'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
