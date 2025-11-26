import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useNotesStore } from "../state/notesStore";
import { Camera, Image as ImageIcon, X, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import OpenAI from "openai";

type ScreenshotOCRScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ScreenshotOCR">;
};

export default function ScreenshotOCRScreen({
  navigation,
}: ScreenshotOCRScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const addNote = useNotesStore((state) => state.addNote);
  const updateNote = useNotesStore((state) => state.updateNote);

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted" || libraryStatus !== "granted") {
      Alert.alert(
        "Permissions Required",
        "Please grant camera and photo library permissions to use this feature."
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const extractTextFromImage = async (imageUri: string): Promise<string> => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error(
          "OpenAI API key not configured. Please add it in the ENV tab."
        );
      }

      const openai = new OpenAI({
        apiKey: apiKey,
      });

      // Read image as base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String);
        };
        reader.readAsDataURL(blob);
      });

      // Use GPT-4 Vision to extract text and understand content
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this image. If it contains handwritten notes, typed text, whiteboard content, textbook pages, or any other text, transcribe it accurately. Also identify any diagrams, equations, or important visual elements and describe them. Format the output in a clear, organized way.",
              },
              {
                type: "image_url",
                image_url: {
                  url: base64,
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
      });

      return (
        completion.choices[0]?.message?.content ||
        "No text could be extracted from the image."
      );
    } catch (error: any) {
      console.error("Error extracting text:", error);
      throw error;
    }
  };

  const generateAIContent = async (extractedText: string) => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error(
          "OpenAI API key not configured. Please add it in the ENV tab."
        );
      }

      const openai = new OpenAI({
        apiKey: apiKey,
      });

      // Generate title
      const titleCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Generate a short, descriptive title (3-6 words) for the following content extracted from an image.",
          },
          {
            role: "user",
            content: extractedText.substring(0, 500),
          },
        ],
        max_tokens: 20,
        temperature: 0.7,
      });

      const title =
        titleCompletion.choices[0]?.message?.content || "Screenshot Note";

      // Generate summary and key points
      const summaryCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              'You are a study assistant. Given text extracted from an image, provide: 1) A concise summary, 2) Key points as a JSON array. Format: {"summary": "...", "keyPoints": ["...", "..."]}',
          },
          {
            role: "user",
            content: extractedText,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const aiContent = JSON.parse(
        summaryCompletion.choices[0]?.message?.content || "{}"
      );

      return {
        title: title.replace(/["']/g, "").trim(),
        summary: aiContent.summary || "",
        keyPoints: aiContent.keyPoints || [],
      };
    } catch (error: any) {
      console.error("Error generating AI content:", error);
      return {
        title: "Screenshot Note",
        summary: "",
        keyPoints: [],
      };
    }
  };

  const handleProcessImage = async () => {
    if (!selectedImage) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);

    try {
      // Extract text from image
      const extractedText = await extractTextFromImage(selectedImage);

      // Generate AI content
      const aiContent = await generateAIContent(extractedText);

      // Create note
      const noteId = addNote({
        title: aiContent.title,
        content: extractedText,
        folderId: null,
        sourceType: "screenshot",
        sourceImageUri: selectedImage,
        summary: aiContent.summary,
        keyPoints: aiContent.keyPoints,
        isProcessing: false,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert("Success!", "Your screenshot has been converted to a note.", [
        {
          text: "View Note",
          onPress: () => {
            navigation.navigate("NoteEditor", { noteId });
          },
        },
      ]);
    } catch (error: any) {
      console.error("Error processing image:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        "Processing Failed",
        error.message?.includes("API key")
          ? "Please configure your OpenAI API key in the ENV tab."
          : "Failed to process the image. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
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
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 16,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255, 255, 255, 0.4)",
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              className="active:opacity-70 mr-3"
            >
              <X size={28} color="#0ea5e9" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-gray-900 text-2xl font-bold">
                Screenshot OCR
              </Text>
              <Text className="text-gray-600 text-sm">
                Convert images to notes
              </Text>
            </View>
          </View>
          <ImageIcon size={28} color="#0ea5e9" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {!selectedImage ? (
          <View className="flex-1 items-center justify-center">
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 32,
                borderWidth: 3,
                borderColor: "rgba(14, 165, 233, 0.3)",
                borderStyle: "dashed",
              }}
            >
              <ImageIcon size={60} color="#0ea5e9" />
            </View>

            <Text className="text-gray-900 text-2xl font-bold text-center mb-3">
              Capture or Upload
            </Text>
            <Text className="text-gray-600 text-base text-center mb-8 leading-6 px-8">
              Take a photo or select an image to extract text from whiteboards,
              textbooks, handwritten notes, and more
            </Text>

            {/* Buttons */}
            <View className="w-full px-4">
              <Pressable
                onPress={handleTakePhoto}
                className="active:opacity-70 mb-4"
              >
                <LinearGradient
                  colors={["#0ea5e9", "#06b6d4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingHorizontal: 32,
                    paddingVertical: 18,
                    borderRadius: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Camera size={24} color="white" />
                  <Text className="text-white text-lg font-bold ml-3">
                    Take Photo
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={handlePickImage}
                className="active:opacity-70"
              >
                <View
                  style={{
                    paddingHorizontal: 32,
                    paddingVertical: 18,
                    borderRadius: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderWidth: 2,
                    borderColor: "rgba(14, 165, 233, 0.5)",
                  }}
                >
                  <ImageIcon size={24} color="#0ea5e9" />
                  <Text className="text-[#0ea5e9] text-lg font-bold ml-3">
                    Choose from Library
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="flex-1">
            {/* Image Preview */}
            <View
              style={{
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.4)",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 5,
                marginBottom: 24,
              }}
            >
              <Image
                source={{ uri: selectedImage }}
                style={{
                  width: "100%",
                  height: 400,
                }}
                resizeMode="contain"
              />
            </View>

            <Text className="text-gray-900 text-lg font-bold mb-4 text-center">
              Ready to extract text from this image?
            </Text>

            {/* Action Buttons */}
            <Pressable
              onPress={handleProcessImage}
              disabled={isProcessing}
              className="active:opacity-70 mb-3"
            >
              <LinearGradient
                colors={
                  isProcessing
                    ? ["#cbd5e1", "#94a3b8"]
                    : ["#0ea5e9", "#06b6d4"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingHorizontal: 32,
                  paddingVertical: 18,
                  borderRadius: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isProcessing ? (
                  <>
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white text-lg font-bold ml-3">
                      Processing...
                    </Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={24} color="white" />
                    <Text className="text-white text-lg font-bold ml-3">
                      Extract Text & Create Note
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedImage(null);
              }}
              disabled={isProcessing}
              className="active:opacity-70"
            >
              <View
                style={{
                  paddingHorizontal: 32,
                  paddingVertical: 18,
                  borderRadius: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderWidth: 2,
                  borderColor: "rgba(148, 163, 184, 0.5)",
                }}
              >
                <X size={24} color="#64748b" />
                <Text className="text-gray-600 text-lg font-bold ml-3">
                  Choose Different Image
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
