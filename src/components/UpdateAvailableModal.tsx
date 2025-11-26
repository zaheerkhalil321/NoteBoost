import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Updates from 'expo-updates';
import * as Application from 'expo-application';
import { useAppUpdateStore } from '../state/appUpdateStore';

export const UpdateAvailableModal: React.FC = () => {
  const { showUpdateModal, updateInfo, dismissModal } = useAppUpdateStore();

  const handleUpdate = async () => {
    try {
      if (__DEV__ || !Updates.isEnabled) {
        // In development or Expo Go, open the app store page
        const bundleId = Application.applicationId || 'com.vibecode.app';
        const appStoreUrl = Platform.select({
          ios: `https://apps.apple.com/app/id${bundleId}`,
          android: `https://play.google.com/store/apps/details?id=${bundleId}`,
        });

        if (appStoreUrl) {
          await Linking.openURL(appStoreUrl);
        }
      } else {
        // In production with OTA updates enabled
        console.log('[UpdateModal] Fetching and reloading update...');
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (error) {
      console.error('[UpdateModal] Error updating app:', error);
      // Fallback to app store if OTA update fails
      const bundleId = Application.applicationId || 'com.vibecode.app';
      const appStoreUrl = Platform.select({
        ios: `https://apps.apple.com/app/id${bundleId}`,
        android: `https://play.google.com/store/apps/details?id=${bundleId}`,
      });

      if (appStoreUrl) {
        await Linking.openURL(appStoreUrl);
      }
    }
  };

  if (!showUpdateModal || !updateInfo) {
    return null;
  }

  return (
    <Modal
      visible={showUpdateModal}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

        <View style={styles.modalContent}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>New Version Available</Text>
            </View>

            {/* Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.message}>{updateInfo.updateMessage}</Text>
            </View>

            {/* Update Button */}
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdate}
              activeOpacity={0.8}
            >
              <Text style={styles.updateButtonText}>Update now</Text>
            </TouchableOpacity>
          </View>

          {/* App Store Card at Bottom */}
          <View style={styles.appStoreCard}>
            <View style={styles.appStoreContent}>
              <View style={styles.appIcon}>
                <View style={styles.iconGradient} />
              </View>

              <View style={styles.appInfo}>
                <View style={styles.appStoreLabel}>
                  <Text style={styles.appStoreLabelText}>App Store</Text>
                </View>
                <Text style={styles.appName}>Vibecode - AI App Builder</Text>
                <Text style={styles.appTagline}>Lovable/Cursor for mobile apps</Text>
              </View>

              <TouchableOpacity
                style={styles.updateButtonSmall}
                onPress={handleUpdate}
                activeOpacity={0.7}
              >
                <Text style={styles.updateButtonSmallText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  modalCard: {
    backgroundColor: 'rgba(60, 60, 60, 0.95)',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 20,
  },
  message: {
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.85,
  },
  updateButton: {
    backgroundColor: 'rgba(80, 80, 80, 0.8)',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  updateButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appStoreCard: {
    backgroundColor: 'rgba(60, 60, 60, 0.95)',
    borderRadius: 14,
    padding: 16,
  },
  appStoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 12,
  },
  iconGradient: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 14,
  },
  appInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  appStoreLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  appStoreLabelText: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '500',
  },
  appName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  appTagline: {
    fontSize: 12,
    color: '#999999',
  },
  updateButtonSmall: {
    backgroundColor: 'rgba(100, 100, 100, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  updateButtonSmallText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
