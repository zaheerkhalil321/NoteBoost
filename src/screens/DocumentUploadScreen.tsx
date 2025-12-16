import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { EncodingType } from "expo-file-system";
import { useNotesStore } from "../state/notesStore";
import { useGamificationStore } from "../state/gamificationStore";
import { generateNoteContent, GeneratedNoteContent } from "../api/ai-content-generator";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { checkNoteAccess, consumeNoteAccess } from "../services/noteAccessService";

type DocumentUploadScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "DocumentUpload">;
};

export default function DocumentUploadScreen({ navigation }: DocumentUploadScreenProps) {
  const insets = useSafeAreaInsets();
  const { addNote } = useNotesStore();
  const { addXP } = useGamificationStore();

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
    outputRange: ["0deg", "360deg"],
  });

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/*",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const uri = result.assets[0].uri;
      const mimeType = result.assets[0].mimeType;

      await processDocument(uri, mimeType || "");
    } catch (error) {
      console.error("Failed to upload document:", error);
      Alert.alert("Error", "Failed to upload document");
    }
  };

  const processDocument = async (uri: string, mimeType: string) => {
    const accessStatus = await checkNoteAccess();
    // if (!accessStatus.canCreate) {
    //   // ... show alert
    //   return;
    // }

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      setIsProcessing(true);
      setProgressPercentage(0);
      setProcessingMessage("Reading document...");

      progressInterval = setInterval(() => {
        setProgressPercentage((prev) => (prev < 90 ? prev + 1 : prev));
      }, 200);

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setProcessingMessage("Generating AI notes...");

      let aiContent;

      if (mimeType === "text/plain") {
        // For TXT files
        const text = atob(base64);
        if (!text || text.trim().length === 0) {
          throw new Error("Document is empty");
        }
        aiContent = await generateNoteContent(text, "document");
      } else {
        // For PDF/DOCX - first extract text, then use generateNoteContent
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Extract all the text content from this ${
                      mimeType.includes("pdf") ? "PDF" : "Word"
                    } document. Return ONLY the plain text content, no explanations, no formatting, just the raw text as it appears in the document.`,
                  },
                  {
                    type: "file",
                    file: {
                      filename: mimeType.includes("pdf") ? "document.pdf" : "document.docx",
                      file_data: `data:${mimeType};base64,${base64}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 4000,
            temperature: 0.1,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("OpenAI Error:", errorData);
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("🚀 ~ processDocument ~ data:", data)
        const extractedText = data.choices[0].message.content.trim();

        if (!extractedText || extractedText.length === 0) {
          throw new Error("Could not extract text from document");
        }

        // Now use the same generateNoteContent function as text files
        aiContent = await generateNoteContent(extractedText, "document");
      }

      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      setProgressPercentage(100);
      setProcessingMessage("Creating your note...");

      addNote({
        title: aiContent.title,
        content: aiContent.fullContent,
        folderId: null,
        sourceType: "document",
        summary: aiContent.summary,
        keyPoints: aiContent.keyPoints,
        quiz: aiContent.quiz,
        flashcards: aiContent.flashcards,
        transcript: aiContent.transcript,
        podcast: aiContent.podcast,
        table: aiContent.table,
      });

      await consumeNoteAccess();
      addXP(20);

      setIsProcessing(false);
      navigation.navigate("Home");
      Alert.alert("Success", "Note created! +20 XP earned!");
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      console.error("Document processing error:", error);
      setIsProcessing(false);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to process document");
    }
  };

  if (isProcessing) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        {/* Background gradient */}
        <LinearGradient
          colors={["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]}
          locations={[0, 0.4, 0.7, 1]}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        />

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          {/* Circular Progress with glassmorphic container */}
          <Animated.View
            style={{
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
              backgroundColor: "rgba(255, 255, 255, 0.4)",
              borderRadius: 120,
              padding: 32,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 8,
              transform: [{ scale: pulseAnim }],
            }}
          >
            <View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                borderWidth: 8,
                borderColor: "rgba(100, 116, 139, 0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Animated.View
                style={{
                  position: "absolute",
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  borderWidth: 8,
                  borderTopColor: "#3B82F6",
                  borderRightColor: progressPercentage >= 25 ? "#3B82F6" : "rgba(100, 116, 139, 0.2)",
                  borderBottomColor: progressPercentage >= 50 ? "#3B82F6" : "rgba(100, 116, 139, 0.2)",
                  borderLeftColor: progressPercentage >= 75 ? "#3B82F6" : "rgba(100, 116, 139, 0.2)",
                  transform: [{ rotate: spin }],
                }}
              />
              <Text style={{ color: "#1e293b", fontSize: 36, fontWeight: "bold", zIndex: 10 }}>
                {progressPercentage}%
              </Text>
            </View>
          </Animated.View>

          <Text
            style={{
              color: "#1e293b",
              fontSize: 24,
              fontWeight: "600",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {processingMessage}
          </Text>
          <Text
            style={{
              color: "#64748b",
              textAlign: "center",
              fontSize: 16,
              paddingHorizontal: 32,
            }}
          >
            This may take a moment. Please don't close the app.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Background gradient */}
      <LinearGradient
        colors={["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]}
        locations={[0, 0.4, 0.7, 1]}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />

      {/* Header with glassmorphic back button */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 24,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            justifyContent: "center",
            alignItems: "center",
            opacity: pressed ? 0.6 : 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          })}
        >
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </Pressable>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#1e293b",
            marginLeft: 16,
          }}
        >
          Upload Document
        </Text>
      </View>

      {/* Upload Section */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <View style={{ alignItems: "center", width: "100%" }}>
          {/* Glassmorphic document icon container */}
          <View
            style={{
              width: 180,
              height: 180,
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              borderRadius: 90,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 32,
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 8,
              borderWidth: 2,
              borderColor: "rgba(255, 255, 255, 0.8)",
            }}
          >
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: "rgba(59, 130, 246, 0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="document-text" size={72} color="#3B82F6" />
            </View>
          </View>

          <Text
            style={{
              color: "#1e293b",
              textAlign: "center",
              fontSize: 20,
              fontWeight: "600",
              marginBottom: 12,
              paddingHorizontal: 24,
            }}
          >
            Upload a document to generate AI-powered notes
          </Text>

          <Text
            style={{
              color: "#64748b",
              textAlign: "center",
              fontSize: 15,
              marginBottom: 12,
              paddingHorizontal: 24,
            }}
          >
            Supported: .TXT files{"\n"}
          </Text>

          <Text
            style={{
              color: "#94a3b8",
              textAlign: "center",
              fontSize: 13,
              marginBottom: 48,
              paddingHorizontal: 32,
              lineHeight: 20,
            }}
          >
            For PDFs and other formats, copy the text and paste it in the Record Audio screen using the paste icon
          </Text>

          {/* Beautifully designed gradient button */}
          <Pressable
            onPress={handleUploadDocument}
            style={({ pressed }) => ({
              width: "100%",
              maxWidth: 340,
              borderRadius: 28,
              overflow: "hidden",
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: pressed ? 0.25 : 0.35,
              shadowRadius: 20,
              elevation: pressed ? 8 : 12,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <LinearGradient
              colors={["#60A5FA", "#3B82F6", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 22,
                paddingHorizontal: 32,
                alignItems: "center",
                borderRadius: 28,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="cloud-upload-outline" size={20} color="white" />
                </View>
                <Text
                  style={{
                    color: "white",
                    fontWeight: "700",
                    fontSize: 19,
                    letterSpacing: 0.5,
                  }}
                >
                  Choose Document
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
