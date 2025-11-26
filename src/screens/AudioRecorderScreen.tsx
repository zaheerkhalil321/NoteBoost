import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as DocumentPicker from "expo-document-picker";
import * as MediaLibrary from "expo-media-library";
import { transcribeAudio } from "../api/transcribe-audio";
import { useNotesStore } from "../state/notesStore";
import { useGamificationStore } from "../state/gamificationStore";
import { generateNoteContent } from "../api/ai-content-generator";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { checkNoteAccess, consumeNoteAccess } from "../services/noteAccessService";
import { useAudioProcessingStore } from "../state/audioProcessingStore";

type AudioRecorderScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "AudioRecorder">;
};

const MINIMUM_RECORDING_DURATION = 3; // 3 seconds minimum

// Lazy load Audio module to avoid early initialization
const getAudio = async () => {
  const expoAV = await import("expo-av");
  return expoAV.Audio;
};

export default function AudioRecorderScreen({
  navigation,
}: AudioRecorderScreenProps) {
  const insets = useSafeAreaInsets();
  const { addNote } = useNotesStore();
  const { addXP } = useGamificationStore();
  const { addJob, updateJobProgress, completeJob, failJob } = useAudioProcessingStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const recordingRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animation refs
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(1)).current;
  const waveAnim2 = useRef(new Animated.Value(1)).current;
  const waveAnim3 = useRef(new Animated.Value(1)).current;
  const recordingPulse = useRef(new Animated.Value(1)).current;

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

  // Recording animation with waves
  useEffect(() => {
    if (isRecording && !isPaused) {
      // Pulsing center circle
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingPulse, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(recordingPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave 1 (innermost)
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim1, {
            toValue: 1.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim1, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave 2 (middle)
      Animated.loop(
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(waveAnim2, {
            toValue: 1.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim2, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave 3 (outermost)
      Animated.loop(
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(waveAnim3, {
            toValue: 1.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim3, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      recordingPulse.setValue(1);
      waveAnim1.setValue(1);
      waveAnim2.setValue(1);
      waveAnim3.setValue(1);
    }
  }, [isRecording, isPaused]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const waveOpacity1 = waveAnim1.interpolate({
    inputRange: [1, 1.3],
    outputRange: [0.6, 0],
  });

  const waveOpacity2 = waveAnim2.interpolate({
    inputRange: [1, 1.3],
    outputRange: [0.4, 0],
  });

  const waveOpacity3 = waveAnim3.interpolate({
    inputRange: [1, 1.3],
    outputRange: [0.2, 0],
  });

  const startRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const AudioModule = await getAudio();
      const { status } = await AudioModule.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Needed", "Please allow microphone access to record audio");
        return;
      }

      await AudioModule.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await AudioModule.Recording.createAsync(
        AudioModule.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);

      intervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.log("Failed to start recording:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Oops!", "We couldn't start recording. Please try again.");
    }
  };

  const pauseRecording = async () => {
    try {
      if (!recordingRef.current) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await recordingRef.current.pauseAsync();
      setIsPaused(true);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (error) {
      console.log("Failed to pause recording:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Oops!", "We couldn't pause the recording. Please try again.");
    }
  };

  const resumeRecording = async () => {
    try {
      if (!recordingRef.current) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await recordingRef.current.startAsync();
      setIsPaused(false);

      intervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.log("Failed to resume recording:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Oops!", "We couldn't resume the recording. Please try again.");
    }
  };

  const discardRecording = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (error) {
          console.log("Error stopping recording during discard:", error);
        }
        recordingRef.current = null;
      }

      const AudioModule = await getAudio();
      await AudioModule.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setIsRecording(false);
      setIsPaused(false);
      setRecordingDuration(0);
    } catch (error) {
      console.log("Error discarding recording:", error);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      // Stop the timer first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Check minimum duration BEFORE stopping the recording
      if (recordingDuration < MINIMUM_RECORDING_DURATION) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          "Recording Too Short",
          `Please record for at least ${MINIMUM_RECORDING_DURATION} seconds to create a note. Your recording was only ${recordingDuration} second${recordingDuration === 1 ? '' : 's'}.`,
          [
            {
              text: "Keep Recording",
              style: "cancel",
              onPress: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (isPaused) {
                  resumeRecording();
                } else {
                  // Resume the timer if not paused
                  intervalRef.current = setInterval(() => {
                    setRecordingDuration((prev) => prev + 1);
                  }, 1000);
                }
              }
            },
            {
              text: "Discard",
              style: "destructive",
              onPress: discardRecording
            }
          ]
        );
        return;
      }

      // Recording is long enough, proceed with processing
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await recordingRef.current.stopAndUnloadAsync();

      const uri = recordingRef.current.getURI();

      const AudioModule = await getAudio();
      await AudioModule.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      setIsRecording(false);
      setIsPaused(false);
      recordingRef.current = null;

      if (uri) {
        await processAudio(uri);
      }
    } catch (error) {
      console.log("Failed to stop recording:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Clean up on error
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.log("Error cleaning up recording:", cleanupError);
        }
        recordingRef.current = null;
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setIsRecording(false);
      setIsPaused(false);

      Alert.alert("Oops!", "We couldn't stop the recording. Please try again.");
    }
  };

  const handleUploadAudio = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // On iOS, show options to user
      if (Platform.OS === 'ios') {
        Alert.alert(
          "Select Audio Source",
          "Choose where to import your audio from:",
          [
            {
              text: "Files App",
              onPress: async () => {
                try {
                  const result = await DocumentPicker.getDocumentAsync({
                    type: ["audio/*", "audio/m4a", "audio/mp4", "audio/mpeg", "audio/wav", "audio/aac"],
                    copyToCacheDirectory: true,
                    multiple: false,
                  });

                  if (result.canceled || !result.assets?.[0]) {
                    return;
                  }

                  const uri = result.assets[0].uri;
                  await processAudio(uri);
                } catch (error) {
                  console.log("Failed to pick from Files:", error);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  Alert.alert("Oops!", "We couldn't access the Files app. Please try again.");
                }
              }
            },
            {
              text: "Media Library",
              onPress: async () => {
                try {
                  const { status } = await MediaLibrary.requestPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert(
                      "Permission Needed",
                      "Please allow access to your media library to import voice memos and audio files.",
                      [{ text: "OK" }]
                    );
                    return;
                  }

                  Alert.alert(
                    "Voice Memos Access",
                    "To access Voice Memos:\n\n1. Go to the Files app on your iPhone\n2. Tap 'Browse' at the bottom\n3. Find 'Voice Memos' in the list\n4. Select your recording\n5. Tap the Share button\n6. Choose 'Save to Files'\n7. Then use 'Files App' option here to select it\n\nNote: Voice Memos are protected by iOS and can't be accessed directly by third-party apps. You'll need to export them to Files first.",
                    [{ text: "Got it" }]
                  );
                } catch (error) {
                  console.log("Failed to access media library:", error);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  Alert.alert("Oops!", "We couldn't access the media library. Please try again.");
                }
              }
            },
            {
              text: "Cancel",
              style: "cancel"
            }
          ]
        );
      } else {
        // Android: use document picker directly
        const result = await DocumentPicker.getDocumentAsync({
          type: ["audio/*", "audio/m4a", "audio/mp4", "audio/mpeg", "audio/wav", "audio/aac"],
          copyToCacheDirectory: true,
          multiple: false,
        });

        if (result.canceled || !result.assets?.[0]) {
          return;
        }

        const uri = result.assets[0].uri;
        await processAudio(uri);
      }
    } catch (error) {
      console.log("Failed to upload audio:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Oops!", "We couldn't upload the audio file. Please try again.");
    }
  };

  const processAudio = async (uri: string) => {
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

    // Create a placeholder note immediately so it shows in the home screen
    const placeholderNoteId = addNote({
      title: "Processing Audio...",
      content: "Your audio is being transcribed and analyzed",
      folderId: null,
      sourceType: "audio",
      isProcessing: true,
      processingProgress: 0,
      processingMessage: "Starting transcription...",
    });

    // Start background processing job
    const jobId = addJob(uri);

    // Show brief confirmation and navigate to home
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Processing Started",
      "Your audio is being transcribed in the background. You can see the progress in your notes!",
      [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("Home");
          }
        }
      ]
    );

    // Navigate to home immediately
    navigation.navigate("Home");

    // Process in background
    processAudioInBackground(uri, jobId, accessStatus, placeholderNoteId);
  };

  const processAudioInBackground = async (uri: string, jobId: string, accessStatus: any, placeholderNoteId: string) => {
    try {
      updateJobProgress(jobId, 5, 'Starting transcription...');
      useNotesStore.getState().updateNote(placeholderNoteId, { processingProgress: 5, processingMessage: 'Starting transcription...' });

      const transcript = await transcribeAudio(uri, (progress, message) => {
        updateJobProgress(jobId, progress, message);
        useNotesStore.getState().updateNote(placeholderNoteId, { processingProgress: progress, processingMessage: message });
      });

      // Check if transcript is empty or too short
      const trimmedTranscript = transcript?.trim() || "";
      const wordCount = trimmedTranscript.split(/\s+/).filter((word: string) => word.length > 0).length;

      if (trimmedTranscript.length < 10 || wordCount < 3) {
        failJob(jobId, "No speech detected in recording");
        useNotesStore.getState().updateNote(placeholderNoteId, {
          isProcessing: false,
          processingError: "No speech detected in recording",
        });
        return;
      }

      updateJobProgress(jobId, 40, 'Analyzing content...', 'generating');
      useNotesStore.getState().updateNote(placeholderNoteId, { processingProgress: 40, processingMessage: 'Analyzing content...' });

      updateJobProgress(jobId, 50, 'Generating summary...');
      useNotesStore.getState().updateNote(placeholderNoteId, { processingProgress: 50, processingMessage: 'Generating summary...' });

      const aiContent = await generateNoteContent(transcript, "audio");

      updateJobProgress(jobId, 70, 'Creating flashcards...');
      useNotesStore.getState().updateNote(placeholderNoteId, { processingProgress: 70, processingMessage: 'Creating flashcards...' });

      updateJobProgress(jobId, 85, 'Generating quiz...');
      useNotesStore.getState().updateNote(placeholderNoteId, { processingProgress: 85, processingMessage: 'Generating quiz...' });

      updateJobProgress(jobId, 95, 'Finalizing note...');
      useNotesStore.getState().updateNote(placeholderNoteId, { processingProgress: 95, processingMessage: 'Finalizing note...' });

      // Update the placeholder note with the final content
      useNotesStore.getState().updateNote(placeholderNoteId, {
        title: aiContent.title,
        content: aiContent.fullContent,
        summary: aiContent.summary,
        keyPoints: aiContent.keyPoints,
        quiz: aiContent.quiz,
        flashcards: aiContent.flashcards,
        transcript: aiContent.transcript,
        podcast: aiContent.podcast,
        table: aiContent.table,
        isProcessing: false,
        processingProgress: 100,
        processingMessage: 'Complete!',
      });

      // Consume credit if no subscription
      const consumeResult = await consumeNoteAccess();
      if (!consumeResult.success && !accessStatus.hasSubscription) {
        console.warn('[AudioRecorder] Failed to consume credit:', consumeResult.error);
      }

      // Award XP for creating note from audio
      addXP(20);
      console.log('[AudioRecorder] Note created! +20 XP awarded');

      completeJob(jobId, placeholderNoteId);

      // Show success notification
      setTimeout(() => {
        let message = "Your note has been created from the audio. +20 XP earned!";
        if (!accessStatus.hasSubscription && consumeResult.remainingCredits !== undefined) {
          message += `\n\nCredits remaining: ${consumeResult.remainingCredits}`;
        }
        Alert.alert("Success!", message);
      }, 500);

    } catch (error: any) {
      console.log("Failed to process audio:", error);
      const errorMessage = error?.message || "We couldn't process the audio. Please try again.";
      failJob(jobId, errorMessage);

      // Update placeholder note with error
      useNotesStore.getState().updateNote(placeholderNoteId, {
        isProcessing: false,
        processingError: errorMessage,
      });

      // Show error notification
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        if (errorMessage.includes('too long') || errorMessage.includes('Maximum length') || errorMessage.includes('Whisper has a limit')) {
          Alert.alert("Audio Duration Limit", errorMessage);
        } else {
          Alert.alert("Oops!", errorMessage);
        }
      }, 500);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
            <View className="w-40 h-40 rounded-full border-8 items-center justify-center" style={{ borderColor: 'rgba(125, 211, 252, 0.2)' }}>
              <Animated.View
                className="w-40 h-40 rounded-full border-8 absolute"
                style={{
                  borderTopColor: '#7DD3FC',
                  borderRightColor: progressPercentage >= 25 ? '#7DD3FC' : 'rgba(125, 211, 252, 0.2)',
                  borderBottomColor: progressPercentage >= 50 ? '#7DD3FC' : 'rgba(125, 211, 252, 0.2)',
                  borderLeftColor: progressPercentage >= 75 ? '#7DD3FC' : 'rgba(125, 211, 252, 0.2)',
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

      {/* Header */}
      <View className="px-5" style={{ paddingTop: insets.top + 16, paddingBottom: 16 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
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
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#7DD3FC" />
            </Pressable>
            <View className="flex-row items-center">
              <Image
                source={require('../assets/images/mascot.png')}
                style={{
                  width: 44,
                  height: 44,
                  marginRight: 10,
                }}
                resizeMode="contain"
              />
              <Text className="text-3xl font-bold text-[#1e293b]">
                NoteBoost
              </Text>
            </View>
          </View>

          {/* Empty view for layout balance */}
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Recording Section */}
      <View className="flex-1 items-center justify-center px-6">
        {isRecording ? (
          <View className="items-center">
            {/* Animated Recording Indicator with Waves */}
            <View className="items-center justify-center mb-8" style={{ width: 240, height: 240 }}>
              {/* Outermost Wave */}
              <Animated.View
                className="absolute w-60 h-60 rounded-full"
                style={{
                  backgroundColor: isPaused ? '#F59E0B' : '#EF4444',
                  opacity: waveOpacity3,
                  transform: [{ scale: waveAnim3 }],
                }}
              />

              {/* Middle Wave */}
              <Animated.View
                className="absolute w-60 h-60 rounded-full"
                style={{
                  backgroundColor: isPaused ? '#F59E0B' : '#EF4444',
                  opacity: waveOpacity2,
                  transform: [{ scale: waveAnim2 }],
                }}
              />

              {/* Inner Wave */}
              <Animated.View
                className="absolute w-60 h-60 rounded-full"
                style={{
                  backgroundColor: isPaused ? '#F59E0B' : '#EF4444',
                  opacity: waveOpacity1,
                  transform: [{ scale: waveAnim1 }],
                }}
              />

              {/* Pulsing Center Circle */}
              <Animated.View
                className="w-40 h-40 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isPaused ? 'rgba(251, 191, 36, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  transform: [{ scale: recordingPulse }],
                }}
              >
                <View
                  className="w-32 h-32 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isPaused ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <View
                    className="w-24 h-24 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isPaused ? '#F59E0B' : '#EF4444',
                      shadowColor: isPaused ? '#F59E0B' : '#EF4444',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.4,
                      shadowRadius: 16,
                      elevation: 8,
                    }}
                  >
                    <Ionicons name={isPaused ? "pause" : "mic"} size={48} color="white" />
                  </View>
                </View>
              </Animated.View>
            </View>

            <Text className="text-[#1e293b] text-5xl font-bold mb-2">
              {formatDuration(recordingDuration)}
            </Text>
            <Text className={`${isPaused ? 'text-[#F59E0B]' : 'text-[#64748b]'} text-lg mb-8 font-semibold`}>
              {isPaused ? 'Paused' : 'Recording...'}
            </Text>

            <View className="flex-row gap-3 mb-4">
              {/* Discard Button */}
              <Pressable
                onPress={discardRecording}
                className="w-16 h-16 rounded-full items-center justify-center active:opacity-80"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  borderWidth: 2,
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  shadowColor: "#EF4444",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Ionicons name="trash-outline" size={28} color="#EF4444" />
              </Pressable>

              {/* Pause/Resume Button */}
              <Pressable
                onPress={isPaused ? resumeRecording : pauseRecording}
                className="w-16 h-16 rounded-full items-center justify-center active:opacity-80"
                style={{
                  backgroundColor: isPaused ? '#F59E0B' : 'rgba(255, 255, 255, 0.7)',
                  borderWidth: 1,
                  borderColor: isPaused ? '#F59E0B' : 'rgba(125, 211, 252, 0.3)',
                  shadowColor: isPaused ? "#F59E0B" : "#7DD3FC",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Ionicons name={isPaused ? "play" : "pause"} size={32} color={isPaused ? "white" : "#1e293b"} />
              </Pressable>

              {/* Stop Button */}
              <Pressable
                onPress={stopRecording}
                className="px-8 h-16 rounded-full items-center justify-center active:opacity-90"
                style={{
                  backgroundColor: '#38BDF8',
                  shadowColor: "#38BDF8",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Done
                  </Text>
                </View>
              </Pressable>
            </View>

            {recordingDuration < MINIMUM_RECORDING_DURATION && (
              <Text className="text-[#F59E0B] text-sm text-center mt-2 font-medium">
                Record for at least {MINIMUM_RECORDING_DURATION} seconds
              </Text>
            )}
          </View>
        ) : (
          <View className="items-center w-full">
            <View
              className="w-32 h-32 rounded-full items-center justify-center mb-8"
              style={{
                backgroundColor: 'rgba(125, 211, 252, 0.15)',
                borderWidth: 2,
                borderColor: '#7DD3FC',
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <Ionicons name="mic" size={64} color="#7DD3FC" />
            </View>
            <Text className="text-[#64748b] text-center text-lg mb-12 px-6">
              Record a voice note or select an audio file (including Voice Memos) to generate AI-powered notes
            </Text>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                startRecording();
              }}
              style={({ pressed }) => ({
                width: '100%',
                maxWidth: 340,
                borderRadius: 28,
                marginBottom: 16,
                shadowColor: '#38BDF8',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: pressed ? 0.2 : 0.3,
                shadowRadius: 20,
                elevation: pressed ? 8 : 12,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <View
                style={{
                  backgroundColor: '#38BDF8',
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
                    <Ionicons name="mic" size={20} color="white" />
                  </View>
                  <Text style={{
                    color: 'white',
                    fontWeight: '700',
                    fontSize: 19,
                    letterSpacing: 0.5,
                  }}>
                    Start Recording
                  </Text>
                </View>
              </View>
            </Pressable>

            <View className="flex-row items-center my-6 w-full max-w-xs">
              <View className="flex-1 h-px" style={{ backgroundColor: 'rgba(100, 116, 139, 0.3)' }} />
              <Text className="text-[#94A3B8] mx-4 font-medium">OR</Text>
              <View className="flex-1 h-px" style={{ backgroundColor: 'rgba(100, 116, 139, 0.3)' }} />
            </View>

            <Pressable
              onPress={handleUploadAudio}
              style={({ pressed }) => ({
                width: '100%',
                maxWidth: 340,
                borderRadius: 28,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 2,
                borderColor: 'rgba(125, 211, 252, 0.4)',
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: pressed ? 0.1 : 0.15,
                shadowRadius: 16,
                elevation: pressed ? 4 : 6,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                paddingVertical: 22,
                paddingHorizontal: 32,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(125, 211, 252, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="cloud-upload-outline" size={20} color="#38BDF8" />
                </View>
                <Text style={{
                  color: '#1e293b',
                  fontWeight: '700',
                  fontSize: 19,
                  letterSpacing: 0.5,
                }}>
                  Select Audio File
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
