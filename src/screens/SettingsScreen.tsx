import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Alert, Modal, Linking, Platform, Animated, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useNotesStore } from "../state/notesStore";
import { useOnboardingStore } from "../state/onboardingStore";
import { useReferralStore } from "../state/referralStore";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, saveLanguagePreference } from "../i18n/config";
import * as Haptics from "expo-haptics";
import { getPremiumPressableStyle } from "../config/animations";

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Settings">;
};

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const { notes, folders, clearAllData: clearNotesData } = useNotesStore();
  const { userName, userProfile, resetOnboarding } = useOnboardingStore();
  const { credits, referredUsers, clearAllData: clearReferralData } = useReferralStore();
  const { t, i18n } = useTranslation();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Calculate stats
  const totalQuizzes = notes.reduce((sum, note) => sum + (note.quiz?.length || 0), 0);
  const totalFlashcards = notes.reduce((sum, note) => sum + (note.flashcards?.length || 0), 0);

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  // Beautiful card style
  const cardStyle = {
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "rgba(226, 232, 240, 0.6)",
    overflow: "hidden" as const,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    shadowColor: "#7DD3FC",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
  };

  const changeLanguage = useCallback(async (languageCode: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await i18n.changeLanguage(languageCode);
    await saveLanguagePreference(languageCode);
    setShowLanguageModal(false);
  }, [i18n]);

  const getGoalEmoji = () => {
    if (!userProfile) return "🎯";
    switch (userProfile.dreamOutcome) {
      case "top-grades": return "🏆";
      case "efficient": return "⚡";
      case "confident": return "💪";
      default: return "🎯";
    }
  };

  const getCommitmentLevel = () => {
    if (!userProfile) return "Learner";
    switch (userProfile.commitment) {
      case "all-in": return "All-In Learner";
      case "serious": return "Serious Student";
      case "trying": return "Explorer";
      default: return "Learner";
    }
  };

  const handleRestorePurchases = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Restore Purchases",
      "Looking for your previous purchases...",
      [{ text: "Cancel", style: "cancel", onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }]
    );

    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "All Set!",
        "Your purchases have been restored successfully.",
        [{ text: "Great!", onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }]
      );
    }, 1500);
  }, []);

  const handleContactSupport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Need Help?",
      "We're here to help! Send us an email and we'll get back to you within 24 hours.",
      [
        { text: "Cancel", style: "cancel", onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) },
        {
          text: "Email Us",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Opening Email", "Your email app will open now.");
          },
        },
      ]
    );
  }, []);

  const handleRateUs = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const appStoreId = "YOUR_APP_ID";

      if (Platform.OS === "ios") {
        const url = `https://apps.apple.com/app/id${appStoreId}?action=write-review`;
        const supported = await Linking.canOpenURL(url);

        if (supported) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await Linking.openURL(url);
        } else {
          throw new Error("Can't open App Store");
        }
      } else if (Platform.OS === "android") {
        const packageName = "com.yourcompany.vibecode";
        const url = `market://details?id=${packageName}`;
        const supported = await Linking.canOpenURL(url);

        if (supported) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await Linking.openURL(url);
        } else {
          await Linking.openURL(`https://play.google.com/store/apps/details?id=${packageName}`);
        }
      }
    } catch (error) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert(
        "Love NoteBoost?",
        "Help us spread the word by rating us on the App Store! It means the world to us.",
        [
          { text: "Maybe Later", style: "cancel", onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) },
          {
            text: "Rate Now",
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Thank You!", "Your support helps us improve NoteBoost for everyone!");
            },
          },
        ]
      );
    }
  }, []);

  const handleTermsOfService = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Terms of Service",
      "Opening Terms of Service in your browser...",
      [
        { text: "Cancel", style: "cancel", onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) },
        {
          text: "Open",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const url = "https://vibecode.com/terms";
            const supported = await Linking.canOpenURL(url);
            if (supported) {
              await Linking.openURL(url);
            }
          },
        },
      ]
    );
  }, []);

  const handlePrivacyPolicy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Privacy Policy",
      "Opening Privacy Policy in your browser...",
      [
        { text: "Cancel", style: "cancel", onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) },
        {
          text: "Open",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const url = "https://apptimize.app/privacy-policy";
            const supported = await Linking.canOpenURL(url);
            if (supported) {
              await Linking.openURL(url);
            }
          },
        },
      ]
    );
  }, []);

  const handleClearAllData = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Clear Everything?",
      "This will delete all your notes, folders, and settings. This can't be undone.",
      [
        { text: "Cancel", style: "cancel", onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) },
        {
          text: "Delete All",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Clear all data from all stores
            clearNotesData();
            clearReferralData();
            Alert.alert("All Clear!", "All your data has been deleted.");
          },
        },
      ]
    );
  }, [clearNotesData, clearReferralData]);

  const handleResetOnboarding = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Start Over?",
      "This will take you back through the setup process. Your notes will stay safe.",
      [
        { text: "Cancel", style: "cancel", onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            resetOnboarding();
            navigation.reset({
              index: 0,
              routes: [{ name: "Welcome" }],
            });
          },
        },
      ]
    );
  }, [resetOnboarding, navigation]);

  return (
    <View className="flex-1 bg-white">
      {/* Gradient Background */}
      <LinearGradient
        colors={["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]}
        locations={[0, 0.4, 0.7, 1]}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />
      {/* Simple Header */}
      <View className="px-5" style={{ paddingTop: insets.top + 16, paddingBottom: 16 }}>
        <View className="flex-row items-center mb-2">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            style={({ pressed }) => getPremiumPressableStyle(pressed, {
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              marginRight: 12,
            })}
          >
            <Ionicons name="arrow-back" size={24} color="#7DD3FC" />
          </Pressable>
          <Text className="text-3xl font-bold text-[#1e293b]">Settings</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid - Note Stats Only */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-[#64748b] mb-3">Your Content</Text>
          <View className="flex-row flex-wrap -mx-1.5">
            {/* Total Notes */}
            <View className="w-1/2 px-1.5 mb-3">
              <View style={{
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.4)",
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 3,
              }}>
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="document-text" size={20} color="#7DD3FC" />
                  <Text className="text-2xl font-bold text-[#1e293b]">{notes.length}</Text>
                </View>
                <Text className="text-sm text-[#64748b]">Notes</Text>
              </View>
            </View>

            {/* Total Folders */}
            <View className="w-1/2 px-1.5 mb-3">
              <View style={{
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.4)",
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                shadowColor: "#10b981",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 3,
              }}>
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="folder" size={20} color="#10b981" />
                  <Text className="text-2xl font-bold text-[#1e293b]">{folders.length}</Text>
                </View>
                <Text className="text-sm text-[#64748b]">Folders</Text>
              </View>
            </View>

            {/* Total Quizzes */}
            <View className="w-1/2 px-1.5">
              <View style={{
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.4)",
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                shadowColor: "#f59e0b",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 3,
              }}>
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="help-circle" size={20} color="#f59e0b" />
                  <Text className="text-2xl font-bold text-[#1e293b]">{totalQuizzes}</Text>
                </View>
                <Text className="text-sm text-[#64748b]">Quizzes</Text>
              </View>
            </View>

            {/* Total Flashcards */}
            <View className="w-1/2 px-1.5">
              <View style={{
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.4)",
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                shadowColor: "#8b5cf6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 3,
              }}>
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="layers" size={20} color="#8b5cf6" />
                  <Text className="text-2xl font-bold text-[#1e293b]">{totalFlashcards}</Text>
                </View>
                <Text className="text-sm text-[#64748b]">Flashcards</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Sections - Clean light style */}
        <View style={{
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          borderRadius: 24,
          padding: 20,
          marginBottom: 20,
          borderWidth: 1.5,
          borderColor: "rgba(226, 232, 240, 0.6)",
          shadowColor: "#7DD3FC",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 5,
        }}>
          <Text className="text-lg font-bold text-[#1e293b] mb-4">General</Text>

          {/* Earn Credits */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("Referral");
            }}
            style={({ pressed }) => getPremiumPressableStyle(pressed, {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "rgba(226, 232, 240, 0.5)",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 2,
            })}
          >
            <View style={{ padding: 18 }}>
              <View className="flex-row items-center">
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: "rgba(125, 211, 252, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <Ionicons name="gift" size={26} color="#7DD3FC" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-lg font-bold text-[#1e293b]">Earn Credits</Text>
                    {credits > 0 && (
                      <View
                        style={{
                          backgroundColor: "rgba(125, 211, 252, 0.2)",
                          paddingHorizontal: 10,
                          paddingVertical: 3,
                          borderRadius: 10,
                        }}
                      >
                        <Text className="text-xs font-bold text-[#7DD3FC]">{credits} credits</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm text-[#64748b] mt-1 font-medium">
                    Get 5 credits per 3 referrals • {referredUsers.length}/3
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
              </View>
            </View>
          </Pressable>

          {/* Language */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowLanguageModal(true);
            }}
            style={({ pressed }) => getPremiumPressableStyle(pressed, {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "rgba(226, 232, 240, 0.5)",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 2,
            })}
          >
            <View style={{ padding: 18 }}>
              <View className="flex-row items-center">
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: "rgba(125, 211, 252, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <Text style={{ fontSize: 24 }}>{currentLanguage.flag}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-[#1e293b]">Language</Text>
                  <Text className="text-sm text-[#64748b] mt-1 font-medium">{currentLanguage.nativeName}</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
              </View>
            </View>
          </Pressable>

          {/* Restore Purchases */}
          <Pressable
            onPress={handleRestorePurchases}
            style={({ pressed }) => getPremiumPressableStyle(pressed, {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(226, 232, 240, 0.5)",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 2,
            })}
          >
            <View style={{ padding: 18 }}>
              <View className="flex-row items-center">
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: "rgba(125, 211, 252, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <Ionicons name="refresh-circle" size={28} color="#7DD3FC" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-[#1e293b]">Restore Purchases</Text>
                  <Text className="text-sm text-[#64748b] mt-1 font-medium">Get back what you bought</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
              </View>
            </View>
          </Pressable>
        </View>

        {/* Support Section */}
        <View style={{
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          borderRadius: 24,
          padding: 20,
          marginBottom: 20,
          borderWidth: 1.5,
          borderColor: "rgba(226, 232, 240, 0.6)",
          shadowColor: "#7DD3FC",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 5,
        }}>
          <Text className="text-lg font-bold text-[#1e293b] mb-4">Support</Text>

          {/* Contact Support */}
          <Pressable
            onPress={handleContactSupport}
            style={({ pressed }) => getPremiumPressableStyle(pressed, {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "rgba(226, 232, 240, 0.5)",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 2,
            })}
          >
            <View style={{ padding: 18 }}>
              <View className="flex-row items-center">
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: "rgba(125, 211, 252, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <Ionicons name="mail" size={26} color="#7DD3FC" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-[#1e293b]">Contact Support</Text>
                  <Text className="text-sm text-[#64748b] mt-1 font-medium">We reply within 24 hours</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
              </View>
            </View>
          </Pressable>

          {/* Rate Us */}
          <Pressable
            onPress={handleRateUs}
            style={({ pressed }) => getPremiumPressableStyle(pressed, {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "rgba(226, 232, 240, 0.5)",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 2,
            })}
          >
            <View style={{ padding: 18 }}>
              <View className="flex-row items-center">
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: "rgba(125, 211, 252, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <Ionicons name="star" size={26} color="#7DD3FC" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-[#1e293b]">Rate Us</Text>
                  <Text className="text-sm text-[#64748b] mt-1 font-medium">Help us improve</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
              </View>
            </View>
          </Pressable>

          {/* Terms of Service */}
          <Pressable
            onPress={handleTermsOfService}
            style={({ pressed }) => getPremiumPressableStyle(pressed, {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "rgba(226, 232, 240, 0.5)",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 2,
            })}
          >
            <View style={{ padding: 18 }}>
              <View className="flex-row items-center">
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: "rgba(125, 211, 252, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <Ionicons name="document-text-outline" size={26} color="#7DD3FC" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-[#1e293b]">Terms of Service</Text>
                  <Text className="text-sm text-[#64748b] mt-1 font-medium">Read our terms</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
              </View>
            </View>
          </Pressable>

          {/* Privacy Policy */}
          <Pressable
            onPress={handlePrivacyPolicy}
            style={({ pressed }) => getPremiumPressableStyle(pressed, {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(226, 232, 240, 0.5)",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 2,
            })}
          >
            <View style={{ padding: 18 }}>
              <View className="flex-row items-center">
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: "rgba(125, 211, 252, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <Ionicons name="shield-checkmark-outline" size={26} color="#7DD3FC" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-[#1e293b]">Privacy Policy</Text>
                  <Text className="text-sm text-[#64748b] mt-1 font-medium">How we protect your data</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
              </View>
            </View>
          </Pressable>
        </View>

        {/* Danger Zone - Clearly separated */}
        <View style={{
          backgroundColor: "rgba(254, 242, 242, 0.6)",
          borderRadius: 24,
          padding: 20,
          marginBottom: 20,
          borderWidth: 1.5,
          borderColor: "rgba(252, 165, 165, 0.5)",
          shadowColor: "#EF4444",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 5,
        }}>
          <Text className="text-lg font-bold text-[#EF4444] mb-4">Danger Zone</Text>

          {/* Reset Onboarding */}
          <Pressable
            onPress={handleResetOnboarding}
            style={({ pressed }) => getPremiumPressableStyle(pressed, {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: 18,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "rgba(251, 191, 36, 0.3)",
              shadowColor: "#F59E0B",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 2,
            })}
          >
            <View style={{ padding: 18 }}>
              <View className="flex-row items-center">
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <Ionicons name="refresh-outline" size={26} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-[#F59E0B]">Start Over</Text>
                  <Text className="text-sm text-[#64748b] mt-1 font-medium">Go through setup again</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
              </View>
            </View>
          </Pressable>

          {/* Clear All Data */}
          <Pressable
            onPress={handleClearAllData}
            style={({ pressed }) => getPremiumPressableStyle(pressed, {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(252, 165, 165, 0.5)",
              shadowColor: "#EF4444",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 2,
            })}
          >
            <View style={{ padding: 18 }}>
              <View className="flex-row items-center">
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <Ionicons name="trash-outline" size={26} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-[#EF4444]">Delete Everything</Text>
                  <Text className="text-sm text-[#64748b] mt-1 font-medium">Can't be undone</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
              </View>
            </View>
          </Pressable>
        </View>

        {/* App Info - Minimal footer */}
        <View className="items-center pt-6 pb-4">
          <View className="flex-row items-center mb-2">
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 6,
            }}>
              <Image
                source={require("../assets/images/logo.png")}
                style={{
                  width: 32,
                  height: 32,
                }}
                resizeMode="contain"
              />
            </View>
            <Text className="text-lg font-bold text-[#1e293b]">NoteBoost AI</Text>
          </View>
          <Text className="text-sm text-[#94A3B8]">Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Language Modal - Light and modern */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowLanguageModal(false);
          }}
        >
          <Pressable
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 24,
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 20,
              borderTopWidth: 1,
              borderColor: "#E2E8F0",
              maxHeight: "80%",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <View className="items-center mb-4">
              <View style={{
                width: 40,
                height: 4,
                backgroundColor: "#CBD5E1",
                borderRadius: 2,
              }} />
            </View>

            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-[#1e293b]">Choose Language</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowLanguageModal(false);
                }}
                style={({ pressed }) => getPremiumPressableStyle(pressed, {})}
              >
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  onPress={() => changeLanguage(lang.code)}
                  style={({ pressed }) => getPremiumPressableStyle(pressed, {
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    borderRadius: 16,
                    marginBottom: 10,
                    backgroundColor: i18n.language === lang.code ? "rgba(125, 211, 252, 0.15)" : "#F8FAFC",
                    borderWidth: 1,
                    borderColor: i18n.language === lang.code ? "#7DD3FC" : "#E2E8F0",
                  })}
                >
                  <Text style={{ fontSize: 28, marginRight: 14 }}>{lang.flag}</Text>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-[#1e293b]">{lang.nativeName}</Text>
                    <Text className="text-base text-[#64748b]">{lang.name}</Text>
                  </View>
                  {i18n.language === lang.code && (
                    <Ionicons name="checkmark-circle" size={24} color="#7DD3FC" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
