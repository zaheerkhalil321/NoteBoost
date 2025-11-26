import { create } from 'zustand';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';

interface AppUpdateState {
  isUpdateAvailable: boolean;
  updateInfo: {
    currentVersion: string;
    latestVersion: string;
    updateMessage: string;
  } | null;
  showUpdateModal: boolean;
  setUpdateAvailable: (available: boolean, info: AppUpdateState['updateInfo']) => void;
  dismissModal: () => void;
  checkForUpdates: () => Promise<void>;
}

export const useAppUpdateStore = create<AppUpdateState>((set, get) => ({
  isUpdateAvailable: false,
  updateInfo: null,
  showUpdateModal: false,

  setUpdateAvailable: (available, info) => {
    set({
      isUpdateAvailable: available,
      updateInfo: info,
      showUpdateModal: available,
    });
  },

  dismissModal: () => {
    set({ showUpdateModal: false });
  },

  checkForUpdates: async () => {
    try {
      // Skip in development mode
      if (__DEV__) {
        console.log('[AppUpdate] Skipping update check in dev mode');
        return;
      }

      // Check if running in Expo Go (not a standalone app)
      if (!Updates.isEnabled) {
        console.log('[AppUpdate] Updates not enabled (running in Expo Go)');
        return;
      }

      console.log('[AppUpdate] Checking for updates...');

      // Fetch update info from Expo
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        const currentVersion = Application.nativeApplicationVersion || '1.0.0';
        const buildNumber = Application.nativeBuildVersion || '1';

        console.log('[AppUpdate] Update available!');
        console.log(`Current version: ${currentVersion} (${buildNumber})`);

        set({
          isUpdateAvailable: true,
          updateInfo: {
            currentVersion,
            latestVersion: 'Latest', // Expo doesn't provide version info, just availability
            updateMessage: 'This version is no longer supported. Please update to continue using Vibecode.',
          },
          showUpdateModal: true,
        });
      } else {
        console.log('[AppUpdate] App is up to date');
        set({
          isUpdateAvailable: false,
          updateInfo: null,
          showUpdateModal: false,
        });
      }
    } catch (error) {
      console.error('[AppUpdate] Error checking for updates:', error);
      // Don't show error to user, silently fail
    }
  },
}));
