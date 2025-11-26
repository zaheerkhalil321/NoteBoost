// Quick script to reset onboarding
// This clears the onboarding-storage key from AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';

async function resetOnboarding() {
  try {
    await AsyncStorage.removeItem('onboarding-storage');
    console.log('✅ Onboarding reset successfully!');
    console.log('The app will now show onboarding on next launch');
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
}

resetOnboarding();
