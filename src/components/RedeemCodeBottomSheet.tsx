import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, Animated, Dimensions, StyleSheet, TextInput, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Ticket } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RedeemCodeBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function RedeemCodeBottomSheet({ visible, onClose }: RedeemCodeBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [referralCode, setReferralCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
      // Reset input when closing
      setTimeout(() => setReferralCode(''), 200);
    }
  }, [visible]);

  const handleRedeem = async () => {
    if (!referralCode.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid Code', 'Please enter a referral code');
      return;
    }

    setIsRedeeming(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // TODO: Implement actual API call to redeem code
    // Simulating API call
    setTimeout(() => {
      setIsRedeeming(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Success!',
        'You received 1 free credit',
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
            },
          },
        ]
      );
    }, 1000);
  };

  const handleBackdropPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
      hardwareAccelerated
    >
      <View style={styles.container}>
        {/* Backdrop with blur */}
        <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Close Button - Outside wrapper for better touch handling */}
          <View
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              zIndex: 999,
            }}
          >
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(226, 232, 240, 0.6)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <X size={22} color="#64748B" strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ticket size={36} color="#F59E0B" strokeWidth={2.5} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Redeem Code</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Enter a friend's referral code to get 1 free credit
          </Text>

          {/* Input Field */}
          <TextInput
            style={styles.input}
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder="ENTER CODE"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={10}
            editable={!isRedeeming}
          />

          {/* Redeem Button */}
          <Pressable
            onPress={handleRedeem}
            disabled={isRedeeming || !referralCode.trim()}
            style={({ pressed }) => ({
              ...styles.redeemButton,
              opacity: pressed || isRedeeming || !referralCode.trim() ? 0.7 : 1,
            })}
          >
            <LinearGradient
              colors={referralCode.trim() ? ["#60A5FA", "#3B82F6"] : ["#94A3B8", "#94A3B8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.redeemGradient}
            >
              <Text style={styles.redeemButtonText}>
                {isRedeeming ? 'Redeeming...' : 'Redeem Code'}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(226, 232, 240, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FEF3C7',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  redeemButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  redeemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
  },
  redeemButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});
