import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
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

export default function DocumentUploadScreen({
  navigation,
}: DocumentUploadScreenProps) {
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
    outputRange: ['0deg', '360deg'],
  });

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/*", "application/pdf", "application/msword",
               "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
               "application/vnd.ms-powerpoint",
               "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
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
    // Check if user has access (subscription or credits) BEFORE processing
    const accessStatus = await checkNoteAccess();

    if (!accessStatus.canCreate) {
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

    let readingInterval: NodeJS.Timeout | null = null;
    let analysisInterval: NodeJS.Timeout | null = null;

    try {
      setIsProcessing(true);
      setProgressPercentage(0);
      setProcessingMessage("Reading document...");

      // Simulate smooth progress for reading
      readingInterval = setInterval(() => {
        setProgressPercentage(prev => Math.min(prev + 2, 20));
      }, 100);

      let text = "";

      // For plain text files, read directly
      if (mimeType.includes("text/plain")) {
        text = await FileSystem.readAsStringAsync(uri, {
          encoding: EncodingType.UTF8,
        });
        clearInterval(readingInterval);
        readingInterval = null;
        setProgressPercentage(25);
      } else if (mimeType.includes("application/pdf")) {
        // For PDFs, read as base64 and extract text
        setProcessingMessage("Extracting text from PDF...");
        try {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: EncodingType.Base64,
          });

          clearInterval(readingInterval);
          readingInterval = null;
          setProgressPercentage(25);

          // PDF text extraction with smart filtering
          const pdfText = atob(base64);

          // Extract text between parentheses (PDF text objects)
          const textMatches = pdfText.match(/\(([^)]+)\)/g) || [];
          console.log(`PDF: Found ${textMatches.length} text segments`);

          // First pass: Clean all text segments
          const cleanedSegments = textMatches.map(match => {
            // Remove parentheses
            let cleaned = match.slice(1, -1);

            // Replace PDF escape sequences
            cleaned = cleaned
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '')
              .replace(/\\t/g, ' ')
              .replace(/\\\(/g, '(')
              .replace(/\\\)/g, ')')
              .replace(/\\\\/g, '\\');

            return cleaned.trim();
          });

          // Second pass: Apply filtering
          const filteredSegments = cleanedSegments.filter(cleaned => {
            // Skip empty strings
            if (cleaned.length === 0) return false;

            // Skip very short strings (likely metadata)
            if (cleaned.length < 2) return false;

            // Skip strings that are just numbers
            if (/^[0-9\s]+$/.test(cleaned)) return false;

            // Skip common PDF technical keywords (exact matches only)
            const technicalKeywords = [
              'obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer',
              'startxref'
            ];
            if (technicalKeywords.includes(cleaned)) return false;

            return true;
          });

          text = filteredSegments.join(' ').replace(/\s+/g, ' ').trim();
          console.log(`PDF: After filtering, got ${text.length} characters`);

          // If we got very little text with strict filtering, try with looser filtering
          if (text.length < 100) {
            console.log('PDF: Strict filtering resulted in minimal text, trying looser filtering...');

            // Use all cleaned segments except empty ones
            text = cleanedSegments
              .filter(s => s.length > 0)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();

            console.log(`PDF: After looser filtering, got ${text.length} characters`);
          }

          // If still too little text, the PDF might be unsupported
          if (text.length < 50) {
            console.log('PDF: Still too little text, showing error');
            throw new Error("PDF appears to have minimal extractable text");
          }

          console.log('PDF: Extraction successful, proceeding with AI generation');
          setProgressPercentage(25);
        } catch (pdfError) {
          if (readingInterval) clearInterval(readingInterval);
          console.error("PDF extraction error:", pdfError);
          setIsProcessing(false);
          Alert.alert(
            "PDF Not Supported",
            "This PDF format isn't fully supported. For best results:\n\n1. Open the PDF in another app\n2. Select and copy the text\n3. Return to NoteBoost and use 'Record Audio' screen\n4. Tap the paste icon to create a note from text\n\nNote: Only simple text-based PDFs work. PDFs with images, tables, or complex formatting may not extract correctly.",
            [{ text: "Got it", onPress: () => navigation.goBack() }]
          );
          return;
        }
      } else {
        // For other document types, show a message
        if (readingInterval) clearInterval(readingInterval);
        setIsProcessing(false);
        Alert.alert(
          "Format Not Supported",
          "Currently only .txt files are fully supported.\n\nFor PDFs and other documents:\n\n1. Open the document in another app\n2. Select and copy the text\n3. Return to NoteBoost and use 'Record Audio' screen\n4. Tap the paste icon to create a note from your text",
          [
            {
              text: "Got it",
              onPress: () => navigation.goBack(),
            },
          ]
        );
        return;
      }

      if (!text || text.trim().length === 0) {
        throw new Error("Document appears to be empty");
      }

      console.log(`Extracted text length: ${text.length} characters`);

      // Truncate text if it's too long (max 100,000 chars ≈ 25,000 tokens conservatively)
      // Some PDFs have very poor token efficiency due to special chars or encoding
      const maxChars = 100000;
      if (text.length > maxChars) {
        console.log(`Text too long (${text.length} chars), truncating to ${maxChars}`);

        // Try to truncate at a paragraph break
        const truncated = text.substring(0, maxChars);
        const lastParagraph = truncated.lastIndexOf('\n\n');

        if (lastParagraph > maxChars * 0.8) {
          text = truncated.substring(0, lastParagraph) + '\n\n[Content truncated due to length. Only the first portion of the document was processed.]';
        } else {
          // Try to truncate at a sentence
          const lastSentence = Math.max(
            truncated.lastIndexOf('. '),
            truncated.lastIndexOf('! '),
            truncated.lastIndexOf('? ')
          );

          if (lastSentence > maxChars * 0.8) {
            text = truncated.substring(0, lastSentence + 1) + ' [Content truncated due to length. Only the first portion of the document was processed.]';
          } else {
            // Last resort: just cut at the limit
            text = truncated + '... [Content truncated due to length. Only the first portion of the document was processed.]';
          }
        }

        console.log(`Text truncated to ${text.length} characters`);
      }

      setProgressPercentage(30);
      setProcessingMessage("Analyzing content...");

      // Smooth progress during AI analysis (30% to 90%)
      analysisInterval = setInterval(() => {
        setProgressPercentage(prev => {
          if (prev < 90) {
            return prev + 1;
          }
          return prev;
        });
      }, 100);

      // Add timeout protection (2 minutes max for AI generation)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("AI generation timeout")), 120000);
      });

      const aiContent = await Promise.race([
        generateNoteContent(text, "document"),
        timeoutPromise
      ]) as GeneratedNoteContent;

      clearInterval(analysisInterval);
      analysisInterval = null;
      setProgressPercentage(95);
      setProcessingMessage("Creating your note...");

      // Small delay to show final message
      await new Promise(resolve => setTimeout(resolve, 300));

      setProgressPercentage(100);

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

      // Consume credit if no subscription
      const consumeResult = await consumeNoteAccess();
      if (!consumeResult.success && !accessStatus.hasSubscription) {
        console.warn('[Document] Failed to consume credit:', consumeResult.error);
      }

      // Award XP for creating note from document
      addXP(20);
      console.log('[Document] Note created! +20 XP awarded');

      setIsProcessing(false);
      navigation.navigate("Home");

      let message = "Note created from document! +20 XP earned!";
      if (!accessStatus.hasSubscription && consumeResult.remainingCredits !== undefined) {
        message += `\n\nCredits remaining: ${consumeResult.remainingCredits}`;
      }

      Alert.alert("Success", message);
    } catch (error) {
      // Clean up any running intervals
      if (readingInterval) clearInterval(readingInterval);
      if (analysisInterval) clearInterval(analysisInterval);

      console.error("Failed to process document:", error);
      setIsProcessing(false);
      Alert.alert("Error", "Failed to process document. Please try again.");
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

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          {/* Circular Progress with glassmorphic container */}
          <Animated.View style={{
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            borderRadius: 120,
            padding: 32,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 8,
            transform: [{ scale: pulseAnim }],
          }}>
            <View style={{
              width: 160,
              height: 160,
              borderRadius: 80,
              borderWidth: 8,
              borderColor: 'rgba(100, 116, 139, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  borderWidth: 8,
                  borderTopColor: '#3B82F6',
                  borderRightColor: progressPercentage >= 25 ? '#3B82F6' : 'rgba(100, 116, 139, 0.2)',
                  borderBottomColor: progressPercentage >= 50 ? '#3B82F6' : 'rgba(100, 116, 139, 0.2)',
                  borderLeftColor: progressPercentage >= 75 ? '#3B82F6' : 'rgba(100, 116, 139, 0.2)',
                  transform: [{ rotate: spin }],
                }}
              />
              <Text style={{ color: '#1e293b', fontSize: 36, fontWeight: 'bold', zIndex: 10 }}>
                {progressPercentage}%
              </Text>
            </View>
          </Animated.View>

          <Text style={{
            color: '#1e293b',
            fontSize: 24,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 8
          }}>
            {processingMessage}
          </Text>
          <Text style={{
            color: '#64748b',
            textAlign: 'center',
            fontSize: 16,
            paddingHorizontal: 32
          }}>
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
      <View style={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 16,
        paddingBottom: 24,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: pressed ? 0.6 : 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          })}
        >
          <Ionicons name="chevron-back" size={28} color="#1e293b" />
        </Pressable>
        <Text style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: '#1e293b',
          marginLeft: 16
        }}>
          Upload Document
        </Text>
      </View>

      {/* Upload Section */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center', width: '100%' }}>
          {/* Glassmorphic document icon container */}
          <View style={{
            width: 180,
            height: 180,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: 90,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 8,
            borderWidth: 2,
            borderColor: 'rgba(255, 255, 255, 0.8)',
          }}>
            <View style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="document-text" size={72} color="#3B82F6" />
            </View>
          </View>

          <Text style={{
            color: '#1e293b',
            textAlign: 'center',
            fontSize: 20,
            fontWeight: '600',
            marginBottom: 12,
            paddingHorizontal: 24
          }}>
            Upload a document to generate AI-powered notes
          </Text>

          <Text style={{
            color: '#64748b',
            textAlign: 'center',
            fontSize: 15,
            marginBottom: 12,
            paddingHorizontal: 24
          }}>
            Supported: .TXT files{"\n"}
          </Text>

          <Text style={{
            color: '#94a3b8',
            textAlign: 'center',
            fontSize: 13,
            marginBottom: 48,
            paddingHorizontal: 32,
            lineHeight: 20
          }}>
            For PDFs and other formats, copy the text and paste it in the Record Audio screen using the paste icon
          </Text>

          {/* Beautifully designed gradient button */}
          <Pressable
            onPress={handleUploadDocument}
            style={({ pressed }) => ({
              width: '100%',
              maxWidth: 340,
              borderRadius: 28,
              overflow: 'hidden',
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: pressed ? 0.25 : 0.35,
              shadowRadius: 20,
              elevation: pressed ? 8 : 12,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <LinearGradient
              colors={['#60A5FA', '#3B82F6', '#2563EB']}
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
                  <Ionicons name="cloud-upload-outline" size={20} color="white" />
                </View>
                <Text style={{
                  color: 'white',
                  fontWeight: '700',
                  fontSize: 19,
                  letterSpacing: 0.5,
                }}>
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
