import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, Animated, Dimensions, StyleSheet, Share as RNShare, TextInput, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { BlurView } from 'expo-blur';
import { Copy, Share, ArrowRight, X, Ticket, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface InviteBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onRedeemPress?: () => void;
}

export default function InviteBottomSheet({ visible, onClose, onRedeemPress }: InviteBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [referralCode] = useState('288ZVW'); // TODO: Get from user's actual referral code
  const [friendsJoined] = useState(0); // TODO: Get from backend
  const [timesRedeemed] = useState(0); // TODO: Get from backend
  const [copied, setCopied] = useState(false);

  // Redeem code state
  const [showRedeemView, setShowRedeemView] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
      // Reset states when opening
      setShowRedeemView(false);
      setRedeemCode('');
    } else {
      // Smooth exit animation
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
      // Reset states after animation completes
      setTimeout(() => {
        setShowRedeemView(false);
        setRedeemCode('');
      }, 250);
    }
  }, [visible]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await RNShare.share({
        message: `Join me on NoteBoost AI! Use my referral code: ${referralCode} to get started with AI-powered note taking. Download now!`,
        title: 'Join NoteBoost AI',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBackdropPress = () => {
    if (!visible) return; // Prevent double-tap issues
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleClose = () => {
    if (!visible) return; // Prevent double-tap issues
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleRedeemPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowRedeemView(true);
  };

  const handleBackToInvite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowRedeemView(false);
    setRedeemCode('');
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
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
              setShowRedeemView(false);
              setRedeemCode('');
            },
          },
        ]
      );
    }, 1000);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />

          {!showRedeemView ? (
            // INVITE VIEW
            <>
              {/* Close Button */}
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

              {/* Title */}
              <Text style={styles.title}>
                Invite 3 friends and get 5 free credits
              </Text>

              {/* Referral Code Card */}
              <Pressable onPress={handleCopy} style={styles.codeCard}>
                <Text style={styles.codeText}>{referralCode}</Text>
                <View style={styles.copyRow}>
                  <Copy size={20} color="#60A5FA" strokeWidth={2} />
                  <Text style={styles.copyText}>{copied ? 'Copied!' : 'Tap to copy'}</Text>
                </View>
              </Pressable>

              {/* Share Button */}
              <Pressable onPress={handleShare} style={styles.shareButton}>
                <LinearGradient
                  colors={["#60A5FA", "#3B82F6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shareGradient}
                >
                  <Share size={24} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.shareText}>Share</Text>
                </LinearGradient>
              </Pressable>

              {/* Stats Section */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{friendsJoined}</Text>
                  <Text style={styles.statLabel}>Friends Joined</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{timesRedeemed}</Text>
                  <Text style={styles.statLabel}>Times Redeemed</Text>
                </View>
              </View>

              {/* Redeem Link */}
              <Pressable onPress={handleRedeemPress} style={styles.redeemLink}>
                <Text style={styles.redeemText}>Have a referral code? Redeem it here</Text>
                <ArrowRight size={20} color="#60A5FA" strokeWidth={2.5} />
              </Pressable>
            </>
          ) : (
            // REDEEM VIEW
            <>
              {/* Back Button */}
              <View
                style={{
                  position: 'absolute',
                  top: 20,
                  left: 20,
                  zIndex: 999,
                }}
              >
                <Pressable
                  onPress={handleBackToInvite}
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
                  <ChevronLeft size={22} color="#64748B" strokeWidth={2.5} />
                </Pressable>
              </View>

              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Ticket size={36} color="#F59E0B" strokeWidth={2.5} />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.redeemTitle}>Redeem Code</Text>

              {/* Subtitle */}
              <Text style={styles.redeemSubtitle}>
                Enter a friend's referral code to get 1 free credit
              </Text>

              {/* Input Field */}
              <TextInput
                style={styles.input}
                value={redeemCode}
                onChangeText={setRedeemCode}
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
                disabled={isRedeeming || !redeemCode.trim()}
                style={({ pressed }) => ({
                  borderRadius: 20,
                  overflow: 'hidden',
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  elevation: 5,
                  opacity: pressed || isRedeeming || !redeemCode.trim() ? 0.7 : 1,
                })}
              >
                <LinearGradient
                  colors={redeemCode.trim() ? ["#60A5FA", "#3B82F6"] : ["#94A3B8", "#94A3B8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 16,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      letterSpacing: -0.3,
                    }}
                  >
                    {isRedeeming ? 'Redeeming...' : 'Redeem Code'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </>
          )}
            </View>
          </TouchableWithoutFeedback>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#60A5FA',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  codeText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 6,
    marginBottom: 10,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60A5FA',
  },
  shareButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  shareText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  divider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  redeemLink: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  redeemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#60A5FA',
  },
  // Redeem View Styles
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
  redeemTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 10,
  },
  redeemSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
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
});
