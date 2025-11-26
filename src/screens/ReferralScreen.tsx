import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useReferralStore } from '../state/referralStore';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  createOrGetUser,
  redeemReferralCode,
  getReferralStats,
  getReferredUsers,
} from '../services/referralService';
import {
  logReferralScreenView,
  logReferralCodeShared,
} from '../services/firebaseAnalytics';

type ReferralScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Referral'>;
};

export default function ReferralScreen({ navigation }: ReferralScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    myReferralCode,
    credits,
    referredUsers,
    hasRedeemedCode,
    completedCycles,
    maxCycles,
    setMyReferralCode,
    addReferredUser,
    addCredits,
    setRedeemedCode,
    resetReferralProgress,
    setCompletedCycles,
  } = useReferralStore();

  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [currentProgress, setCurrentProgress] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);

  // Calculate if max cycles reached
  const isMaxCyclesReached = completedCycles >= maxCycles;

  // Initialize user and load data
  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await createOrGetUser();
        setUserId(user.id);
        setMyReferralCode(user.referralCode);

        // Track screen view in Firebase
        await logReferralScreenView();

        // Load stats from database
        const stats = await getReferralStats(user.id);
        setCurrentProgress(stats.currentProgress);
        addCredits(stats.totalCredits - credits); // Sync credits
        setTotalReferrals(stats.totalReferrals);
        setCompletedCycles(stats.completedCycles);

        // Load referred users
        const users = await getReferredUsers(user.id);
        // Update store with current progress
        if (users.length !== referredUsers.length) {
          resetReferralProgress();
          users.forEach(u => addReferredUser(u));
        }
      } catch (error) {
        console.error('[Referral] Init error:', error);
      }
    };

    initUser();
  }, []);

  const handleShareCode = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await Share.share({
        message: `Join me on NoteBoost AI and use my referral code: ${myReferralCode}\n\nGet smarter with AI-powered note-taking!`,
      });

      // Track share event in Firebase
      await logReferralCodeShared(userId, myReferralCode, 'share_api');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[Referral] Share error:', error);
    }
  }, [myReferralCode, userId]);

  const handleCopyCode = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(myReferralCode);

    // Track copy event in Firebase
    await logReferralCodeShared(userId, myReferralCode, 'copy');

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  }, [myReferralCode, userId]);

  const handleRedeemCode = useCallback(async () => {
    if (!inputCode.trim()) {
      Alert.alert('Missing Code', 'Please enter a referral code');
      return;
    }

    const code = inputCode.trim().toUpperCase();

    // Validate format: 3 numbers + 3 letters
    if (!/^[0-9]{3}[A-Z]{3}$/.test(code)) {
      Alert.alert('Invalid Format', 'Referral code must be 3 numbers followed by 3 letters (e.g., 123ABC)');
      return;
    }

    if (code === myReferralCode) {
      Alert.alert('Invalid Code', 'You cannot use your own referral code!');
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await redeemReferralCode(userId, code);

      if (result.success) {
        setRedeemedCode(code);
        setInputCode('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Success! 🎉',
          'Referral code redeemed! Your friend will earn credits when they get 3 referrals.',
          [{ text: 'Awesome!', onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', result.error || 'Failed to redeem code');
      }
    } catch (error) {
      console.error('[Referral] Redeem error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputCode, userId, myReferralCode, setRedeemedCode]);

  return (
    <View className="flex-1 bg-white">
      {/* Gradient Background */}
      <LinearGradient
        colors={['#D6EAF8', '#E8F4F8', '#F9F7E8', '#FFF9E6']}
        locations={[0, 0.4, 0.7, 1]}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
      />

      {/* Header */}
      <View className="px-5" style={{ paddingTop: insets.top + 16, paddingBottom: 16 }}>
        <View className="flex-row items-center mb-2">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            className="mr-3 active:opacity-60"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#7DD3FC',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#7DD3FC" />
          </Pressable>
          <Text className="text-3xl font-bold text-[#1e293b]">Earn Credits</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Credits Display */}
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.9)',
            shadowColor: '#7DD3FC',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <View className="items-center">
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(125, 211, 252, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 3,
                borderColor: '#7DD3FC',
              }}
            >
              <Ionicons name="gift" size={40} color="#7DD3FC" />
            </View>
            <Text className="text-5xl font-bold text-[#1e293b] mb-2">{credits}</Text>
            <Text className="text-lg text-[#64748b] font-semibold">Credits Available</Text>
            <Text className="text-sm text-[#94A3B8] mt-2 text-center">
              Use credits to summarize your notes with AI
            </Text>
          </View>
        </View>

        {/* Progress Card */}
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.9)',
            shadowColor: '#7DD3FC',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          {/* Cycle Progress */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-[#1e293b]">Rewards Earned</Text>
            <View className="flex-row items-center">
              <Text className="text-2xl font-bold text-[#7DD3FC]">{completedCycles}</Text>
              <Text className="text-lg text-[#64748b]">/{maxCycles}</Text>
            </View>
          </View>

          {/* Cycle Bar */}
          <View
            style={{
              height: 12,
              backgroundColor: 'rgba(125, 211, 252, 0.2)',
              borderRadius: 6,
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${(completedCycles / maxCycles) * 100}%`,
                backgroundColor: isMaxCyclesReached ? '#10B981' : '#7DD3FC',
                borderRadius: 6,
              }}
            />
          </View>

          {/* Current Cycle Progress */}
          {!isMaxCyclesReached && (
            <>
              <View className="flex-row items-center justify-between mb-3 pt-3 border-t border-[#E2E8F0]">
                <Text className="text-lg font-semibold text-[#1e293b]">Current Progress</Text>
                <View className="flex-row items-center">
                  <Text className="text-2xl font-bold text-[#7DD3FC]">{currentProgress}</Text>
                  <Text className="text-lg text-[#64748b]">/3</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View
                style={{
                  height: 10,
                  backgroundColor: 'rgba(125, 211, 252, 0.2)',
                  borderRadius: 5,
                  overflow: 'hidden',
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    height: '100%',
                    width: `${(currentProgress / 3) * 100}%`,
                    backgroundColor: '#7DD3FC',
                    borderRadius: 5,
                  }}
                />
              </View>

              <Text className="text-sm text-[#64748b]">
                {currentProgress === 0
                  ? 'Share your code to start earning credits!'
                  : currentProgress < 3
                  ? `${3 - currentProgress} more ${3 - currentProgress === 1 ? 'referral' : 'referrals'} until you earn 5 credits`
                  : 'Great! Keep sharing to earn more credits'}
              </Text>
            </>
          )}

          {/* Max Cycles Reached Message */}
          {isMaxCyclesReached && (
            <View className="pt-3 border-t border-[#E2E8F0]">
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" style={{ marginRight: 8 }} />
                <Text className="text-lg font-bold text-[#10B981]">Maximum Reached!</Text>
              </View>
              <Text className="text-sm text-[#64748b]">
                You've completed all {maxCycles} cycles and earned {maxCycles * 5} credits from referrals. Thank you for spreading the word!
              </Text>
            </View>
          )}

          {totalReferrals > 0 && (
            <View className="mt-3 pt-3 border-t border-[#E2E8F0]">
              <Text className="text-sm text-[#64748b]">
                Total referrals: <Text className="font-bold text-[#7DD3FC]">{totalReferrals}</Text> / <Text className="font-bold">{maxCycles * 3}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Your Referral Code */}
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.9)',
            shadowColor: '#7DD3FC',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          <Text className="text-lg font-bold text-[#1e293b] mb-3">Your Referral Code</Text>

          <View
            style={{
              backgroundColor: 'rgba(125, 211, 252, 0.1)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 2,
              borderColor: '#7DD3FC',
              borderStyle: 'dashed',
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: '800',
                  color: '#7DD3FC',
                  textAlign: 'center',
                  letterSpacing: 4,
                  flex: 1,
                }}
              >
                {myReferralCode || 'LOADING...'}
              </Text>
              <Pressable
                onPress={handleCopyCode}
                style={({ pressed }) => ({
                  backgroundColor: '#7DD3FC',
                  padding: 12,
                  borderRadius: 12,
                  opacity: pressed ? 0.7 : 1,
                  marginLeft: 12,
                })}
              >
                <Ionicons name="copy-outline" size={24} color="#1e293b" />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleShareCode}
            style={({ pressed }) => ({
              overflow: 'hidden',
              borderRadius: 16,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <LinearGradient
              colors={['#60A5FA', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                alignItems: 'center',
                borderRadius: 16,
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="share-social" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text className="text-white text-base font-bold">Share Your Code</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Redeem Code Section */}
        {!hasRedeemedCode && (
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.9)',
              shadowColor: '#7DD3FC',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <Text className="text-lg font-bold text-[#1e293b] mb-3">Have a Referral Code?</Text>

            <TextInput
              value={inputCode}
              onChangeText={(text) => setInputCode(text.toUpperCase())}
              placeholder="Enter code (e.g., 123ABC)"
              placeholderTextColor="#94A3B8"
              maxLength={6}
              autoCapitalize="characters"
              className="text-lg font-semibold text-[#1e293b] text-center"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                letterSpacing: 2,
              }}
            />

            <Pressable
              onPress={handleRedeemCode}
              disabled={isLoading}
              style={({ pressed }) => ({
                backgroundColor: isLoading ? '#CBD5E1' : '#10B981',
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <Text className="text-white text-base font-bold">
                {isLoading ? 'Redeeming...' : 'Redeem Code'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* How It Works */}
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.9)',
            shadowColor: '#7DD3FC',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          <Text className="text-lg font-bold text-[#1e293b] mb-4">How It Works</Text>

          <View className="space-y-4">
            <View className="flex-row">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(125, 211, 252, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text className="text-base font-bold text-[#7DD3FC]">1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base text-[#1e293b] font-semibold mb-1">Share Your Code</Text>
                <Text className="text-sm text-[#64748b]">
                  Send your unique referral code to friends
                </Text>
              </View>
            </View>

            <View className="flex-row mt-3">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(125, 211, 252, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text className="text-base font-bold text-[#7DD3FC]">2</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base text-[#1e293b] font-semibold mb-1">They Join</Text>
                <Text className="text-sm text-[#64748b]">
                  When 3 friends use your code, you earn 5 credits (up to 5 cycles)
                </Text>
              </View>
            </View>

            <View className="flex-row mt-3">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(125, 211, 252, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text className="text-base font-bold text-[#7DD3FC]">3</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base text-[#1e293b] font-semibold mb-1">Use Credits</Text>
                <Text className="text-sm text-[#64748b]">
                  Spend credits to generate AI summaries of your notes
                </Text>
              </View>
            </View>

            <View className="flex-row mt-3">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(125, 211, 252, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text className="text-base font-bold text-[#7DD3FC]">4</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base text-[#1e293b] font-semibold mb-1">Keep Going!</Text>
                <Text className="text-sm text-[#64748b]">
                  Earn up to 25 credits total (5 cycles × 5 credits)
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
