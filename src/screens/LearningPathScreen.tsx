import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useNotesStore, Note } from "../state/notesStore";
import {
  X,
  Sparkles,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Circle,
  ArrowRight,
  Target,
  Lightbulb,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OpenAI from "openai";

type LearningPathScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "LearningPath">;
};

interface LearningNode {
  title: string;
  description: string;
  relatedNoteIds: string[];
  status: "completed" | "in-progress" | "pending";
  order: number;
}

interface LearningPath {
  overview: string;
  nodes: LearningNode[];
  nextSteps: string[];
  knowledgeGaps: string[];
}

export default function LearningPathScreen({
  navigation,
}: LearningPathScreenProps) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const allNotes = useNotesStore((state) => state.notes);

  // Animations
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating animation for mascot
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-generate on load
    generateLearningPath();
  }, []);

  useEffect(() => {
    // Pulse animation when loading
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
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
      // Fade in content when loaded
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  const buildNotesContext = (): string => {
    let context = "Here are all the user's notes with topics and dates:\n\n";

    allNotes.forEach((note, index) => {
      context += `Note ${index + 1}:\n`;
      context += `Title: "${note.title}"\n`;
      context += `Created: ${new Date(note.createdAt).toLocaleDateString()}\n`;

      if (note.tags && note.tags.length > 0) {
        context += `Tags: ${note.tags.join(", ")}\n`;
      }

      if (note.summary) {
        context += `Summary: ${note.summary}\n`;
      }

      if (note.keyPoints && note.keyPoints.length > 0) {
        context += `Key Points: ${note.keyPoints.slice(0, 3).join("; ")}\n`;
      }

      context += "\n";
    });

    return context;
  };

  const generateLearningPath = async () => {
    if (allNotes.length === 0) {
      setLearningPath({
        overview:
          "You haven't created any notes yet. Start taking notes to build your personalized learning path!",
        nodes: [],
        nextSteps: [
          "Create your first note from audio, video, or documents",
          "Take notes on topics you're interested in learning",
          "Return here to see your learning journey visualized",
        ],
        knowledgeGaps: [],
      });
      return;
    }

    setIsLoading(true);

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

      const notesContext = buildNotesContext();

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an educational AI that analyzes a user's notes to create a personalized learning path.

Analyze the notes and create a learning journey that:
1. Shows how concepts build on each other chronologically
2. Identifies what they've mastered vs. what needs more work
3. Suggests logical next topics to study
4. Points out knowledge gaps

Return ONLY valid JSON in this exact format:
{
  "overview": "A 2-3 sentence summary of their learning journey",
  "nodes": [
    {
      "title": "Topic name",
      "description": "What they learned",
      "relatedNoteIds": [0, 1, 2],
      "status": "completed" | "in-progress" | "pending",
      "order": 1
    }
  ],
  "nextSteps": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "knowledgeGaps": ["Gap 1", "Gap 2"]
}`,
          },
          {
            role: "user",
            content: notesContext,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const pathData = JSON.parse(
        completion.choices[0]?.message?.content || "{}"
      );

      setLearningPath(pathData);
    } catch (error: any) {
      console.error("Error generating learning path:", error);

      setLearningPath({
        overview:
          "Unable to generate learning path. Please check your API configuration.",
        nodes: [],
        nextSteps: [],
        knowledgeGaps: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={24} color="#10b981" />;
      case "in-progress":
        return <Circle size={24} color="#f59e0b" fill="#f59e0b" />;
      default:
        return <Circle size={24} color="#94a3b8" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10b981";
      case "in-progress":
        return "#f59e0b";
      default:
        return "#94a3b8";
    }
  };

  const renderNode = (node: LearningNode, index: number) => {
    const statusColor = getStatusColor(node.status);

    return (
      <View key={index}>
        {/* Connection Line with gradient */}
        {index > 0 && (
          <View className="items-center" style={{ height: 40 }}>
            <LinearGradient
              colors={[
                `${getStatusColor(learningPath?.nodes[index - 1].status || "pending")}40`,
                `${statusColor}40`,
              ]}
              style={{
                width: 3,
                height: 40,
                borderRadius: 2,
              }}
            />
          </View>
        )}

        {/* Node Card with enhanced design */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          className="active:scale-[0.98]"
          style={{
            transform: [{ scale: 1 }],
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: 20,
              padding: 20,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.9)",
              shadowColor: statusColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 5,
            }}
          >
            <View className="flex-row items-start">
              {/* Status Icon with circle background */}
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: `${statusColor}20`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                {getStatusIcon(node.status)}
              </View>

              <View className="flex-1">
                {/* Node number badge */}
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: `${statusColor}15`,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: statusColor,
                    }}
                  >
                    Step {index + 1}
                  </Text>
                </View>

                <Text className="text-gray-900 text-xl font-bold mb-3">
                  {node.title}
                </Text>
                <Text className="text-gray-600 text-base leading-6 mb-3">
                  {node.description}
                </Text>

                {node.relatedNoteIds && node.relatedNoteIds.length > 0 && (
                  <View
                    className="flex-row items-center"
                    style={{
                      backgroundColor: "rgba(125, 211, 252, 0.1)",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      alignSelf: "flex-start",
                    }}
                  >
                    <BookOpen size={16} color="#0ea5e9" />
                    <Text
                      style={{
                        color: "#0ea5e9",
                        fontSize: 13,
                        fontWeight: "600",
                        marginLeft: 6,
                      }}
                    >
                      {node.relatedNoteIds.length} related note
                      {node.relatedNoteIds.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Pressable>
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
                Learning Path
              </Text>
              <Text className="text-gray-600 text-sm">
                Your knowledge journey
              </Text>
            </View>
          </View>
          <TrendingUp size={28} color="#0ea5e9" />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }, { translateY: floatAnim }],
            }}
          >
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: "rgba(255, 255, 255, 0.4)",
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#0ea5e9",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <Image
                source={require("../assets/images/mascot-new.png")}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
          <Text className="text-gray-900 text-xl font-bold text-center mt-8 mb-3">
            Analyzing Your Journey
          </Text>
          <Text className="text-gray-600 text-base text-center leading-6 px-4">
            Mapping your knowledge and finding connections across your notes...
          </Text>
        </View>
      ) : (
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
          >
            {learningPath && (
              <>
                {/* Overview Card - Enhanced */}
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: 24,
                    padding: 24,
                    marginBottom: 32,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.9)",
                    shadowColor: "#7DD3FC",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.25,
                    shadowRadius: 16,
                    elevation: 5,
                  }}
                >
                  <View className="flex-row items-center mb-4">
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "rgba(14, 165, 233, 0.15)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Sparkles size={22} color="#0ea5e9" />
                    </View>
                    <Text className="text-gray-900 text-2xl font-bold">
                      Your Journey
                    </Text>
                  </View>
                  <Text className="text-gray-700 text-base leading-7">
                    {learningPath.overview}
                  </Text>
                </View>

                {/* Learning Nodes */}
                {learningPath.nodes && learningPath.nodes.length > 0 && (
                  <View className="mb-6">
                    <View className="flex-row items-center mb-6">
                      <Target size={24} color="#0ea5e9" />
                      <Text className="text-gray-900 text-2xl font-bold ml-3">
                        Learning Path
                      </Text>
                    </View>
                    {learningPath.nodes.map((node, index) =>
                      renderNode(node, index)
                    )}
                  </View>
                )}

                {/* Next Steps - Enhanced */}
                {learningPath.nextSteps && learningPath.nextSteps.length > 0 && (
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: 24,
                      padding: 24,
                      marginBottom: 20,
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.9)",
                      shadowColor: "#10b981",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.2,
                      shadowRadius: 16,
                      elevation: 5,
                    }}
                  >
                    <View className="flex-row items-center mb-4">
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <ArrowRight size={22} color="#10b981" />
                      </View>
                      <Text className="text-gray-900 text-xl font-bold">
                        Next Steps
                      </Text>
                    </View>
                    {learningPath.nextSteps.map((step, index) => (
                      <View
                        key={index}
                        className="flex-row items-start mb-3 last:mb-0"
                      >
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: "rgba(16, 185, 129, 0.15)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                            marginTop: 2,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "700",
                              color: "#10b981",
                            }}
                          >
                            {index + 1}
                          </Text>
                        </View>
                        <Text className="text-gray-700 text-base flex-1 leading-6">
                          {step}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Knowledge Gaps - Enhanced */}
                {learningPath.knowledgeGaps &&
                  learningPath.knowledgeGaps.length > 0 && (
                    <View
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: 24,
                        padding: 24,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.9)",
                        shadowColor: "#f59e0b",
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.2,
                        shadowRadius: 16,
                        elevation: 5,
                      }}
                    >
                      <View className="flex-row items-center mb-4">
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: "rgba(245, 158, 11, 0.15)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Lightbulb size={22} color="#f59e0b" />
                        </View>
                        <Text className="text-gray-900 text-xl font-bold">
                          Strengthen These
                        </Text>
                      </View>
                      {learningPath.knowledgeGaps.map((gap, index) => (
                        <View
                          key={index}
                          className="flex-row items-start mb-3 last:mb-0"
                        >
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: "#f59e0b",
                              marginRight: 12,
                              marginTop: 8,
                            }}
                          />
                          <Text className="text-gray-700 text-base flex-1 leading-6">
                            {gap}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                {/* Regenerate Button - Enhanced */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    generateLearningPath();
                  }}
                  disabled={isLoading}
                  className="active:scale-95 mt-4"
                >
                  <LinearGradient
                    colors={["#0ea5e9", "#06b6d4"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingHorizontal: 28,
                      paddingVertical: 18,
                      borderRadius: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#0ea5e9",
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.4,
                      shadowRadius: 12,
                      elevation: 6,
                    }}
                  >
                    <Sparkles size={22} color="white" />
                    <Text className="text-white text-lg font-bold ml-3">
                      Regenerate Path
                    </Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}
