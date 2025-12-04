import { create } from 'zustand';
import * as Application from 'expo-application';

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
      // Skip update checking - not using OTA updates
      console.log('[AppUpdate] OTA updates disabled, skipping update check');
      return;
    } catch (error) {
      console.error('[AppUpdate] Error checking for updates:', error);
      // Don't show error to user, silently fail
    }
  },
}));
