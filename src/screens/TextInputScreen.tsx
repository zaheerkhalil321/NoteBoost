import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useNotesStore } from "../state/notesStore";
import { useGamificationStore } from "../state/gamificationStore";
import { generateNoteContent, GeneratedNoteContent } from "../api/ai-content-generator";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { checkNoteAccess, consumeNoteAccess } from "../services/noteAccessService";

type TextInputScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TextInput">;
};

export default function TextInputScreen({
  navigation,
}: TextInputScreenProps) {
  const insets = useSafeAreaInsets();
  const { addNote } = useNotesStore();
  const { addXP } = useGamificationStore();

  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Animation refs
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start rotation animation when processing
  useEffect(() => {
    if (isProcessing) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

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

  const handlePasteFromClipboard = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const clipboardText = await Clipboard.getStringAsync();
      if (clipboardText) {
        setText(clipboardText);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Empty Clipboard", "Your clipboard is empty. Copy some text first.");
      }
    } catch (error) {
      console.error("Failed to paste from clipboard:", error);
      Alert.alert("Error", "Failed to paste from clipboard");
    }
  };

  const handleGenerateNote = async () => {
    if (!text.trim()) {
      Alert.alert("No Text", "Please paste or type some text first.");
      return;
    }

    if (text.trim().length < 50) {
      Alert.alert("Text Too Short", "Please provide at least 50 characters of text for better results.");
      return;
    }

    // Check if user has access (subscription or credits)
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

      // Create placeholder note immediately with processing state
      const noteId = addNote({
        title: "Processing...",
        content: "",
        summary: undefined,
        keyPoints: undefined,
        quiz: undefined,
        flashcards: undefined,
        transcript: text,
        podcast: undefined,
        sourceType: "document" as const,
        table: undefined,
        folderId: null,
        isProcessing: true,
        processingProgress: 10,
        processingMessage: "Starting...",
      });

      // Navigate to home immediately so user can interact with other notes
      navigation.navigate("Home");

      // Process in background
      (async () => {
        try {
          // Generate content from text
          const generatedContent: GeneratedNoteContent = await generateNoteContent(
            text,
            "document"
          );

          // Update note with generated content
          useNotesStore.getState().updateNote(noteId, {
            title: generatedContent.title,
            content: generatedContent.fullContent,
            summary: generatedContent.summary,
            keyPoints: generatedContent.keyPoints,
            quiz: generatedContent.quiz,
            flashcards: generatedContent.flashcards,
            transcript: text,
            podcast: generatedContent.podcast,
            sourceType: "document" as const,
            table: generatedContent.table,
            isProcessing: false,
            processingProgress: 100,
          });

          // Consume credit if no subscription
          const consumeResult = await consumeNoteAccess();
          if (!consumeResult.success && !accessStatus.hasSubscription) {
            console.warn('[TextInput] Failed to consume credit:', consumeResult.error);
          }

          // Add XP for creating a note
          addXP(50);

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          console.error("Failed to generate note:", error);
          // Update note with error state
          useNotesStore.getState().updateNote(noteId, {
            processingError: "Failed to generate content. Please try again.",
            isProcessing: false,
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      })();

      // Show success message
      Alert.alert("Note Created!", "Your note is being generated in the background. You can view other notes while it's processing.");
    } catch (error) {
      console.error("Failed to create note:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Oops!",
        "We couldn't create your note. Please check your internet connection and try again."
      );
    }
  };

  if (isProcessing) {
    return (
      <View className="flex-1 bg-white">
        <LinearGradient
          colors={["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]}
          locations={[0, 0.4, 0.7, 1]}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        />
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View
            style={{
              transform: [{ rotate: spin }, { scale: pulseAnim }],
              marginBottom: 32,
            }}
          >
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#7DD3FC',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Ionicons name="sparkles" size={64} color="#7DD3FC" />
            </View>
          </Animated.View>

          <Text className="text-3xl font-bold text-[#1e293b] mb-4 text-center">
            {processingMessage}
          </Text>

          <View className="w-64 h-2 bg-[#E0F2FE] rounded-full overflow-hidden mb-3">
            <Animated.View
              className="h-full bg-[#7DD3FC] rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </View>

          <Text className="text-base text-[#64748b] text-center leading-6">
            AI is analyzing your text and creating a comprehensive note with key insights
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={0}
    >
      <View className="flex-1 bg-white">
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
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingBottom: 16,
            paddingHorizontal: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255, 255, 255, 0.9)',
            shadowColor: "#7DD3FC",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              className="w-10 h-10 rounded-full items-center justify-center active:bg-[#E0F2FE]"
            >
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </Pressable>
            <Text className="text-xl font-bold text-[#1e293b]">Paste Text</Text>
            <View className="w-10" />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Instructions */}
          <View
            className="mb-6 p-5 rounded-3xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.8)',
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center mb-3">
              <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(125, 211, 252, 0.2)' }}>
                <Ionicons name="information-circle" size={28} color="#7DD3FC" />
              </View>
              <Text className="text-lg font-bold text-[#1e293b] flex-1">
                How It Works
              </Text>
            </View>
            <Text className="text-[#64748b] text-base leading-6">
              Paste any text content - articles, lecture notes, research papers, or study materials. Our AI will analyze it and create an organized note with key insights, summaries, and study aids.
            </Text>
          </View>

          {/* Paste Button */}
          <Pressable
            onPress={handlePasteFromClipboard}
            className="mb-6 active:opacity-80"
          >
            <LinearGradient
              colors={["#10b981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 24,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#10b981",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Ionicons name="clipboard-outline" size={24} color="white" />
              <Text className="text-white text-lg font-bold ml-3">
                Paste from Clipboard
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Text Input */}
          <View
            className="mb-6 rounded-3xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.9)',
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 3,
              minHeight: 300,
            }}
          >
            <TextInput
              className="p-5 text-base text-[#1e293b]"
              placeholder="Or type or paste your text here..."
              placeholderTextColor="#94A3B8"
              value={text}
              onChangeText={setText}
              multiline
              textAlignVertical="top"
              style={{ minHeight: 300 }}
            />
          </View>

          {/* Character Count */}
          {text.length > 0 && (
            <Text className="text-sm text-[#64748b] text-center mb-6">
              {text.length} characters
            </Text>
          )}

          {/* Generate Button */}
          <Pressable
            onPress={handleGenerateNote}
            disabled={!text.trim() || text.trim().length < 50}
            className="active:opacity-80"
          >
            <LinearGradient
              colors={
                text.trim() && text.trim().length >= 50
                  ? ["#0ea5e9", "#06b6d4"]
                  : ["#CBD5E1", "#94A3B8"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 18,
                paddingHorizontal: 32,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: text.trim() && text.trim().length >= 50 ? "#7DD3FC" : "#94A3B8",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Ionicons name="sparkles" size={24} color="white" />
              <Text className="text-white text-lg font-bold ml-3">
                Generate Note
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
