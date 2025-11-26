import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useNotesStore, Note } from "../state/notesStore";
import { MessageCircle, Send, Mic, Sparkles, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OpenAI from "openai";

type VoiceAssistantScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "VoiceAssistant">;
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function VoiceAssistantScreen({ navigation }: VoiceAssistantScreenProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const allNotes = useNotesStore((state) => state.notes);

  // Animation for mascot
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Add welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hi! I can search across all your notes and answer questions. Try asking:\n\n• What did I learn about [topic] across my notes?\n• Find all notes related to [subject]\n• Compare concepts from different notes\n• Quiz me on topics from all my notes",
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    // Pulse animation when loading
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isLoading]);

  const buildContext = (): string => {
    // Build a comprehensive context from all notes
    let context = "Here are all the user's notes:\n\n";

    allNotes.forEach((note, index) => {
      context += `Note ${index + 1}: "${note.title}"\n`;
      context += `Created: ${new Date(note.createdAt).toLocaleDateString()}\n`;

      if (note.tags && note.tags.length > 0) {
        context += `Tags: ${note.tags.join(", ")}\n`;
      }

      if (note.summary) {
        context += `Summary: ${note.summary}\n`;
      }

      if (note.content) {
        context += `Content: ${note.content.substring(0, 500)}${note.content.length > 500 ? "..." : ""}\n`;
      }

      if (note.keyPoints && note.keyPoints.length > 0) {
        context += `Key Points:\n${note.keyPoints.slice(0, 5).map(point => `- ${point}`).join("\n")}\n`;
      }

      context += "\n---\n\n";
    });

    return context;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Scroll to bottom after adding user message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error("OpenAI API key not configured. Please add it in the ENV tab.");
      }

      const openai = new OpenAI({
        apiKey: apiKey,
      });

      // Build context from all notes
      const notesContext = buildContext();

      // Create chat completion with context
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI study assistant. You have access to all of the user's notes and can answer questions about them. Be conversational, friendly, and helpful. When answering questions, always reference specific notes when relevant. If you don't find relevant information in the notes, say so politely and offer to help in another way.\n\n${notesContext}`,
          },
          ...messages.slice(-5).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: "user",
            content: userMessage.content,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Scroll to bottom after adding assistant message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error("Error generating response:", error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error.message?.includes("API key")
          ? "Please configure your OpenAI API key in the ENV tab to use the Voice Assistant."
          : "I'm sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
      <Animated.View
        style={{
          transform: [{ translateY: floatAnim }],
        }}
      >
        <View
          style={{
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#7DD3FC",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "rgba(125, 211, 252, 0.2)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={require("../assets/images/mascot-new.png")}
              style={{
                width: 90,
                height: 90,
              }}
              resizeMode="contain"
            />
          </View>
        </View>
      </Animated.View>

      <Text className="text-gray-900 text-3xl font-bold text-center mb-4 mt-8">
        Ask Me Anything
      </Text>
      <Text className="text-gray-600 text-lg text-center leading-7 max-w-sm">
        I can help you understand your notes, find information, and answer questions about what you've learned
      </Text>
    </View>
  );

  const renderMessage = (message: Message) => {
    const isUser = message.role === "user";

    return (
      <View
        key={message.id}
        style={{
          flexDirection: "row",
          justifyContent: isUser ? "flex-end" : "flex-start",
          marginBottom: 16,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            maxWidth: "80%",
            padding: 18,
            borderRadius: 20,
            backgroundColor: isUser
              ? "rgba(14, 165, 233, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
            borderWidth: 1,
            borderColor: isUser
              ? "rgba(125, 211, 252, 0.3)"
              : "rgba(255, 255, 255, 0.9)",
            shadowColor: isUser ? "#0ea5e9" : "#7DD3FC",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              lineHeight: 24,
              color: isUser ? "#ffffff" : "#1e293b",
            }}
          >
            {message.content}
          </Text>
        </View>
      </View>
    );
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
                Chat Across All Notes
              </Text>
              <Text className="text-gray-600 text-sm">
                Ask questions about all your notes
              </Text>
            </View>
          </View>
          <MessageCircle size={28} color="#0ea5e9" />
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 16,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 0 ? renderEmptyState() : messages.map(renderMessage)}

          {/* Loading indicator */}
          {isLoading && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-start",
                marginBottom: 16,
                paddingHorizontal: 20,
              }}
            >
              <Animated.View
                style={{
                  padding: 18,
                  borderRadius: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.9)",
                  shadowColor: "#7DD3FC",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 5,
                  transform: [{ scale: pulseAnim }],
                }}
              >
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#0ea5e9" />
                  <Text className="text-gray-600 ml-3 text-base">Thinking...</Text>
                </View>
              </Animated.View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar - Enhanced */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderTopWidth: 1,
            borderTopColor: "rgba(255, 255, 255, 0.8)",
            shadowColor: "#7DD3FC",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <View className="flex-row items-center">
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(248, 250, 252, 0.9)",
                borderRadius: 28,
                borderWidth: 2,
                borderColor: inputText.trim() ? "rgba(14, 165, 233, 0.4)" : "rgba(203, 213, 225, 0.5)",
                paddingHorizontal: 20,
                paddingVertical: 14,
                marginRight: 12,
                shadowColor: inputText.trim() ? "#0ea5e9" : "#94a3b8",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: inputText.trim() ? 0.15 : 0.08,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about your notes..."
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={500}
                style={{
                  fontSize: 16,
                  color: "#1e293b",
                  maxHeight: 100,
                  lineHeight: 22,
                }}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />
            </View>

            <Pressable
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="active:scale-90"
            >
              <LinearGradient
                colors={
                  !inputText.trim() || isLoading
                    ? ["#cbd5e1", "#94a3b8"]
                    : ["#0ea5e9", "#06b6d4"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: !inputText.trim() || isLoading ? "#94a3b8" : "#0ea5e9",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Send size={26} color="white" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
