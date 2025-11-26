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
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useNotesStore } from "../state/notesStore";
import { useGamificationStore } from "../state/gamificationStore";
import { generateNoteContent, GeneratedNoteContent } from "../api/ai-content-generator";
import { scrapeWebPage } from "../utils/webScraper";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";

type LinkInputScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "LinkInput">;
};

export default function LinkInputScreen({
  navigation,
}: LinkInputScreenProps) {
  const insets = useSafeAreaInsets();
  const { addNote } = useNotesStore();
  const { addXP } = useGamificationStore();

  const [url, setUrl] = useState("");
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
        setUrl(clipboardText);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert("Empty Clipboard", "Your clipboard is empty. Copy a URL first.");
      }
    } catch (error) {
      console.log("Failed to paste from clipboard:", error instanceof Error ? error.message : String(error));
      Alert.alert("Error", "Failed to paste from clipboard");
    }
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleExtractContent = async () => {
    if (!url.trim()) {
      Alert.alert("No URL", "Please paste or type a URL first.");
      return;
    }

    if (!isValidUrl(url.trim())) {
      Alert.alert("Invalid URL", "Please enter a valid web URL (starting with http:// or https://).");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsProcessing(true);
      setProgressPercentage(0);
      setProcessingMessage("Fetching web page...");

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgressPercentage((prev) => {
          if (prev >= 40) return 40;
          return prev + 10;
        });
      }, 300);

      // Actually scrape the web page content
      const scrapedContent = await scrapeWebPage(url.trim());

      setProgressPercentage(50);
      setProcessingMessage("Analyzing content...");

      // Clear the progress interval
      clearInterval(progressInterval);

      // Generate AI content from the scraped text
      const generatedContent: GeneratedNoteContent = await generateNoteContent(
        scrapedContent.content,
        "document"
      );

      setProgressPercentage(100);
      setProcessingMessage("Creating your note...");

      // Add note to store with the actual scraped content
      addNote({
        title: scrapedContent.title || generatedContent.title || `Web: ${url.substring(0, 50)}...`,
        content: generatedContent.fullContent,
        summary: generatedContent.summary,
        keyPoints: generatedContent.keyPoints,
        quiz: generatedContent.quiz,
        flashcards: generatedContent.flashcards,
        transcript: `Source: ${scrapedContent.url}\n\n${scrapedContent.content}`,
        podcast: generatedContent.podcast,
        sourceType: "document" as const,
        table: generatedContent.table,
        folderId: null,
      });

      // Add XP for creating a note
      addXP(50);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to home
      setTimeout(() => {
        setIsProcessing(false);
        navigation.navigate("Home");
        Alert.alert("Success!", "Your note has been created from the web link! +50 XP earned!");
      }, 500);
    } catch (error) {
      console.log("Failed to extract content:", error instanceof Error ? error.message : String(error));
      setIsProcessing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Provide user-friendly error messages
      let errorMessage = "We couldn't extract content from this URL. ";
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage += "Please check your internet connection and try again.";
        } else if (error.message.includes('protected') || error.message.includes('JavaScript')) {
          errorMessage += "This website requires special access or JavaScript. Try copying the text manually and using the 'Paste Text' option instead.";
        } else if (error.message.includes('CORS') || error.message.includes('blocked')) {
          errorMessage += "This website blocks automated access. Try copying the text manually and using the 'Paste Text' option instead.";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "Please try again or use the 'Paste Text' option to copy content manually.";
      }

      Alert.alert("Extraction Failed", errorMessage);
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
              <Ionicons name="globe" size={64} color="#7DD3FC" />
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
            AI is extracting content from the web page and creating a comprehensive note
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
            <Text className="text-xl font-bold text-[#1e293b]">Insert Link</Text>
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
              <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                <Ionicons name="information-circle" size={28} color="#f59e0b" />
              </View>
              <Text className="text-lg font-bold text-[#1e293b] flex-1">
                How It Works
              </Text>
            </View>
            <Text className="text-[#64748b] text-base leading-6">
              Paste any web page URL - blog posts, articles, tutorials, or documentation. Our AI will extract the content and create an organized note with key insights and summaries.
            </Text>
          </View>

          {/* Paste Button */}
          <Pressable
            onPress={handlePasteFromClipboard}
            className="mb-6 active:opacity-80"
          >
            <LinearGradient
              colors={["#f59e0b", "#d97706"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 24,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#f59e0b",
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

          {/* URL Input */}
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
            }}
          >
            <View className="flex-row items-center px-5 py-4">
              <Ionicons name="link-outline" size={24} color="#7DD3FC" style={{ marginRight: 12 }} />
              <TextInput
                className="flex-1 text-base text-[#1e293b]"
                placeholder="https://example.com/article"
                placeholderTextColor="#94A3B8"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
          </View>

          {/* URL Validation Indicator */}
          {url.length > 0 && (
            <View className="flex-row items-center justify-center mb-6">
              <Ionicons
                name={isValidUrl(url.trim()) ? "checkmark-circle" : "alert-circle"}
                size={20}
                color={isValidUrl(url.trim()) ? "#10b981" : "#ef4444"}
              />
              <Text
                className="ml-2 text-sm"
                style={{ color: isValidUrl(url.trim()) ? "#10b981" : "#ef4444" }}
              >
                {isValidUrl(url.trim()) ? "Valid URL" : "Invalid URL format"}
              </Text>
            </View>
          )}

          {/* Extract Button */}
          <Pressable
            onPress={handleExtractContent}
            disabled={!url.trim() || !isValidUrl(url.trim())}
            className="active:opacity-80"
          >
            <LinearGradient
              colors={
                url.trim() && isValidUrl(url.trim())
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
                shadowColor: url.trim() && isValidUrl(url.trim()) ? "#7DD3FC" : "#94A3B8",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Ionicons name="sparkles" size={24} color="white" />
              <Text className="text-white text-lg font-bold ml-3">
                Extract Content
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Example URLs */}
          <View className="mt-8">
            <Text className="text-sm font-semibold text-[#64748b] mb-3 text-center">
              Try with these examples:
            </Text>
            <View className="space-y-2">
              {[
                "https://en.wikipedia.org/wiki/Artificial_intelligence",
                "https://www.bbc.com/news",
                "https://medium.com/@example/article",
              ].map((exampleUrl, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setUrl(exampleUrl);
                  }}
                  className="px-4 py-3 rounded-2xl active:opacity-70"
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(245, 158, 11, 0.2)',
                    marginBottom: 8,
                  }}
                >
                  <Text className="text-sm text-[#1e293b]" numberOfLines={1}>
                    {exampleUrl}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
