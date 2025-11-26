/**
 * Premium Animation Configuration
 * Optimized timing values for instant, polished button responses
 */

export const PREMIUM_ANIMATIONS = {
  // Button press animations - ultra-fast response
  button: {
    pressScale: 0.97, // Subtle scale for premium feel
    duration: 50, // Instant response (50ms)
    springConfig: {
      speed: 100, // Very fast spring
      bounciness: 0, // No bounce for polished feel
    },
  },

  // Haptic feedback delays (immediate)
  haptics: {
    delay: 0, // No delay - instant feedback
  },

  // Fade animations
  fade: {
    fast: 150,
    medium: 250,
    slow: 350,
  },

  // Scale animations
  scale: {
    fast: 100,
    medium: 200,
    slow: 300,
  },
};

/**
 * Returns optimized style for pressable buttons
 * Usage: style={({ pressed }) => getPremiumPressableStyle(pressed, yourBaseStyle)}
 */
export const getPremiumPressableStyle = (
  pressed: boolean,
  baseStyle: any,
  scaleValue: number = PREMIUM_ANIMATIONS.button.pressScale
) => {
  return [
    baseStyle,
    {
      transform: [{ scale: pressed ? scaleValue : 1 }],
      opacity: pressed ? 0.9 : 1,
    },
  ];
};
