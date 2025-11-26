import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface XPNotificationProps {
  visible: boolean;
  xpAmount: number;
  onHide: () => void;
}

const { width } = Dimensions.get('window');

export const XPNotification: React.FC<XPNotificationProps> = ({ visible, xpAmount, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible && xpAmount > 0) {
      // Trigger haptic feedback (only on supported platforms)
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
      ]).start();

      // Auto-hide after 2.5 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible, xpAmount]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 50,
        left: width * 0.1,
        right: width * 0.1,
        zIndex: 9999,
        transform: [{ translateY }, { scale }],
        opacity,
      }}
    >
      <View
        style={{
          backgroundColor: '#8b5cf6',
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#8b5cf6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
          borderWidth: 2,
          borderColor: '#a78bfa',
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="flash" size={24} color="#ffffff" />
        </View>
        <View>
          <Text style={{ fontSize: 14, color: '#e9d5ff', fontWeight: '600' }}>
            XP Earned!
          </Text>
          <Text style={{ fontSize: 20, color: '#ffffff', fontWeight: 'bold' }}>
            +{xpAmount} XP
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};
