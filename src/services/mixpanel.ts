import { Mixpanel } from 'mixpanel-react-native';
import Constants from 'expo-constants';

let mixpanel: Mixpanel | null = null;

export const initMixpanel = async (token?: string, opts?: { useNative?: boolean; trackAutomaticEvents?: boolean }) => {
  try {
    // If we already initialized, return the existing instance
    if (mixpanel) {
      if (__DEV__) console.log('[Mixpanel] Already initialized');
      return mixpanel;
    }
  const mixpanelToken = token || process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || process.env.MIXPANEL_TOKEN || (Constants.expoConfig?.extra?.mixpanelToken as string);
    if (!mixpanelToken) {
      console.warn('[Mixpanel] No token provided, skipping Mixpanel init');
      return null;
    }

    const trackAutomaticEvents: boolean = opts?.trackAutomaticEvents ?? false;
  const expoOwnership = Constants.expoConfig?.owner || (Constants as any).appOwnership;
  const useNative: boolean = opts?.useNative ?? (expoOwnership !== 'expo');

    // The Mixpanel constructor's overload expects a literal boolean for useNative; forward appropriately
    if (useNative) {
      mixpanel = new Mixpanel(mixpanelToken, trackAutomaticEvents, true);
    } else {
      // JavaScript mode (Expo); no custom storage by default
      mixpanel = new Mixpanel(mixpanelToken, trackAutomaticEvents, false);
    }
    await mixpanel.init();
    // Register some global super properties (app version, platform)
    try {
  const appName = (Constants.expoConfig as any)?.name || (Constants.manifest as any)?.name || 'NoteBoost';
  const appVersion = (Constants.expoConfig as any)?.version || (Constants.manifest as any)?.version || process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0';
      mixpanel.registerSuperProperties({ app_name: appName, app_version: appVersion, platform: expoOwnership });
    } catch (e) {
      // ignore register super properties error
    }
    // Enable debug during development
    if (__DEV__) {
      try {
        mixpanel.setLoggingEnabled(true);
      } catch (e) {
        // ignore
      }
    }

    console.log('[Mixpanel] Initialized');
    return mixpanel;
  } catch (error) {
    console.error('[Mixpanel] Initialization error:', error);
    mixpanel = null;
    return null;
  }
};

export const track = async (eventName: string, properties?: Record<string, any>) => {
  if (!mixpanel) {
    console.warn('[Mixpanel] Not initialized, skipping track:', eventName);
    return;
  }
  try {
  if (__DEV__) console.log('[Mixpanel] TRACK:', eventName, properties);
    await mixpanel.track(eventName, properties);
  } catch (error) {
    console.error('[Mixpanel] Error tracking event:', eventName, error);
  }
};

export const identify = async (distinctId: string) => {
  if (__DEV__) console.log("🚀 ~ identify ~ distinctId:", distinctId)
  if (!mixpanel) {
    console.warn('[Mixpanel] Not initialized, skipping identify');
    return;
  }
  try {
    await mixpanel.identify(distinctId);
  } catch (error) {
    console.error('[Mixpanel] Error identifying user:', error);
  }
};

export const setUserProfile = async (props: Record<string, any>) => {
  if (!mixpanel) {
    console.warn('[Mixpanel] Not initialized, skipping setUserProfile');
    return;
  }
  try {
    // getPeople returns an object with methods like set
    const people = mixpanel.getPeople();
    if (!people) return;
    await people.set(props);
  } catch (error) {
    console.error('[Mixpanel] Error setting user profile:', error);
  }
};

export const registerSuperProperties = async (props: Record<string, any>) => {
  if (!mixpanel) return;
  try {
    await mixpanel.registerSuperProperties(props);
  } catch (error) {
    console.error('[Mixpanel] Error registering super properties:', error);
  }
};

export const timeEvent = async (eventName: string) => {
  if (!mixpanel) return;
  try {
    await mixpanel.timeEvent(eventName);
  } catch (error) {
    console.error('[Mixpanel] Error timeEvent:', eventName, error);
  }
};

export const flush = async () => {
  if (!mixpanel) return;
  try {
    await mixpanel.flush();
  } catch (error) {
    console.error('[Mixpanel] Error flushing events:', error);
  }
};

export const optOutTracking = async () => {
  if (!mixpanel) return;
  try {
    await mixpanel.optOutTracking();
  } catch (error) {
    console.error('[Mixpanel] Error opting out:', error);
  }
};

export const optInTracking = async () => {
  if (!mixpanel) return;
  try {
    await mixpanel.optInTracking();
  } catch (error) {
    console.error('[Mixpanel] Error opting in:', error);
  }
};

export const reset = async () => {
  if (!mixpanel) return;
  try {
    await mixpanel.reset();
  } catch (error) {
    console.error('[Mixpanel] Error resetting instance:', error);
  }
};

export const getMixpanelInstance = () => mixpanel;
