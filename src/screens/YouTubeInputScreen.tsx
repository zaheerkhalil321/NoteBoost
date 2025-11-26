import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useNotesStore } from "../state/notesStore";
import { getYouTubeTranscript } from "../api/youtube-transcript";
import { processNoteInBackground } from "../api/background-ai-generator";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { checkNoteAccess, consumeNoteAccess } from "../services/noteAccessService";

type YouTubeInputScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "YouTubeInput">;
};

export default function YouTubeInputScreen({
  navigation,
}: YouTubeInputScreenProps) {
  const insets = useSafeAreaInsets();
  const { addNote } = useNotesStore();

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Animation refs
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start rotation animation when processing
  useEffect(() => {
    if (isProcessing) {
      // Continuous rotation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [isProcessing]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleProcess = async () => {
    console.log("[YouTube] 🚀 BACKGROUND PROCESSING ENABLED - Updated version");
    if (!youtubeUrl.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Please enter a YouTube URL");
      return;
    }

    const videoId = extractVideoId(youtubeUrl.trim());
    if (!videoId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Invalid URL",
        "Please enter a valid YouTube URL or video ID"
      );
      return;
    }

    // Check if user has access (subscription or credits) BEFORE processing
    const accessStatus = await checkNoteAccess();

    if (!accessStatus.canCreate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "No Access",
        "You need an active subscription or at least 1 credit to create a note. Get credits by inviting friends or subscribe for unlimited notes!",
        [
          { text: "Get Credits", onPress: () => navigation.navigate("Referral") },
          { text: "Subscribe", onPress: () => navigation.navigate("Paywall") },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsProcessing(true);
      setProgressPercentage(0);
      setProcessingMessage("Fetching YouTube transcript...");

      const transcript = await getYouTubeTranscript(videoId, (progress) => {
        setProcessingMessage(progress);
        // Update progress for transcript fetching (0-40%)
        if (progress.includes("Checking")) setProgressPercentage(10);
        else if (progress.includes("Downloading")) {
          // Extract percentage from progress message if available
          const match = progress.match(/(\d+)%/);
          if (match) {
            const downloadPercent = parseInt(match[1]);
            // Map download progress to 10-35% range
            setProgressPercentage(10 + Math.floor(downloadPercent * 0.25));
          } else {
            setProgressPercentage(20);
          }
        }
        else if (progress.includes("Transcribing")) setProgressPercentage(35);
        else if (progress.includes("Complete") || progress.includes("found")) setProgressPercentage(40);
      });

      setProgressPercentage(40);
      setProcessingMessage("✅ Transcript ready!\nStarting AI generation...");

      // Create a placeholder note that will be processed in the background
      const noteId = addNote({
        title: "Processing YouTube Video...",
        content: "AI content is being generated. Please wait...",
        folderId: null,
        sourceType: "youtube",
        isProcessing: true,
        processingProgress: 40,
        processingMessage: "Starting AI generation...",
        transcript: transcript,
      });

      // Consume credit if no subscription
      const consumeResult = await consumeNoteAccess();
      if (!consumeResult.success && !accessStatus.hasSubscription) {
        console.warn('[YouTube] Failed to consume credit:', consumeResult.error);
      }

      // Small delay to show message
      await new Promise(resolve => setTimeout(resolve, 500));

      setIsProcessing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to home immediately
      navigation.navigate("Home");

      // Show success message with credit info
      let message = "Your note is being generated in the background. You can continue using the app, and the note will appear on your home screen when ready.";
      if (!accessStatus.hasSubscription && consumeResult.remainingCredits !== undefined) {
        message += `\n\nCredits remaining: ${consumeResult.remainingCredits}`;
      }

      Alert.alert("Processing Started!", message);

      // Start background processing (non-blocking)
      processNoteInBackground(noteId, transcript, "youtube").catch((error) => {
        console.error("Background processing failed:", error);
      });

    } catch (error) {
      console.error("Failed to process YouTube video:", error);
      setIsProcessing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Oops!",
        "We couldn't process the YouTube video. Please make sure the video has captions/subtitles available."
      );
    }
  };

  if (isProcessing) {
    return (
      <View className="flex-1">
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

        <View className="flex-1 items-center justify-center px-6">
          {/* Circular Progress */}
          <Animated.View
            className="relative items-center justify-center mb-8"
            style={{ transform: [{ scale: pulseAnim }] }}
          >
            <View className="w-40 h-40 rounded-full border-8 items-center justify-center" style={{ borderColor: 'rgba(252, 165, 165, 0.2)' }}>
              <Animated.View
                className="w-40 h-40 rounded-full border-8 absolute"
                style={{
                  borderTopColor: '#FC5C65',
                  borderRightColor: progressPercentage >= 25 ? '#FC5C65' : 'rgba(252, 165, 165, 0.2)',
                  borderBottomColor: progressPercentage >= 50 ? '#FC5C65' : 'rgba(252, 165, 165, 0.2)',
                  borderLeftColor: progressPercentage >= 75 ? '#FC5C65' : 'rgba(252, 165, 165, 0.2)',
                  transform: [{ rotate: spin }],
                }}
              />
              <Text className="text-[#1e293b] text-4xl font-bold z-10">
                {progressPercentage}%
              </Text>
            </View>
          </Animated.View>
          <Text className="text-[#1e293b] text-xl font-semibold text-center mb-2 px-8">
            {processingMessage.split('\n')[0]}
          </Text>
          <Text className="text-[#64748b] text-center text-base px-8 mb-4">
            {processingMessage.split('\n')[1] || "Please wait..."}
          </Text>
          <Text className="text-[#94A3B8] text-center text-sm px-8">
            This may take a moment. Please don't close the app.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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

      {/* Header */}
      <View className="px-5" style={{ paddingTop: insets.top + 16, paddingBottom: 16 }}>
        <View className="flex-row items-center">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            className="mr-3 active:opacity-60"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#FC5C65",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FC5C65" />
          </Pressable>
          <Text className="text-2xl font-bold text-[#1e293b]">
            YouTube Video
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center px-6">
        <View
          className="w-32 h-32 rounded-full items-center justify-center mb-8"
          style={{
            backgroundColor: 'rgba(252, 92, 101, 0.15)',
            borderWidth: 2,
            borderColor: '#FC5C65',
            shadowColor: "#FC5C65",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <Ionicons name="logo-youtube" size={64} color="#FC5C65" />
        </View>

        <Text className="text-[#1e293b] text-2xl font-bold mb-4 text-center">
          Enter YouTube URL
        </Text>

        <Text className="text-[#64748b] text-center text-base mb-8 px-6">
          Paste a YouTube video URL to generate AI-powered notes with summary,
          key points, quiz, flashcards, and more
        </Text>

        <View className="w-full max-w-md mb-6">
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(252, 92, 101, 0.3)',
              overflow: 'hidden',
              shadowColor: "#FC5C65",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <TextInput
              className="px-6 py-4 text-[#1e293b] text-base"
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor="#94A3B8"
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleProcess}
            />
          </View>
        </View>

        <Pressable
          onPress={handleProcess}
          style={({ pressed }) => ({
            width: '100%',
            maxWidth: 340,
            borderRadius: 28,
            overflow: 'hidden',
            shadowColor: '#FC5C65',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: pressed ? 0.25 : 0.35,
            shadowRadius: 20,
            elevation: pressed ? 8 : 12,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          <LinearGradient
            colors={['#FF8A95', '#FC5C65', '#E84855']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingVertical: 22,
              paddingHorizontal: 32,
              alignItems: 'center',
              borderRadius: 28,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Ionicons name="sparkles" size={20} color="white" />
              </View>
              <Text style={{
                color: 'white',
                fontWeight: '700',
                fontSize: 19,
                letterSpacing: 0.5,
              }}>
                Generate Notes
              </Text>
            </View>
          </LinearGradient>
        </Pressable>

        <View
          className="mt-8 rounded-xl p-4 w-full max-w-md"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderWidth: 1,
            borderColor: 'rgba(252, 92, 101, 0.2)',
          }}
        >
          <Text className="text-[#64748b] text-sm">
            <Text className="font-bold text-[#1e293b]">Tip:</Text> Make sure the
            video has captions or subtitles enabled for best results
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
