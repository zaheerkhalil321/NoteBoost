import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const useSplashScreen = () => {
  const hideSplash = async () => {
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      console.warn('[Splash Screen] Error hiding splash:', e);
    }
  };

  return { hideSplash };
};

// Usage in your App.tsx:
// const { hideSplash } = useSplashScreen();
// 
// useEffect(() => {
//   // After all initialization is complete
//   hideSplash();
// }, []);
