import React from 'react';
import { Pressable, PressableProps, ViewStyle, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

interface PremiumButtonProps extends Omit<PressableProps, 'style'> {
  style?: ViewStyle | ((state: { pressed: boolean }) => ViewStyle);
  hapticStyle?: 'light' | 'medium' | 'heavy';
  scaleEffect?: boolean;
  scaleValue?: number;
  children: React.ReactNode;
}

/**
 * Premium button component with optimized press animations and haptic feedback
 * - Instant visual feedback (no delay)
 * - Smooth scale animation
 * - Configurable haptic feedback
 */
export const PremiumButton: React.FC<PremiumButtonProps> = ({
  style,
  hapticStyle = 'light',
  scaleEffect = true,
  scaleValue = 0.97,
  onPress,
  children,
  ...props
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (scaleEffect) {
      Animated.spring(scaleAnim, {
        toValue: scaleValue,
        useNativeDriver: true,
        speed: 100, // Very fast response
        bounciness: 0, // No bounce for premium feel
      }).start();
    }
  };

  const handlePressOut = () => {
    if (scaleEffect) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 100,
        bounciness: 0,
      }).start();
    }
  };

  const handlePress = (event: any) => {
    // Trigger haptic immediately
    if (hapticStyle === 'light') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (hapticStyle === 'medium') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (hapticStyle === 'heavy') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    if (onPress) {
      onPress(event);
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={style}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};
