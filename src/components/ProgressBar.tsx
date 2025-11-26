import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { useProgressStore } from "../state/progressStore";
import * as Haptics from "expo-haptics";

interface ProgressBarProps {
  currentScreen: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentScreen }) => {
  const { currentProgress, setProgress } = useProgressStore();
  // Initialize animatedWidth to currentProgress to prevent jumping backwards
  const animatedWidth = useRef(new Animated.Value(currentProgress)).current;
  const lastHapticProgress = useRef(currentProgress);

  useEffect(() => {
    // Update progress based on current screen
    setProgress(currentScreen);
  }, [currentScreen, setProgress]);

  useEffect(() => {
    // Add listener to track progress and trigger haptics every 5%
    const listenerId = animatedWidth.addListener(({ value }) => {
      const currentMilestone = Math.floor(value / 5) * 5;
      if (currentMilestone > lastHapticProgress.current && currentMilestone <= currentProgress) {
        lastHapticProgress.current = currentMilestone;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    });

    // Animate progress bar with smooth easing
    Animated.timing(animatedWidth, {
      toValue: currentProgress,
      duration: 800, // Increased to 800ms for smoother animation
      useNativeDriver: false,
    }).start();

    // Cleanup listener
    return () => {
      animatedWidth.removeListener(listenerId);
    };
  }, [currentProgress]);

  return (
    <View
      style={{
        width: "100%",
        height: 4,
        backgroundColor: "rgba(96, 165, 250, 0.2)", // Light blue background
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          backgroundColor: "#60A5FA", // Blue fill (app theme)
          borderRadius: 4,
          width: animatedWidth.interpolate({
            inputRange: [0, 100],
            outputRange: ["0%", "100%"],
          }),
        }}
      />
    </View>
  );
};
