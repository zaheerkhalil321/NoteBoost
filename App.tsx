import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as ExpoSplashScreen from "expo-splash-screen";
import { RootStackParamList } from "./src/navigation/types";
import { useOnboardingStore } from "./src/state/onboardingStore";
import { useEffect, useState, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { initDatabase } from "./src/services/database";
import { initializeSupabase } from "./src/services/supabase/config";
import { initSupabaseUser, setUserReferralProperties } from "./src/services/firebaseAnalytics";
import { initMixpanel, identify as mixpanelIdentify, track as mixpanelTrack } from "./src/services/mixpanel";
import { createOrGetUser, getReferralStats } from "./src/services/referralService";
import { initializeOptimizedSync } from "./src/services/optimizedSync";
import { initializeAnalytics, logScreenView, type ScreenName } from "./src/services/localAnalytics";
import HomeScreen from "./src/screens/HomeScreen";
import NoteEditorScreen from "./src/screens/NoteEditorScreen";
import FeynmanScreen from "./src/screens/FeynmanScreen";
import SearchScreen from "./src/screens/SearchScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ReferralScreen from "./src/screens/ReferralScreen";
import OnboardingReferralScreen from "./src/screens/OnboardingReferralScreen";
import ContentSourceScreen from "./src/screens/ContentSourceScreen";
import AudioRecorderScreen from "./src/screens/AudioRecorderScreen";
import YouTubeInputScreen from "./src/screens/YouTubeInputScreen";
import DocumentUploadScreen from "./src/screens/DocumentUploadScreen";
import TextInputScreen from "./src/screens/TextInputScreen";
import LinkInputScreen from "./src/screens/LinkInputScreen";
import VoiceAssistantScreen from "./src/screens/VoiceAssistantScreen";
import ScreenshotOCRScreen from "./src/screens/ScreenshotOCRScreen";
import LearningPathScreen from "./src/screens/LearningPathScreen";
import AudioTimestampScreen from "./src/screens/AudioTimestampScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import PainPointScreen from "./src/screens/PainPointScreen";
import PainPointScreen2 from "./src/screens/PainPointScreen2";
import PainPointScreen3 from "./src/screens/PainPointScreen3";
import PersonalizationTransitionScreen from "./src/screens/PersonalizationTransitionScreen";
import AIGenerationScreen from "./src/screens/AIGenerationScreen";
import PlanReadyScreen from "./src/screens/PlanReadyScreen";
import EffectivenessComparisonScreen from "./src/screens/EffectivenessComparisonScreen";
import SuccessRateScreen from "./src/screens/SuccessRateScreen";
import ResultsTimelineScreen from "./src/screens/ResultsTimelineScreen";
import RatingScreen from "./src/screens/RatingScreen";
import FeedbackScreen from "./src/screens/FeedbackScreen";
import CommitmentScreen from "./src/screens/CommitmentScreen";
import InviteReferralScreen from "./src/screens/InviteReferralScreen";
import PaywallScreen from "./src/screens/PaywallScreen";
import BackendTestScreen from "./src/screens/BackendTestScreen";
import OfflineIndicator from "./src/components/OfflineIndicator";
import { XPNotification } from "./src/components/XPNotification";
import { useXPNotificationStore } from "./src/state/xpNotificationStore";
import { UpdateAvailableModal } from "./src/components/UpdateAvailableModal";
import { useAppUpdateStore } from "./src/state/appUpdateStore";
import "./src/i18n/config"; // Initialize i18n
import revenueCatService from "./src/services/revenueCat";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project. 
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const hasCompletedOnboarding = useOnboardingStore((state) => state.hasCompletedOnboarding);
  const [isReady, setIsReady] = useState(false);
  const { visible: xpVisible, xpAmount, hideXPNotification } = useXPNotificationStore();
  const checkForUpdates = useAppUpdateStore((state) => state.checkForUpdates);
  const navigationRef = useRef<any>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const autoSyncCleanup = useRef<(() => void) | null>(null);
  const splashStartTime = useRef<number>(Date.now());
  const minSplashDuration = 1500; // 2.5 seconds minimum - ensures splash screen shows long enough for branding

  // Function to hide splash screen with minimum duration guarantee
  const hideSplashScreen = useCallback(() => {
    const elapsedTime = Date.now() - splashStartTime.current;
    const remainingTime = Math.max(0, minSplashDuration - elapsedTime);

    setTimeout(() => {
      ExpoSplashScreen.hideAsync().catch((e) => {
        console.warn('[App] Error hiding splash screen:', e);
      });
    }, remainingTime);
  }, [minSplashDuration]);

  useEffect(() => {
    // Prevent native splash screen from auto-hiding
    // Prevent native splash screen from auto-hiding
    ExpoSplashScreen.preventAutoHideAsync().catch((e) => {
      console.warn('[App] Error preventing splash screen auto-hide:', e);
    });

    // Initialize database and wait for store hydration
    const initialize = async () => {
      try {
        await initDatabase();
        console.log('[App] Database initialized');

        // Initialize Supabase (Auth, Database)
        try {
          await initializeSupabase();
          console.log('[App] Supabase initialized');

          // Initialize Supabase user with anonymous auth
          await initSupabaseUser();
          console.log('[App] Supabase user authenticated');

          // Set user referral properties for analytics
          const user = await createOrGetUser();
          const stats = await getReferralStats(user.id);
          const isReferredUser = !!(await (async () => {
            const db = (await import('./src/services/database')).getDatabase();
            const userData: any = await db.getFirstAsync(
              'SELECT used_referral_code FROM users WHERE id = ?',
              [user.id]
            );
            return userData?.used_referral_code;
          })());

          await setUserReferralProperties(
            user.id,
            stats.totalReferrals > 0,
            stats.totalReferrals,
            stats.totalCredits,
            stats.completedCycles,
            isReferredUser,
            isReferredUser ? (await (async () => {
              const db = (await import('./src/services/database')).getDatabase();
              const userData: any = await db.getFirstAsync(
                'SELECT used_referral_code FROM users WHERE id = ?',
                [user.id]
              );
              return userData?.used_referral_code;
            })()) : undefined
          );

          // Initialize Mixpanel and identify user
          try {
            await initMixpanel();
            await mixpanelIdentify(user.id);
            await mixpanelTrack('app_startup', { user_id: user.id });
            console.log('[Mixpanel] Initialized and user identified');
          } catch (mpError) {
            console.warn('[Mixpanel] Initialization or identify failed:', mpError);
          }

          console.log('[App] User properties set');
        } catch (supabaseError) {
          console.error('[App] Supabase initialization failed:', supabaseError);
          // Don't block app if Supabase fails
        }

        // Initialize optimized sync service (batched, debounced)
        try {
          console.log('[App] Initializing optimized sync service...');
          const cleanup = initializeOptimizedSync();
          autoSyncCleanup.current = cleanup;
          console.log('[App] Optimized sync service initialized');
        } catch (syncError) {
          console.error('[App] Auto-sync initialization failed:', syncError);
          // Don't block app if sync fails
        }
      } catch (error) {
        console.error('[App] Database initialization failed:', error);
      }

      // Initialize RevenueCat with timeout
      const revenueCatPromise = revenueCatService.initialize().catch((error) => {
        console.error('[App] RevenueCat initialization failed:', error);
      });

      // Initialize local analytics
      try {
        await initializeAnalytics();
        console.log('[App] Analytics initialized');
      } catch (analyticsError) {
        console.error('[App] Analytics initialization failed:', analyticsError);
      }

      // Set a timeout to ensure app loads even if RevenueCat hangs
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log('[App] Initialization timeout reached, proceeding with app load');
          resolve();
        }, 3000);
      });

      // Wait for RevenueCat or timeout, whichever comes first
      await Promise.race([revenueCatPromise, timeoutPromise]);

      // Small delay to ensure store is hydrated
      setTimeout(() => {
        setIsReady(true);
        console.log('[App] App is ready');

        // Hide splash screen with minimum duration guarantee
        hideSplashScreen();

        // Check for app updates after initialization
        checkForUpdates();
      }, 100);
    };

    initialize();
  }, []);

  // Cleanup auto-sync on unmount
  useEffect(() => {
    return () => {
      if (autoSyncCleanup.current) {
        console.log('[App] Cleaning up auto-sync');
        autoSyncCleanup.current();
      }
    };
  }, []);

  useEffect(() => {
    // Listen to app state changes
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // When app comes back to foreground from background
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        hasCompletedOnboarding
      ) {
        console.log('[App] App returned to foreground, checking subscription status');

        // Check for app updates when returning to foreground
        checkForUpdates();

        // Skip paywall check in dev mode
        // if (__DEV__) {
        //   console.log('[App] DEV MODE: Skipping paywall check');
        //   appState.current = nextAppState;
        //   return;
        // }

        // Check if user has active subscription
        const isSubscribed = await revenueCatService.isUserSubscribed();
        console.log("🚀 ~ App ~ isSubscribed:", isSubscribed)

        if (!isSubscribed && navigationRef.current) {
          console.log('[App] User not subscribed, showing paywall');
          // Navigate to paywall
          navigationRef.current.navigate('Paywall');
        } else {
          console.log('[App] User is subscribed or subscription check failed');
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [hasCompletedOnboarding]);

  if (!isReady) {
    // Don't render anything while native splash screen is visible
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            console.log('[Navigation] Navigation ready');
          }}
          onStateChange={async (state) => {
            // Get current screen name from navigation state
            const route = state?.routes[state.index];
            if (route) {
              const screenName = (route.name as ScreenName) || route.name;
              console.log('[Navigation] Screen changed to:', screenName);
              
              // Log screen view to analytics
              logScreenView(screenName as ScreenName, {
                previous_screen: navigationRef.current?.getCurrentRoute?.()?.name,
              }).catch((error) => {
                console.error('[Analytics] Error logging screen view:', error);
              });
            }
          }}
        >
          <Stack.Navigator
            initialRouteName={hasCompletedOnboarding ? "Home" : "Welcome"}
            screenOptions={{
              headerShown: false,
              animation: "default",
            }}
          >
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="ReferralOnboarding"
              component={OnboardingReferralScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="PainPoint"
              component={PainPointScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="PainPoint2"
              component={PainPointScreen2}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="PainPoint3"
              component={PainPointScreen3}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="PersonalizationTransition"
              component={PersonalizationTransitionScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="AIGeneration"
              component={AIGenerationScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="PlanReady"
              component={PlanReadyScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="EffectivenessComparison"
              component={EffectivenessComparisonScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="SuccessRate"
              component={SuccessRateScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="ResultsTimeline"
              component={ResultsTimelineScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="Rating"
              component={RatingScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="Feedback"
              component={FeedbackScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="Commitment"
              component={CommitmentScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="InviteReferral"
              component={InviteReferralScreen}
              options={{
                animation: "fade",
              }}
            />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{
                animation: "slide_from_bottom",
                presentation: "fullScreenModal",
              }}
            />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="NoteEditor"
              component={NoteEditorScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="Feynman"
              component={FeynmanScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="Referral"
              component={ReferralScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="BackendTest"
              component={BackendTestScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="ContentSource"
              component={ContentSourceScreen}
              options={{
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="AudioRecorder"
              component={AudioRecorderScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="YouTubeInput"
              component={YouTubeInputScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="DocumentUpload"
              component={DocumentUploadScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="TextInput"
              component={TextInputScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="LinkInput"
              component={LinkInputScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="VoiceAssistant"
              component={VoiceAssistantScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="ScreenshotOCR"
              component={ScreenshotOCRScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="LearningPath"
              component={LearningPathScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="AudioTimestamp"
              component={AudioTimestampScreen}
              options={{
                animation: "slide_from_right",
              }}
            />
          </Stack.Navigator>
          <StatusBar style="dark" />
          <OfflineIndicator />
          <XPNotification
            visible={xpVisible}
            xpAmount={xpAmount}
            onHide={hideXPNotification}
          />
          <UpdateAvailableModal />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
