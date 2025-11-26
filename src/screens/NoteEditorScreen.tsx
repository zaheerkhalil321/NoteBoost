import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { useNotesStore } from "../state/notesStore";
import { AIMessage } from "../types/ai";
import { getOpenAITextResponse } from "../api/chat-service";
import { generateVisualContent } from "../api/visual-content-generator";
import { generateAdditionalQuiz, generateAdditionalFlashcards } from "../api/ai-content-generator";
import * as Haptics from "expo-haptics";
import { VisualNotesTab } from "../components/VisualNotesTab";
import { MarkdownEditor } from "../components/MarkdownEditor";

type NoteEditorScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "NoteEditor">;
  route: RouteProp<RootStackParamList, "NoteEditor">;
};

type Tab = "Notes" | "Feynman" | "Podcast" | "Quiz" | "Chat" | "Flashcards" | "Transcript" | "Visuals";

// Animated Mascot Component for Empty States
function AnimatedMascot({ size = 100, isLoading = false }: { size?: number; isLoading?: boolean }) {
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

  return (
    <Animated.View
      style={{
        transform: [{ translateY: floatAnim }, { scale: pulseAnim }],
      }}
    >
      <View
        style={{
          width: size + 40,
          height: size + 40,
          borderRadius: (size + 40) / 2,
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
        <Image
          source={require('../assets/images/mascot-new.png')}
          style={{
            width: size,
            height: size,
          }}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

export default function NoteEditorScreen({
  navigation,
  route,
}: NoteEditorScreenProps) {
  console.log('[NoteEditorScreen] Loaded v2');
  const insets = useSafeAreaInsets();
  const { noteId } = route.params;
  const { notes, deleteNote, updateNote, addTagToNote, removeTagFromNote } = useNotesStore();

  const [activeTab, setActiveTab] = useState<Tab>("Notes");
  const [note, setNote] = useState(notes.find((n) => n.id === noteId));
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(note?.title || "");
  const [editedContent, setEditedContent] = useState(note?.content || "");
  const [history, setHistory] = useState<{ title: string; content: string }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    const foundNote = notes.find((n) => n.id === noteId);
    setNote(foundNote);
    if (foundNote) {
      setEditedTitle(foundNote.title);
      setEditedContent(foundNote.content || "");
    }
  }, [noteId, notes]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const pushToHistory = useCallback(() => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ title: editedTitle, content: editedContent });
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [editedTitle, editedContent, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const previousState = history[historyIndex - 1];
      setEditedTitle(previousState.title);
      setEditedContent(previousState.content);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const nextState = history[historyIndex + 1];
      setEditedTitle(nextState.title);
      setEditedContent(nextState.content);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [history, historyIndex]);

  const handleStartEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(true);
    // Initialize history
    setHistory([{ title: editedTitle, content: editedContent }]);
    setHistoryIndex(0);
  }, [editedTitle, editedContent]);

  const handleSaveEdit = useCallback(() => {
    if (noteId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateNote(noteId, {
        title: editedTitle,
        content: editedContent,
      });
      setIsEditing(false);
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [noteId, editedTitle, editedContent, updateNote]);

  const handleCancelEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(false);
    if (note) {
      setEditedTitle(note.title);
      setEditedContent(note.content || "");
    }
    setHistory([]);
    setHistoryIndex(-1);
  }, [note]);

  const handleDelete = useCallback(() => {
    if (noteId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert("Delete Note", "Are you sure?", [
        { text: "Cancel", style: "cancel", onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deleteNote(noteId);
            navigation.goBack();
          },
        },
      ]);
    }
  }, [noteId, deleteNote, navigation]);

  const handleGenerateVisuals = useCallback(async () => {
    if (!note || !noteId) return;

    setIsGeneratingVisuals(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const visualContent = await generateVisualContent(
        note.content || note.summary || "",
        note.title
      );

      updateNote(noteId, { visualContent });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Visuals Generated!",
        "Your visual content has been created successfully.",
        [{ text: "OK", onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }]
      );
    } catch (error) {
      console.error("Error generating visuals:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Generation Failed",
        "Unable to generate visual content. Please try again.",
        [{ text: "OK", onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }]
      );
    } finally {
      setIsGeneratingVisuals(false);
    }
  }, [note, noteId, updateNote]);

  const handleAddTag = useCallback(() => {
    if (!noteId || !tagInput.trim()) return;

    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addTagToNote(noteId, tag);
    setTagInput("");
    setShowTagInput(false);
  }, [noteId, tagInput, addTagToNote]);

  const handleRemoveTag = useCallback((tag: string) => {
    if (!noteId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeTagFromNote(noteId, tag);
  }, [noteId, removeTagFromNote]);

  if (!note) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="text-gray-700 text-lg mt-4">Loading note...</Text>
      </View>
    );
  }

  const tabs: Tab[] = ["Notes", "Feynman", "Podcast", "Quiz", "Chat", "Flashcards", "Visuals", "Transcript"];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Notes":
        return <NotesTab
          note={note}
          isEditing={isEditing}
          editedTitle={editedTitle}
          editedContent={editedContent}
          onTitleChange={setEditedTitle}
          onContentChange={(text: string) => {
            setEditedContent(text);
            pushToHistory();
          }}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />;
      case "Feynman":
        return <FeynmanTab noteId={note.id} feynmanExplanation={note.feynmanExplanation} />;
      case "Visuals":
        return <VisualNotesTab
          note={note}
          onGenerateVisuals={handleGenerateVisuals}
          isGenerating={isGeneratingVisuals}
        />;
      case "Podcast":
        return <PodcastTab podcast={note.podcast} />;
      case "Quiz":
        return <QuizTab quiz={note.quiz} noteContent={note.content} noteId={note.id} />;
      case "Flashcards":
        return <FlashcardsTab flashcards={note.flashcards} noteContent={note.content} noteId={note.id} />;
      case "Transcript":
        return <TranscriptTab transcript={note.transcript} />;
      case "Chat":
        return <ChatTab note={note} />;
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header with Frosted Glass Design - Matching App Theme */}
      <LinearGradient
        colors={['#e0f2fe', '#dbeafe', '#fef3c7', '#fef9c3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top }}
      >
        {/* Frosted Glass Overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
          }}
        />
        <View className="px-5 pb-5">
          {/* Top Bar */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (isEditing) {
                  handleCancelEdit();
                } else {
                  navigation.goBack();
                }
              }}
              className="active:opacity-70 w-10 h-10 items-center justify-center -ml-2"
            >
              <Ionicons name={isEditing ? "close" : "chevron-back"} size={28} color="#0ea5e9" />
            </Pressable>

            {/* Edit Mode Controls */}
            {activeTab === "Notes" && !isEditing && (
              <View className="flex-row items-center">
                {/* Edit Button */}
                <Pressable
                  onPress={handleStartEdit}
                  className="active:opacity-70 w-10 h-10 items-center justify-center mr-2"
                >
                  <Ionicons name="create-outline" size={24} color="#0ea5e9" />
                </Pressable>

                {/* Menu Button */}
                <Pressable
                  onPress={handleDelete}
                  className="active:opacity-70 w-10 h-10 items-center justify-center -mr-2"
                >
                  <Ionicons name="ellipsis-vertical" size={24} color="#0ea5e9" />
                </Pressable>
              </View>
            )}

            {/* Save button when editing */}
            {activeTab === "Notes" && isEditing && (
              <Pressable
                onPress={handleSaveEdit}
                className="active:opacity-70 px-5 py-2.5 rounded-full"
                style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)', borderWidth: 1.5, borderColor: 'rgba(14, 165, 233, 0.3)' }}
              >
                <Text className="text-[#0ea5e9] font-bold">Save</Text>
              </Pressable>
            )}

            {/* Non-Notes tabs - show only menu */}
            {activeTab !== "Notes" && (
              <Pressable
                onPress={handleDelete}
                className="active:opacity-70 w-10 h-10 items-center justify-center -mr-2"
              >
                <Ionicons name="ellipsis-vertical" size={24} color="#0ea5e9" />
              </Pressable>
            )}
          </View>

          {/* Title */}
          {isEditing ? (
            <TextInput
              value={editedTitle}
              onChangeText={setEditedTitle}
              className="text-[#0f172a] text-3xl font-black mb-3 px-1"
              placeholder="Note Title"
              placeholderTextColor="rgba(15, 23, 42, 0.4)"
              style={{ minHeight: 40 }}
            />
          ) : (
            <Text className="text-[#0f172a] text-3xl font-black mb-3 px-1">
              {note.title}
            </Text>
          )}

          {/* Tags Section */}
          <View className="mb-5 px-1">
            <View className="flex-row items-center flex-wrap">
              {note.tags && note.tags.length > 0 && (
                <>
                  {note.tags.map((tag, index) => (
                    <View
                      key={index}
                      className="flex-row items-center px-3 py-1.5 rounded-full mr-2 mb-2"
                      style={{
                        backgroundColor: 'rgba(14, 165, 233, 0.15)',
                        borderWidth: 1,
                        borderColor: 'rgba(14, 165, 233, 0.3)',
                      }}
                    >
                      <Text className="text-[#0ea5e9] text-sm font-semibold mr-1">
                        #{tag}
                      </Text>
                      <Pressable
                        onPress={() => handleRemoveTag(tag)}
                        className="active:opacity-50"
                      >
                        <Ionicons name="close-circle" size={16} color="#0ea5e9" />
                      </Pressable>
                    </View>
                  ))}
                </>
              )}

              {/* Add Tag Button */}
              {!showTagInput ? (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowTagInput(true);
                  }}
                  className="flex-row items-center px-3 py-1.5 rounded-full mb-2 active:opacity-70"
                  style={{
                    backgroundColor: 'rgba(125, 211, 252, 0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(125, 211, 252, 0.3)',
                  }}
                >
                  <Ionicons name="add" size={16} color="#7DD3FC" />
                  <Text className="text-[#7DD3FC] text-sm font-semibold ml-1">
                    Add Tag
                  </Text>
                </Pressable>
              ) : (
                <View className="flex-row items-center mb-2">
                  <TextInput
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="tag-name"
                    placeholderTextColor="#94a3b8"
                    autoFocus
                    onSubmitEditing={handleAddTag}
                    className="px-3 py-1.5 rounded-full mr-2"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderWidth: 1,
                      borderColor: 'rgba(14, 165, 233, 0.3)',
                      minWidth: 120,
                      color: '#0ea5e9',
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  />
                  <Pressable
                    onPress={handleAddTag}
                    className="w-7 h-7 rounded-full items-center justify-center mr-1 active:opacity-70"
                    style={{
                      backgroundColor: 'rgba(14, 165, 233, 0.15)',
                    }}
                  >
                    <Ionicons name="checkmark" size={18} color="#0ea5e9" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowTagInput(false);
                      setTagInput("");
                    }}
                    className="w-7 h-7 rounded-full items-center justify-center active:opacity-70"
                    style={{
                      backgroundColor: 'rgba(148, 163, 184, 0.15)',
                    }}
                  >
                    <Ionicons name="close" size={18} color="#94a3b8" />
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          {/* Tabs - Frosted Glass Design */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row -mx-1"
          >
            {tabs.map((tab) => (
              <Pressable
                key={tab}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab);
                }}
                className="mr-3 px-6 py-3 rounded-full"
                style={{
                  backgroundColor: activeTab === tab ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)',
                  borderWidth: activeTab === tab ? 2 : 1.5,
                  borderColor: activeTab === tab ? 'rgba(14, 165, 233, 0.4)' : 'rgba(14, 165, 233, 0.15)',
                  shadowColor: '#0ea5e9',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: activeTab === tab ? 0.15 : 0.05,
                  shadowRadius: 12,
                  elevation: activeTab === tab ? 4 : 2,
                }}
              >
                <Text
                  className={`text-base font-black ${
                    activeTab === tab ? "text-[#0ea5e9]" : "text-[#64748b]"
                  }`}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Content with Home Screen Gradient Background */}
      <LinearGradient
        colors={["#D6EAF8", "#E8F4F8", "#F9F7E8", "#FFF9E6"]}
        locations={[0, 0.4, 0.7, 1]}
        style={{ flex: 1 }}
      >
        {activeTab === "Chat" ? (
          <View className="flex-1" style={{ padding: 20 }}>
            {renderTabContent()}
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {renderTabContent()}
          </ScrollView>
        )}
      </LinearGradient>
    </View>
  );
}

// Notes Tab Component - Beautiful Glassmorphic Design
interface NotesTabProps {
  note: any;
  isEditing?: boolean;
  editedTitle?: string;
  editedContent?: string;
  onTitleChange?: (title: string) => void;
  onContentChange?: (content: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const NotesTab = React.memo(({
  note,
  isEditing = false,
  editedTitle,
  editedContent,
  onTitleChange,
  onContentChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}: NotesTabProps) => {
  // Helper function to render formatted text with colored keywords
  const renderFormattedText = (text: string) => {
    // Match patterns:
    // **word** for blue bold text (using app's cyan theme)
    // "quoted text" for italic text
    // Regular text for dark gray
    const parts: { type: string; content: string }[] = [];
    let currentIndex = 0;

    // Pattern to match **word** and "quoted text"
    const regex = /(\*\*[^*]+\*\*)|("[^"]+")/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > currentIndex) {
        parts.push({ type: 'normal', content: text.slice(currentIndex, match.index) });
      }

      if (match[0].startsWith('**')) {
        // Bold keyword
        parts.push({ type: 'bold', content: match[0].slice(2, -2) });
      } else if (match[0].startsWith('"')) {
        // Quoted text (italic)
        parts.push({ type: 'italic', content: match[0].slice(1, -1) });
      }

      currentIndex = regex.lastIndex;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push({ type: 'normal', content: text.slice(currentIndex) });
    }

    return (
      <Text className="text-[#1e293b] text-base leading-7">
        {parts.map((part, idx) => {
          if (part.type === 'bold') {
            return (
              <Text key={idx} className="text-[#0ea5e9] font-semibold">
                {part.content}
              </Text>
            );
          } else if (part.type === 'italic') {
            return (
              <Text key={idx} style={{ fontStyle: 'italic' }} className="text-[#64748b]">
                {part.content}
              </Text>
            );
          }
          return <Text key={idx}>{part.content}</Text>;
        })}
      </Text>
    );
  };

  return (
    <View>
      {/* Edit Mode - Show MarkdownEditor */}
      {isEditing && onContentChange ? (
        <View>
          <MarkdownEditor
            value={editedContent || ''}
            onChangeText={onContentChange}
            placeholder="Write your beautiful thoughts here..."
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </View>
      ) : (
        <>
          {/* Read-Only Mode - Clean, Flat Design like Reference */}

          {/* Summary Section - Beautifully Organized */}
          {note.summary && (
            <View className="mb-8">
              {/* Summary Header with elegant styling */}
              <View
                className="mb-6 pb-4"
                style={{
                  borderBottomWidth: 2,
                  borderBottomColor: 'rgba(14, 165, 233, 0.2)'
                }}
              >
                <Text className="text-[#0ea5e9] text-[22px] font-bold tracking-wide">
                  Summary
                </Text>
              </View>

              {/* Summary Content with beautiful card design */}
              <View
                className="p-5 rounded-3xl mb-4"
                style={{
                  backgroundColor: 'rgba(248, 250, 252, 0.8)',
                  borderWidth: 1,
                  borderColor: 'rgba(203, 213, 225, 0.4)',
                  shadowColor: '#0ea5e9',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {note.summary.split('\n').filter((line: string) => line.trim()).map((line: string, index: number) => {
                const trimmedLine = line.trim();

                // Check if this is a section header (starts with emoji)
                const isHeader = /^[^\w\s]/.test(trimmedLine);

                if (isHeader) {
                  return (
                    <View key={index} className="mb-3 mt-5">
                      <Text className="text-[#1e293b] text-[20px] font-bold leading-tight">
                        {trimmedLine}
                      </Text>
                    </View>
                  );
                }

                // Check if it's a sub-bullet (indented with spaces) - convert to circle bullet
                if (trimmedLine.match(/^[\s]{2,}[•]/)) {
                  const bulletText = trimmedLine.replace(/^[\s•]+/, '').trim();

                  return (
                    <View key={index} className="mb-2 ml-3 flex-row">
                      <Text className="text-[#1e293b] text-[15px] mr-2 mt-0.5">•</Text>
                      <Text className="text-[#1e293b] text-[15px] leading-6 flex-1">
                        {bulletText}
                      </Text>
                    </View>
                  );
                }

                // Check if it's a main bullet (starts with "•")
                if (trimmedLine.startsWith('•')) {
                  const bulletText = trimmedLine.slice(1).trim();

                  return (
                    <View key={index} className="mb-2 flex-row">
                      <Text className="text-[#1e293b] text-[16px] mr-2 mt-0.5">•</Text>
                      <View className="flex-1">
                        <Text className="text-[#1e293b] text-[16px] leading-6">
                          {bulletText}
                        </Text>
                      </View>
                    </View>
                  );
                }

                // Regular text (shouldn't happen with new format, but fallback)
                if (trimmedLine.length > 0) {
                  return (
                    <View key={index} className="mb-2">
                      <Text className="text-[#1e293b] text-[16px] leading-6">
                        {trimmedLine}
                      </Text>
                    </View>
                  );
                }

                return null;
              })}
              </View>
            </View>
          )}

      {/* Key Points Section - Clean Minimal Style like Reference */}
      {note.keyPoints && note.keyPoints.length > 0 && (
        <View className="mb-8">
          {note.keyPoints.map((point: string, index: number) => {
            // Check if this point is a section header (starts with emoji)
            const isHeader = /^[^\w\s]/.test(point);

            if (isHeader) {
              return (
                <View key={index} className="mb-3 mt-5">
                  <Text className="text-[#1e293b] text-[20px] font-bold leading-tight">
                    {point}
                  </Text>
                </View>
              );
            }

            // Regular bullet point - Simple plain text
            return (
              <View key={index} className="mb-3">
                <View className="flex-row">
                  <Text className="text-[#1e293b] text-[16px] mr-2 mt-0.5">•</Text>
                  <View className="flex-1">
                    <Text className="text-[#1e293b] text-[16px] leading-6">
                      {point}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Table Section - STUNNING Glassmorphic Table */}
      {note.table && (
        <View className="mb-8">
          <View
            className="rounded-[32px] overflow-hidden"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.8)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.1,
              shadowRadius: 28,
              elevation: 10,
            }}
          >
            {/* Table Header - Beautiful Blue Gradient */}
            <LinearGradient
              colors={['#0ea5e9', '#06b6d4', '#7DD3FC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flexDirection: 'row' }}
            >
              <View className="flex-1 p-6 border-r border-white/20">
                <Text className="text-white font-black text-center text-lg">
                  {note.table.headers[0]}
                </Text>
              </View>
              <View className="flex-1 p-6">
                <Text className="text-white font-black text-center text-lg">
                  {note.table.headers[1]}
                </Text>
              </View>
            </LinearGradient>

            {/* Table Rows - Premium Glassmorphic */}
            {note.table.rows.map((row: { col1: string; col2: string }, idx: number) => (
              <View
                key={idx}
                className="flex-row"
                style={{
                  backgroundColor: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.7)' : 'rgba(240, 249, 255, 0.5)',
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                <View className="flex-1 p-6 border-r" style={{ borderRightColor: 'rgba(255, 255, 255, 0.5)' }}>
                  <Text className="text-[#0f172a] font-bold text-lg">
                    {row.col1}
                  </Text>
                </View>
                <View className="flex-1 p-6">
                  <Text className="text-[#334155] text-lg leading-8">
                    {row.col2}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
        </>
      )}
    </View>
  );
});

// Feynman Tab Component
function FeynmanTab({ noteId, feynmanExplanation }: { noteId: string; feynmanExplanation?: string }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!feynmanExplanation) {
    return (
      <LinearGradient
        colors={['#fef9c3', '#fef3c7', '#e0f2fe', '#dbeafe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <ScrollView className="flex-1">
          <View className="flex-1 items-center justify-center py-14 px-7">
            {/* Glassmorphic Card Container */}
            <BlurView
              intensity={40}
              tint="light"
              style={{
                overflow: 'hidden',
                borderRadius: 32,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.35)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.15,
                shadowRadius: 30,
                elevation: 8,
              }}
            >
              <View className="items-center py-10 px-8">
                {/* Mascot with glow effect */}
                <View style={{
                  shadowColor: '#0EA5E9',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                }}>
                  <AnimatedMascot size={110} />
                </View>

                {/* Title with gradient text effect */}
                <Text className="text-gray-900 text-3xl font-black mb-2 mt-6" style={{
                  textShadowColor: 'rgba(14, 165, 233, 0.15)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 8,
                }}>
                  Feynman Technique
                </Text>

                <Text className="text-gray-700 text-base text-center leading-7 mb-8 font-medium">
                  Master this concept by explaining it in simple terms. If you can teach it to a 10-year-old, you truly understand it.
                </Text>

                {/* Glassmorphic CTA Button */}
                <Pressable
                  onPress={() => navigation.navigate("Feynman", { noteId })}
                  className="active:opacity-70"
                >
                  <LinearGradient
                    colors={['#0EA5E9', '#0284C7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingHorizontal: 32,
                      paddingVertical: 16,
                      borderRadius: 100,
                      flexDirection: 'row',
                      alignItems: 'center',
                      shadowColor: '#0EA5E9',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.4,
                      shadowRadius: 16,
                      elevation: 8,
                    }}
                  >
                    <Ionicons name="create-outline" size={24} color="white" />
                    <Text className="text-white text-lg font-bold ml-2">Start Explaining</Text>
                  </LinearGradient>
                </Pressable>

                {/* Info Card with Glass Effect */}
                <BlurView
                  intensity={30}
                  tint="light"
                  style={{
                    marginTop: 32,
                    overflow: 'hidden',
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <View className="p-6">
                    <Text className="text-gray-800 text-base font-bold mb-3">💡 What is the Feynman Technique?</Text>
                    <Text className="text-gray-700 text-sm leading-6 font-medium">
                      1. Explain the concept in simple words{'\n'}
                      2. Use analogies from everyday life{'\n'}
                      3. Identify gaps in your understanding{'\n'}
                      4. Review and simplify further
                    </Text>
                  </View>
                </BlurView>
              </View>
            </BlurView>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-5">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Ionicons name="bulb" size={28} color="#0EA5E9" />
            <Text className="text-2xl font-black text-gray-900 ml-2">Your Explanation</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate("Feynman", { noteId })}
            className="bg-sky-500 px-4 py-2 rounded-full active:opacity-80"
          >
            <Text className="text-white font-semibold">Edit</Text>
          </Pressable>
        </View>

        <View className="bg-white rounded-2xl p-5 border border-gray-200">
          <Text className="text-gray-800 text-base leading-7">
            {feynmanExplanation}
          </Text>
        </View>

        <View className="mt-4 bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
          <View className="flex-row items-center mb-2">
            <Ionicons name="star" size={20} color="#FCD34D" />
            <Text className="text-gray-700 text-sm font-semibold ml-2">Remember</Text>
          </View>
          <Text className="text-gray-600 text-sm leading-6">
            The simpler you can explain it, the better you understand it. Keep refining your explanation!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Podcast Tab Component
function PodcastTab({ podcast, noteId }: { podcast?: string; noteId?: string }) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationProgress, setGenerationProgress] = React.useState(0);
  const [currentSegment, setCurrentSegment] = React.useState(0);
  const [totalSegments, setTotalSegments] = React.useState(0);
  const [audioFiles, setAudioFiles] = React.useState<string[]>([]);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [sound, setSound] = React.useState<any>(null);
  const [playingSegment, setPlayingSegment] = React.useState(0);
  const [showScript, setShowScript] = React.useState(true);

  React.useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (!podcast) {
    return (
      <View className="flex-1 items-center justify-center py-16 px-8">
        <AnimatedMascot size={100} />
        <Text className="text-gray-900 text-2xl font-black mb-3 mt-6">No Podcast Yet</Text>
        <Text className="text-gray-600 text-base text-center leading-7">
          Generate a podcast script to get started
        </Text>
      </View>
    );
  }

  const handleGenerateAudio = async () => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);

      const { generatePodcastAudio } = await import("../api/voice-generation");

      const files = await generatePodcastAudio(
        podcast,
        (progress, segment, total) => {
          setGenerationProgress(progress);
          setCurrentSegment(segment);
          setTotalSegments(total);
        }
      );

      setAudioFiles(files);
      setIsGenerating(false);
    } catch (error: any) {
      console.error("Error generating podcast audio:", error);
      setIsGenerating(false);

      if (error.message.includes("API key")) {
        Alert.alert(
          "API Key Required",
          "Please add your OpenAI API key in the ENV tab of the Vibecode app to use AI voice generation.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Generation Failed",
          error.message || "Failed to generate podcast audio. Please try again.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const handlePlayAudio = async () => {
    if (audioFiles.length === 0) return;

    try {
      if (isPlaying && sound) {
        // Pause
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound && !isPlaying) {
        // Resume
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        // Start playing first segment
        const { Audio } = await import("expo-av");
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioFiles[0] },
          { shouldPlay: true }
        );

        setSound(newSound);
        setIsPlaying(true);
        setPlayingSegment(0);

        // Handle playback status
        let segmentIndex = 0;
        newSound.setOnPlaybackStatusUpdate(async (status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            segmentIndex++;
            if (segmentIndex < audioFiles.length) {
              // Play next segment
              setPlayingSegment(segmentIndex);
              await newSound.unloadAsync();
              const { sound: nextSound } = await Audio.Sound.createAsync(
                { uri: audioFiles[segmentIndex] },
                { shouldPlay: true }
              );
              setSound(nextSound);

              // Continue the chain
              nextSound.setOnPlaybackStatusUpdate(newSound._onPlaybackStatusUpdate);
            } else {
              // All segments played
              await newSound.unloadAsync();
              setIsPlaying(false);
              setSound(null);
              setPlayingSegment(0);
            }
          }
        });
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      Alert.alert("Playback Error", "Failed to play audio. Please try again.");
      setIsPlaying(false);
    }
  };

  const handleStopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPlayingSegment(0);
    }
  };

  return (
    <View>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View
          className="rounded-[24px] px-6 py-4"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.8)',
            shadowColor: '#0ea5e9',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <LinearGradient
            colors={['rgba(14, 165, 233, 0.1)', 'rgba(251, 191, 36, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 24,
            }}
          />
          <View className="flex-row items-center">
            <Ionicons name="mic" size={24} color="#0ea5e9" />
            <Text className="text-gray-900 text-xl font-black ml-3">Podcast</Text>
          </View>
        </View>
        <Pressable
          onPress={() => setShowScript(!showScript)}
          className="active:opacity-60 w-14 h-14 rounded-[20px] items-center justify-center"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.8)',
            shadowColor: '#0ea5e9',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <Ionicons
            name={showScript ? "eye-off" : "eye"}
            size={24}
            color="#0ea5e9"
          />
        </Pressable>
      </View>

      {/* Audio Controls - STUNNING Glassmorphic Card */}
      <View
        className="rounded-[32px] p-8 mb-6"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderWidth: 1.5,
          borderColor: 'rgba(255, 255, 255, 0.9)',
          shadowColor: '#0ea5e9',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={['rgba(14, 165, 233, 0.12)', 'rgba(251, 191, 36, 0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 32,
          }}
        />
        {audioFiles.length === 0 ? (
          <View>
            <View className="flex-row items-center mb-3">
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                style={{
                  backgroundColor: 'rgba(14, 165, 233, 0.15)',
                }}
              >
                <Ionicons name="sparkles" size={24} color="#0ea5e9" />
              </View>
              <Text className="text-gray-900 text-2xl font-black flex-1">
                AI Voice Generation
              </Text>
            </View>
            <Text className="text-gray-600 text-base mb-6 leading-7">
              Generate AI voices to listen to your podcast with multiple speakers
            </Text>

            {isGenerating ? (
              <View>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-700 text-base font-semibold">
                    Generating segment {currentSegment} of {totalSegments}
                  </Text>
                  <Text className="text-sky-600 text-lg font-black">
                    {Math.round(generationProgress * 100)}%
                  </Text>
                </View>
                <View className="h-3 bg-white/70 rounded-full overflow-hidden border-2 border-white">
                  <LinearGradient
                    colors={['#0ea5e9', '#06b6d4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: '100%',
                      width: `${generationProgress * 100}%`,
                      borderRadius: 999,
                    }}
                  />
                </View>
              </View>
            ) : (
              <Pressable
                onPress={handleGenerateAudio}
                className="py-5 rounded-[24px] items-center active:opacity-80"
                style={{
                  shadowColor: '#0ea5e9',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.35,
                  shadowRadius: 20,
                  elevation: 8,
                }}
              >
                <LinearGradient
                  colors={['#0ea5e9', '#06b6d4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 24,
                  }}
                />
                <View className="flex-row items-center">
                  <Ionicons name="sparkles" size={24} color="white" />
                  <Text className="text-white font-black text-lg ml-3">
                    Generate AI Voices
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        ) : (
          <View>
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{
                    backgroundColor: 'rgba(14, 165, 233, 0.15)',
                  }}
                >
                  <Ionicons
                    name={isPlaying ? "musical-notes" : "play-circle"}
                    size={22}
                    color="#0ea5e9"
                  />
                </View>
                <Text className="text-gray-900 text-xl font-black">
                  {isPlaying ? "Now Playing" : "Ready to Play"}
                </Text>
              </View>
              <View
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: 'rgba(14, 165, 233, 0.15)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(14, 165, 233, 0.3)',
                }}
              >
                <Text className="text-[#0ea5e9] text-sm font-bold">
                  {playingSegment + 1} / {audioFiles.length}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={handlePlayAudio}
                className="flex-1 py-5 rounded-[24px] items-center active:opacity-80"
                style={{
                  shadowColor: '#0ea5e9',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.35,
                  shadowRadius: 20,
                  elevation: 6,
                }}
              >
                <LinearGradient
                  colors={['#0ea5e9', '#06b6d4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 24,
                  }}
                />
                <View className="flex-row items-center">
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={24}
                    color="white"
                  />
                  <Text className="text-white font-black text-lg ml-3">
                    {isPlaying ? "Pause" : "Play"}
                  </Text>
                </View>
              </Pressable>

              {isPlaying && (
                <Pressable
                  onPress={handleStopAudio}
                  className="px-6 py-5 rounded-[24px] items-center justify-center active:opacity-80"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderWidth: 2,
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <Ionicons name="stop" size={24} color="#ef4444" />
                </Pressable>
              )}

              <Pressable
                onPress={() => {
                  handleStopAudio();
                  setAudioFiles([]);
                }}
                className="px-6 py-5 rounded-[24px] items-center justify-center active:opacity-80"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  borderWidth: 2,
                  borderColor: 'rgba(107, 114, 128, 0.3)',
                }}
              >
                <Ionicons name="refresh" size={24} color="#6b7280" />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Script */}
      {showScript && (
        <View
          className="rounded-[32px] p-8"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.9)',
            shadowColor: '#0ea5e9',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 6,
          }}
        >
          <LinearGradient
            colors={['rgba(14, 165, 233, 0.08)', 'rgba(251, 191, 36, 0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 32,
            }}
          />
          <View className="flex-row items-center mb-4">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{
                backgroundColor: 'rgba(14, 165, 233, 0.15)',
              }}
            >
              <Ionicons name="document-text" size={22} color="#0ea5e9" />
            </View>
            <Text className="text-gray-900 text-xl font-black">Podcast Script</Text>
          </View>
          <Text className="text-gray-700 text-base leading-7">{podcast}</Text>
        </View>
      )}
    </View>
  );
}

// Quiz Tab Component
function QuizTab({ quiz, noteContent, noteId }: { quiz?: any[]; noteContent?: string; noteId: string }) {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showFeedback, setShowFeedback] = useState<{ [key: number]: boolean }>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false); // Track if quiz was just completed
  const { updateNote, notes } = useNotesStore();

  // Get current note
  const currentNote = notes.find(n => n.id === noteId);

  const generateMoreQuiz = async () => {
    if (!noteContent || !quiz) return;

    // Check if already at max (10 questions)
    if (quiz.length >= 10) {
      Alert.alert('Maximum Reached', 'You already have 10 questions, which is the maximum allowed.');
      return;
    }

    setIsGeneratingMore(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Calculate how many more questions we can add (max 10 total)
      const questionsToGenerate = Math.min(5, 10 - quiz.length);
      const newQuestions = await generateAdditionalQuiz(noteContent, quiz, questionsToGenerate);

      if (newQuestions && newQuestions.length > 0) {
        // Append new questions to existing quiz, but cap at 10 total
        const updatedQuiz = [...quiz, ...newQuestions].slice(0, 10);
        updateNote(noteId, { quiz: updatedQuiz });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', `Added ${newQuestions.length} new quiz question${newQuestions.length > 1 ? 's' : ''}!`);
      }
    } catch (error) {
      console.error('[Quiz] Generation error:', error);
      Alert.alert('Error', 'Failed to generate more questions. Please try again.');
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const generateQuiz = async () => {
    if (!noteContent) return;

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const prompt = `Based on this content, generate exactly 5 multiple-choice quiz questions. Return ONLY a JSON array of objects with these exact fields:
- "question": the question text
- "options": array of exactly 4 answer options
- "correctAnswer": the index (0-3) of the correct option

Make questions challenging but fair. Ensure all 4 options are plausible.

Content:
${noteContent}

Return format:
[{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}, ...]`;

      const response = await getOpenAITextResponse([
        { role: 'user', content: prompt }
      ]);

      // Parse the JSON response
      let generatedQuiz = [];
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          generatedQuiz = JSON.parse(jsonMatch[0]);
        } else {
          generatedQuiz = JSON.parse(response.content);
        }
      } catch (parseError) {
        console.error('[Quiz] Failed to parse response:', parseError);
        Alert.alert('Error', 'Failed to generate quiz. Please try again.');
        setIsGenerating(false);
        return;
      }

      // Update the note with generated quiz
      updateNote(noteId, { quiz: generatedQuiz });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[Quiz] Generation error:', error);
      Alert.alert('Error', 'Failed to generate quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!quiz || quiz.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16 px-8">
        <AnimatedMascot size={100} isLoading={isGenerating} />
        <Text className="text-gray-900 text-2xl font-black mb-3 mt-6">No Quiz Yet</Text>
        <Text className="text-gray-600 text-base text-center leading-7 mb-8">
          Generate a quiz to test your knowledge
        </Text>

        {/* Generate Button */}
        <Pressable
          onPress={generateQuiz}
          disabled={isGenerating}
          className="active:opacity-80"
          style={{
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 24,
            shadowColor: '#fbbf24',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 24,
            }}
          />
          <View className="flex-row items-center">
            {isGenerating ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white text-base font-black ml-3">
                  Generating...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="white" />
                <Text className="text-white text-base font-black ml-3">
                  Generate Quiz
                </Text>
              </>
            )}
          </View>
        </Pressable>
      </View>
    );
  }

  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    // Don't allow changing answer if feedback is already showing for this question
    if (showFeedback[questionIndex]) {
      return;
    }

    const isCorrect = quiz[questionIndex].correctAnswer === optionIndex;
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setSelectedAnswers({ ...selectedAnswers, [questionIndex]: optionIndex });
    // Show immediate feedback
    setShowFeedback({ ...showFeedback, [questionIndex]: true });
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const handleShowResults = () => {
    // If showing results for the first time, mark as complete
    if (!showResults && allQuestionsAnswered && !quizCompleted) {
      const score = calculateScore();
      const percentageScore = Math.round((score / quiz.length) * 100);

      setQuizCompleted(true);
      console.log(`[Quiz] Completed with ${percentageScore}%!`);
    }

    setShowResults(!showResults);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowHint(false);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowHint(false);
    }
  };

  const currentQuestion = quiz[currentQuestionIndex];
  const allQuestionsAnswered = Object.keys(selectedAnswers).length === quiz.length;
  const currentQuestionAnswered = showFeedback[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = (answeredCount / quiz.length) * 100;

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <View className="flex-1">
      {/* Linear Progress Bar - Glassmorphic */}
      <View className="pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
              }}
            >
              <Text className="text-[#fbbf24] text-base font-black">
                {currentQuestionIndex + 1}
              </Text>
            </View>
            <Text className="text-gray-900 text-base font-bold">
              of {quiz.length} Questions
            </Text>
          </View>
          <View
            className="px-4 py-2 rounded-full"
            style={{
              backgroundColor: 'rgba(14, 165, 233, 0.15)',
              borderWidth: 1.5,
              borderColor: 'rgba(14, 165, 233, 0.3)',
            }}
          >
            <Text className="text-[#0ea5e9] text-sm font-bold">
              {answeredCount}/{quiz.length} Done
            </Text>
          </View>
        </View>
        <View className="h-3 bg-white/70 rounded-full overflow-hidden border-2 border-white"
          style={{
            shadowColor: '#0ea5e9',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <LinearGradient
            colors={['#0ea5e9', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              borderRadius: 999,
            }}
          />
        </View>
      </View>

      {/* Question Display - Stunning Glassmorphic */}
      <View className="flex-1">
        <View
          className="rounded-[32px] p-8 mb-6"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.9)',
            shadowColor: '#fbbf24',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          <LinearGradient
            colors={['rgba(251, 191, 36, 0.12)', 'rgba(14, 165, 233, 0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 32,
            }}
          />
          <View className="flex-row items-center mb-4">
            <View
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.2)',
              }}
            >
              <Text className="text-[#fbbf24] text-xs font-black uppercase tracking-wider">
                Question {currentQuestionIndex + 1}
              </Text>
            </View>
          </View>
          <Text className="text-gray-900 text-xl leading-8 font-bold">
            {currentQuestion.question}
          </Text>
        </View>

        {/* Answer Options with A/B/C/D Labels - Glassmorphic */}
        <View className="space-y-3">
          {currentQuestion.options.map((option: string, oIndex: number) => {
            const isSelected = selectedAnswers[currentQuestionIndex] === oIndex;
            const isCorrect = currentQuestion.correctAnswer === oIndex;
            const showingFeedback = currentQuestionAnswered;

            // Show correct answer in green if feedback is showing
            const shouldShowCorrect = showingFeedback && isCorrect;
            // Show selected wrong answer in red if feedback is showing
            const shouldShowWrong = showingFeedback && isSelected && !isCorrect;

            return (
              <Pressable
                key={oIndex}
                onPress={() => handleSelectAnswer(currentQuestionIndex, oIndex)}
                className="rounded-[24px] mb-3 overflow-hidden active:opacity-80"
                style={{
                  backgroundColor: shouldShowCorrect
                    ? 'rgba(16, 185, 129, 0.15)'
                    : shouldShowWrong
                    ? 'rgba(244, 63, 94, 0.15)'
                    : isSelected && !showingFeedback
                    ? 'rgba(14, 165, 233, 0.15)'
                    : 'rgba(255, 255, 255, 0.6)',
                  borderWidth: 2,
                  borderColor: shouldShowCorrect
                    ? 'rgba(16, 185, 129, 0.4)'
                    : shouldShowWrong
                    ? 'rgba(244, 63, 94, 0.4)'
                    : isSelected && !showingFeedback
                    ? 'rgba(14, 165, 233, 0.4)'
                    : 'rgba(255, 255, 255, 0.8)',
                  shadowColor: shouldShowCorrect
                    ? '#10b981'
                    : shouldShowWrong
                    ? '#f43f5e'
                    : isSelected && !showingFeedback
                    ? '#0ea5e9'
                    : '#6b7280',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center p-5">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                    style={{
                      backgroundColor: shouldShowCorrect
                        ? '#10b981'
                        : shouldShowWrong
                        ? '#f43f5e'
                        : isSelected && !showingFeedback
                        ? '#0ea5e9'
                        : 'rgba(107, 114, 128, 0.1)',
                    }}
                  >
                    <Text className={`font-black text-lg ${
                      shouldShowCorrect || shouldShowWrong || (isSelected && !showingFeedback)
                        ? "text-white"
                        : "text-gray-600"
                    }`}>
                      {optionLabels[oIndex]}
                    </Text>
                  </View>
                  <Text
                    className={`flex-1 text-base leading-6 ${
                      shouldShowCorrect
                        ? "text-emerald-700 font-bold"
                        : shouldShowWrong
                        ? "text-rose-700 font-bold"
                        : isSelected && !showingFeedback
                        ? "text-sky-700 font-bold"
                        : "text-gray-700 font-semibold"
                    }`}
                  >
                    {option}
                  </Text>
                  {shouldShowCorrect && (
                    <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                  )}
                  {shouldShowWrong && (
                    <Ionicons name="close-circle" size={32} color="#f43f5e" />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Hint Section - Glassmorphic */}
        {showHint && !currentQuestionAnswered && (
          <View
            className="mt-6 rounded-[24px] p-6"
            style={{
              backgroundColor: 'rgba(251, 191, 36, 0.15)',
              borderWidth: 2,
              borderColor: 'rgba(251, 191, 36, 0.3)',
              shadowColor: '#fbbf24',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <View className="flex-row items-center mb-3">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                style={{
                  backgroundColor: 'rgba(251, 191, 36, 0.3)',
                }}
              >
                <Ionicons name="bulb" size={24} color="#fbbf24" />
              </View>
              <Text className="text-[#fbbf24] font-black text-lg">Hint</Text>
            </View>
            <Text className="text-gray-700 text-base leading-6 font-medium">
              Think carefully about the key concepts related to this question.
            </Text>
          </View>
        )}

        {/* Results Section - Glassmorphic */}
        {showResults && (
          <View
            className="mt-6 rounded-[32px] p-8"
            style={{
              shadowColor: '#0ea5e9',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={['#0ea5e9', '#06b6d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 32,
              }}
            />
            <View className="items-center">
              <Ionicons name="trophy" size={56} color="white" style={{ marginBottom: 12 }} />
              <Text className="text-white text-4xl font-black text-center mb-2">
                {calculateScore()}/{quiz.length}
              </Text>
              <Text className="text-white text-2xl font-bold text-center mb-3">
                {Math.round((calculateScore() / quiz.length) * 100)}%
              </Text>
              <Text className="text-white/95 text-center text-lg font-bold mb-4">
                {calculateScore() === quiz.length
                  ? "Perfect! You got them all right!"
                  : calculateScore() >= quiz.length * 0.7
                  ? "Great job! Keep it up!"
                  : "Good effort! Review and try again."}
              </Text>
            </View>
          </View>
        )}

        {/* Generate More Questions Button - Only show when at last question and under 10 questions */}
        {currentQuestionIndex === quiz.length - 1 && quiz.length < 10 && (
          <Pressable
            onPress={generateMoreQuiz}
            disabled={isGeneratingMore}
            className="mt-6 active:opacity-80"
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderRadius: 20,
              shadowColor: '#10b981',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 20,
              }}
            />
            <View className="flex-row items-center justify-center">
              {isGeneratingMore ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white text-base font-black ml-3">
                    Generating...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle" size={22} color="white" />
                  <Text className="text-white text-base font-black ml-3">
                    Generate {Math.min(5, 10 - quiz.length)} More Question{Math.min(5, 10 - quiz.length) > 1 ? 's' : ''}
                  </Text>
                </>
              )}
            </View>
          </Pressable>
        )}
      </View>

      {/* Bottom Navigation - Glassmorphic */}
      <View
        className="pt-5 pb-3"
        style={{
          borderTopWidth: 1.5,
          borderTopColor: 'rgba(255, 255, 255, 0.9)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          shadowColor: '#0ea5e9',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <View className="flex-row items-center justify-between px-1">
          {/* Previous Button */}
          <Pressable
            onPress={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="rounded-2xl active:opacity-70"
            style={{
              backgroundColor: currentQuestionIndex === 0
                ? 'rgba(107, 114, 128, 0.1)'
                : 'rgba(255, 255, 255, 0.8)',
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderWidth: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={currentQuestionIndex === 0 ? "#d1d5db" : "#6b7280"}
            />
          </Pressable>

          {/* Center Actions */}
          <View className="flex-row items-center gap-3">
            {/* Hint Button - Show only before answering */}
            {!currentQuestionAnswered && (
              <Pressable
                onPress={() => setShowHint(!showHint)}
                className="flex-row items-center rounded-2xl active:opacity-80"
                style={{
                  backgroundColor: 'rgba(251, 191, 36, 0.15)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(251, 191, 36, 0.3)',
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                }}
              >
                <Ionicons name="bulb-outline" size={22} color="#fbbf24" />
                <Text className="text-[#fbbf24] ml-2 font-black">Hint</Text>
              </Pressable>
            )}

            {/* Next Button - Show after answering current question if not last */}
            {currentQuestionAnswered && currentQuestionIndex < quiz.length - 1 && (
              <Pressable
                onPress={goToNextQuestion}
                className="flex-row items-center rounded-2xl active:opacity-80"
                style={{
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  shadowColor: '#0ea5e9',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={['#0ea5e9', '#06b6d4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 16,
                  }}
                />
                <Text className="text-white mr-2 font-black text-base">Next</Text>
                <Ionicons name="arrow-forward" size={22} color="#ffffff" />
              </Pressable>
            )}

            {/* Show Results Button - Show when all questions answered */}
            {allQuestionsAnswered && (
              <Pressable
                onPress={handleShowResults}
                className="flex-row items-center rounded-2xl active:opacity-80"
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  shadowColor: '#0ea5e9',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={['#0ea5e9', '#06b6d4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 16,
                  }}
                />
                <Ionicons name="trophy" size={22} color="#ffffff" />
                <Text className="text-white ml-2 font-black">
                  {showResults ? "Hide" : "Results"}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Next Button */}
          <Pressable
            onPress={goToNextQuestion}
            disabled={currentQuestionIndex === quiz.length - 1}
            className="rounded-2xl active:opacity-70"
            style={{
              backgroundColor: currentQuestionIndex === quiz.length - 1
                ? 'rgba(107, 114, 128, 0.1)'
                : 'rgba(255, 255, 255, 0.8)',
              paddingHorizontal: 20,
              paddingVertical: 14,
              borderWidth: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={currentQuestionIndex === quiz.length - 1 ? "#d1d5db" : "#6b7280"}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// Flashcards Tab Component
function FlashcardsTab({ flashcards, noteContent, noteId }: { flashcards?: any[]; noteContent?: string; noteId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [cardsStudied, setCardsStudied] = useState(0);
  const { updateNote } = useNotesStore();

  const generateMoreFlashcards = async () => {
    if (!noteContent || !flashcards) return;

    // Check if already at max (10 flashcards)
    if (flashcards.length >= 10) {
      Alert.alert('Maximum Reached', 'You already have 10 flashcards, which is the maximum allowed.');
      return;
    }

    setIsGeneratingMore(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Calculate how many more flashcards we can add (max 10 total)
      const flashcardsToGenerate = Math.min(5, 10 - flashcards.length);
      const newFlashcards = await generateAdditionalFlashcards(noteContent, flashcards, flashcardsToGenerate);

      if (newFlashcards && newFlashcards.length > 0) {
        // Append new flashcards to existing ones, but cap at 10 total
        const updatedFlashcards = [...flashcards, ...newFlashcards].slice(0, 10);
        updateNote(noteId, { flashcards: updatedFlashcards });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', `Added ${newFlashcards.length} new flashcard${newFlashcards.length > 1 ? 's' : ''}!`);
      }
    } catch (error) {
      console.error('[Flashcards] Generation error:', error);
      Alert.alert('Error', 'Failed to generate more flashcards. Please try again.');
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const generateFlashcards = async () => {
    if (!noteContent) return;

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const prompt = `Based on this content, generate exactly 5 flashcards for studying. Return ONLY a JSON array of objects with "front" (question) and "back" (answer) fields. Keep questions clear and concise. Keep answers brief but complete.

Content:
${noteContent}

Return format:
[{"front": "question text", "back": "answer text"}, ...]`;

      const response = await getOpenAITextResponse([
        { role: 'user', content: prompt }
      ]);

      // Parse the JSON response
      let generatedFlashcards = [];
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          generatedFlashcards = JSON.parse(jsonMatch[0]);
        } else {
          generatedFlashcards = JSON.parse(response.content);
        }
      } catch (parseError) {
        console.error('[Flashcards] Failed to parse response:', parseError);
        Alert.alert('Error', 'Failed to generate flashcards. Please try again.');
        setIsGenerating(false);
        return;
      }

      // Update the note with generated flashcards
      updateNote(noteId, { flashcards: generatedFlashcards });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('[Flashcards] Generation error:', error);
      Alert.alert('Error', 'Failed to generate flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!flashcards || flashcards.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16 px-8">
        <AnimatedMascot size={100} isLoading={isGenerating} />
        <Text className="text-gray-900 text-2xl font-black mb-3 mt-6">No Flashcards Yet</Text>
        <Text className="text-gray-600 text-base text-center leading-7 mb-8">
          Generate flashcards to study your notes
        </Text>

        {/* Generate Button */}
        <Pressable
          onPress={generateFlashcards}
          disabled={isGenerating}
          className="active:opacity-80"
          style={{
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 24,
            shadowColor: '#fbbf24',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 24,
            }}
          />
          <View className="flex-row items-center">
            {isGenerating ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white text-base font-black ml-3">
                  Generating...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="white" />
                <Text className="text-white text-base font-black ml-3">
                  Generate Flashcards
                </Text>
              </>
            )}
          </View>
        </Pressable>
      </View>
    );
  }

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFlipped(!isFlipped);

    // Start session on first interaction
    if (!sessionStarted) {
      setSessionStarted(true);
    }

    // Count this card as studied if flipping to see answer
    if (!isFlipped) {
      setCardsStudied(prev => prev + 1);
    }
  };

  return (
    <View>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <View
          className="rounded-[24px] px-6 py-4"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.8)',
            shadowColor: '#fbbf24',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <LinearGradient
            colors={['rgba(251, 191, 36, 0.1)', 'rgba(14, 165, 233, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 24,
            }}
          />
          <View className="flex-row items-center">
            <Ionicons name="card" size={24} color="#fbbf24" />
            <Text className="text-gray-900 text-xl font-black ml-3">Flashcards</Text>
          </View>
        </View>
        <View
          className="px-5 py-3 rounded-full"
          style={{
            backgroundColor: 'rgba(14, 165, 233, 0.15)',
            borderWidth: 1.5,
            borderColor: 'rgba(14, 165, 233, 0.3)',
          }}
        >
          <Text className="text-[#0ea5e9] text-sm font-bold">
            {currentIndex + 1} / {flashcards.length}
          </Text>
        </View>
      </View>

      {/* Flashcard - Glassmorphic */}
      <Pressable
        onPress={handleFlip}
        className="rounded-[32px] p-10 mb-6 active:opacity-90"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderWidth: 1.5,
          borderColor: 'rgba(255, 255, 255, 0.9)',
          minHeight: 360,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: isFlipped ? '#0ea5e9' : '#fbbf24',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.2,
          shadowRadius: 32,
          elevation: 10,
        }}
      >
        <LinearGradient
          colors={
            isFlipped
              ? ['rgba(14, 165, 233, 0.12)', 'rgba(251, 191, 36, 0.12)']
              : ['rgba(251, 191, 36, 0.12)', 'rgba(14, 165, 233, 0.12)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 32,
          }}
        />
        <View
          className="px-5 py-2 rounded-full mb-6"
          style={{
            backgroundColor: isFlipped
              ? 'rgba(14, 165, 233, 0.2)'
              : 'rgba(251, 191, 36, 0.2)',
          }}
        >
          <Text
            className="text-xs font-black tracking-wider uppercase"
            style={{
              color: isFlipped ? '#0ea5e9' : '#fbbf24',
            }}
          >
            {isFlipped ? "ANSWER" : "QUESTION"}
          </Text>
        </View>
        <Text className="text-gray-900 text-2xl text-center leading-9 font-bold">
          {isFlipped ? currentCard.back : currentCard.front}
        </Text>
        <View className="mt-8 flex-row items-center">
          <Ionicons name="hand-left-outline" size={20} color="#9ca3af" />
          <Text className="text-gray-400 text-sm ml-2 font-medium">
            Tap to flip
          </Text>
        </View>
      </Pressable>

      {/* Navigation Buttons */}
      <View className="flex-row justify-between gap-4">
        <Pressable
          onPress={handlePrev}
          className="flex-1 py-5 rounded-[24px] items-center active:opacity-80"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 2,
            borderColor: 'rgba(14, 165, 233, 0.3)',
            shadowColor: '#0ea5e9',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <Ionicons name="chevron-back" size={32} color="#0ea5e9" />
        </Pressable>
        <Pressable
          onPress={handleNext}
          className="flex-1 py-5 rounded-[24px] items-center active:opacity-80"
          style={{
            shadowColor: '#0ea5e9',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          <LinearGradient
            colors={['#0ea5e9', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 24,
            }}
          />
          <Ionicons name="chevron-forward" size={32} color="white" />
        </Pressable>
      </View>

      {/* Generate More Flashcards Button - Only show when at last flashcard and under 10 flashcards */}
      {currentIndex === flashcards.length - 1 && flashcards.length < 10 && (
        <Pressable
          onPress={generateMoreFlashcards}
          disabled={isGeneratingMore}
          className="mt-6 active:opacity-80"
          style={{
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderRadius: 20,
            shadowColor: '#10b981',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 20,
            }}
          />
          <View className="flex-row items-center justify-center">
            {isGeneratingMore ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white text-base font-black ml-3">
                  Generating...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="add-circle" size={22} color="white" />
                <Text className="text-white text-base font-black ml-3">
                  Generate {Math.min(5, 10 - flashcards.length)} More Flashcard{Math.min(5, 10 - flashcards.length) > 1 ? 's' : ''}
                </Text>
              </>
            )}
          </View>
        </Pressable>
      )}
    </View>
  );
}

// Transcript Tab Component
const TranscriptTab = React.memo(({ transcript }: { transcript?: string }) => {
  if (!transcript) {
    return (
      <View className="flex-1 items-center justify-center py-16 px-8">
        <AnimatedMascot size={100} />
        <Text className="text-gray-900 text-2xl font-black mb-3 mt-6">No Transcript Yet</Text>
        <Text className="text-gray-600 text-base text-center leading-7">
          Upload audio to generate a transcript
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Header */}
      <View
        className="flex-row items-center mb-6 rounded-[24px] px-6 py-4"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          borderWidth: 1.5,
          borderColor: 'rgba(255, 255, 255, 0.8)',
          shadowColor: '#0ea5e9',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 4,
        }}
      >
        <LinearGradient
          colors={['rgba(14, 165, 233, 0.1)', 'rgba(251, 191, 36, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 24,
          }}
        />
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{
            backgroundColor: 'rgba(14, 165, 233, 0.15)',
          }}
        >
          <Ionicons name="document-text" size={22} color="#0ea5e9" />
        </View>
        <Text className="text-gray-900 text-xl font-black">Transcript</Text>
      </View>

      {/* Transcript Content - Glassmorphic */}
      <View
        className="rounded-[32px] p-8"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderWidth: 1.5,
          borderColor: 'rgba(255, 255, 255, 0.9)',
          shadowColor: '#0ea5e9',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 6,
        }}
      >
        <LinearGradient
          colors={['rgba(14, 165, 233, 0.08)', 'rgba(251, 191, 36, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 32,
          }}
        />
        <Text className="text-gray-700 text-base leading-7">{transcript}</Text>
      </View>
    </View>
  );
});

// Chat Tab Component
function ChatTab({ note }: { note: any }) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRoastMode, setIsRoastMode] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Initialize chat with system context about the note
  useEffect(() => {
    const helpfulPrompt = `You are a helpful AI assistant helping the user understand their notes. Here is the context:

Title: ${note.title}

${note.summary ? `Summary: ${note.summary}\n\n` : ""}${note.content ? `Content: ${note.content}\n\n` : ""}${note.keyPoints && note.keyPoints.length > 0 ? `Key Points:\n${note.keyPoints.map((p: string) => `- ${p}`).join("\n")}\n\n` : ""}${note.transcript ? `Transcript: ${note.transcript}\n\n` : ""}
Answer questions about this content, provide clarifications, and help the user learn.`;

    const roastPrompt = `You are a brutally honest, sarcastic AI tutor with ZERO patience for laziness. Here is the context of the user's notes:

Title: ${note.title}

${note.summary ? `Summary: ${note.summary}\n\n` : ""}${note.content ? `Content: ${note.content}\n\n` : ""}${note.keyPoints && note.keyPoints.length > 0 ? `Key Points:\n${note.keyPoints.map((p: string) => `- ${p}`).join("\n")}\n\n` : ""}${note.transcript ? `Transcript: ${note.transcript}\n\n` : ""}

Your personality:
- Be sarcastic and sassy, but ultimately helpful
- Call out obvious questions that could be answered by reading the notes
- Mock procrastination and laziness with dark humor
- Use emojis like 🙄😤💀🔥
- Keep responses witty but educational
- Use phrases like "Did you even read this?", "Bold of you to assume...", "Let me spell it out for you..."
- NO actual profanity, but be hilariously blunt
- If they ask something thoughtful, grudgingly admit it's a good question

Remember: Be savage but safe for App Store. Roast their study habits, not their intelligence.`;

    const systemMessage: AIMessage = {
      role: "system",
      content: isRoastMode ? roastPrompt : helpfulPrompt,
    };
    setMessages([systemMessage]);
  }, [note, isRoastMode]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: AIMessage = {
      role: "user",
      content: inputText.trim(),
    };

    // Add user message to chat
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Get AI response
      const response = await getOpenAITextResponse(updatedMessages, {
        temperature: 0.7,
        maxTokens: 1000,
      });

      const assistantMessage: AIMessage = {
        role: "assistant",
        content: response.content,
      };

      setMessages([...updatedMessages, assistantMessage]);

      // Scroll to bottom after AI response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error("Error getting AI response:", error);

      if (error.message?.includes("API key") || error.message?.includes("Unauthorized")) {
        Alert.alert(
          "API Key Required",
          "Please add your OpenAI API key in the ENV tab of the Vibecode app to use the chat feature.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to get AI response. Please try again.",
          [{ text: "OK" }]
        );
      }

      // Remove the user message if API call failed
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const displayMessages = messages.filter((m) => m.role !== "system");

  return (
    <View className="flex-1">
      {/* Header - Glassmorphic with Roast Mode Toggle */}
      <View className="px-5 pb-5 -mx-5">
        <View
          className="flex-row items-center rounded-[24px] px-6 py-4"
          style={{
            backgroundColor: isRoastMode
              ? 'rgba(251, 191, 36, 0.15)'
              : 'rgba(255, 255, 255, 0.6)',
            borderWidth: 1.5,
            borderColor: isRoastMode
              ? 'rgba(251, 191, 36, 0.4)'
              : 'rgba(255, 255, 255, 0.8)',
            shadowColor: isRoastMode ? '#fbbf24' : '#0ea5e9',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
            <LinearGradient
              colors={isRoastMode
                ? ['rgba(251, 191, 36, 0.2)', 'rgba(239, 68, 68, 0.1)']
                : ['rgba(14, 165, 233, 0.1)', 'rgba(251, 191, 36, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 24,
              }}
            />
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
              style={{
                backgroundColor: isRoastMode
                  ? 'rgba(251, 191, 36, 0.25)'
                  : 'rgba(14, 165, 233, 0.15)',
              }}
            >
              <Ionicons
                name={isRoastMode ? "flame" : "sparkles"}
                size={26}
                color={isRoastMode ? "#fbbf24" : "#0ea5e9"}
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 text-xl font-black">
                {isRoastMode ? "Roast Mode 🔥" : "Chat"}
              </Text>
              <Text className="text-gray-600 text-xs mt-0.5 font-medium">
                {isRoastMode
                  ? "Brutal honesty mode"
                  : "Ask anything"}
              </Text>
            </View>

            {/* Roast Mode Toggle */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsRoastMode(!isRoastMode);
              }}
              className="ml-2 active:opacity-70"
              style={{
                backgroundColor: isRoastMode ? '#fbbf24' : 'rgba(107, 114, 128, 0.2)',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                shadowColor: isRoastMode ? '#fbbf24' : '#6b7280',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isRoastMode ? 0.3 : 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={isRoastMode ? "flame" : "flame-outline"}
                  size={18}
                  color={isRoastMode ? "white" : "#6b7280"}
                />
                <Text
                  className="ml-2 text-xs font-black"
                  style={{
                    color: isRoastMode ? "white" : "#6b7280"
                  }}
                >
                  {isRoastMode ? "ON" : "OFF"}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {displayMessages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8 pb-20">
            <AnimatedMascot size={100} />
            <Text className="text-gray-900 text-2xl font-black mb-3 mt-6 text-center">
              {isRoastMode ? "Ready to get roasted? 🔥" : "Ask me anything"}
            </Text>
            <Text className="text-gray-600 text-base text-center leading-6 mb-10">
              {isRoastMode
                ? "Prepare for brutal honesty"
                : "I know your notes"}
            </Text>

            {/* Suggested Questions - Glassmorphic */}
            <View className="w-full space-y-3">
              {isRoastMode ? (
                <>
                  <Pressable
                    onPress={() => setInputText("Can you summarize the key points?")}
                    className="rounded-[20px] p-5 active:opacity-80"
                    style={{
                      backgroundColor: 'rgba(251, 191, 36, 0.15)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(251, 191, 36, 0.3)',
                      shadowColor: '#fbbf24',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.12,
                      shadowRadius: 12,
                      elevation: 3,
                    }}
                  >
                    <Text className="text-gray-700 text-sm font-bold">
                      🙄 Summarize this
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setInputText("Quiz me on this content")}
                    className="rounded-[20px] p-5 active:opacity-80"
                    style={{
                      backgroundColor: 'rgba(251, 191, 36, 0.15)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(251, 191, 36, 0.3)',
                      shadowColor: '#fbbf24',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.12,
                      shadowRadius: 12,
                      elevation: 3,
                    }}
                  >
                    <Text className="text-gray-700 text-sm font-bold">
                      💀 Quiz me
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setInputText("What should I focus on?")}
                    className="rounded-[20px] p-5 active:opacity-80"
                    style={{
                      backgroundColor: 'rgba(251, 191, 36, 0.15)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(251, 191, 36, 0.3)',
                      shadowColor: '#fbbf24',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.12,
                      shadowRadius: 12,
                      elevation: 3,
                    }}
                  >
                    <Text className="text-gray-700 text-sm font-bold">
                      😤 What should I focus on?
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => setInputText("Can you summarize the key points?")}
                    className="rounded-[20px] p-5 active:opacity-80"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(255, 255, 255, 0.9)',
                      shadowColor: '#0ea5e9',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.08,
                      shadowRadius: 12,
                      elevation: 3,
                    }}
                  >
                    <Text className="text-gray-700 text-sm font-bold">
                      💡 Summarize key points
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setInputText("Quiz me on this content")}
                    className="rounded-[20px] p-5 active:opacity-80"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(255, 255, 255, 0.9)',
                      shadowColor: '#0ea5e9',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.08,
                      shadowRadius: 12,
                      elevation: 3,
                    }}
                  >
                    <Text className="text-gray-700 text-sm font-bold">
                      🎯 Quiz me
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setInputText("Explain this in simpler terms")}
                    className="rounded-[20px] p-5 active:opacity-80"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(255, 255, 255, 0.9)',
                      shadowColor: '#0ea5e9',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.08,
                      shadowRadius: 12,
                      elevation: 3,
                    }}
                  >
                    <Text className="text-gray-700 text-sm font-bold">
                      📚 Explain simpler
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-5 -mx-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 20 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {displayMessages.map((message, index) => (
              <View
                key={index}
                className={`mb-4 ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {message.role === "assistant" && (
                  <View className="flex-row items-center mb-2">
                    <View
                      className="w-7 h-7 rounded-lg items-center justify-center mr-2"
                      style={{
                        backgroundColor: isRoastMode
                          ? 'rgba(251, 191, 36, 0.2)'
                          : 'rgba(14, 165, 233, 0.15)',
                      }}
                    >
                      <Ionicons
                        name={isRoastMode ? "flame" : "sparkles"}
                        size={14}
                        color={isRoastMode ? "#fbbf24" : "#0ea5e9"}
                      />
                    </View>
                    <Text className="text-gray-600 text-xs font-bold">
                      {isRoastMode ? "Roast Mode" : "AI Assistant"}
                    </Text>
                  </View>
                )}
                <View
                  className={`max-w-[85%] px-5 py-4 ${
                    message.role === "user"
                      ? "rounded-[24px] rounded-tr-md"
                      : "rounded-[24px] rounded-tl-md"
                  }`}
                  style={message.role === "user" ? {
                    shadowColor: '#0ea5e9',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                    elevation: 4,
                  } : {
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderWidth: 1.5,
                    borderColor: 'rgba(255, 255, 255, 0.9)',
                    shadowColor: '#0ea5e9',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  {message.role === "user" && (
                    <LinearGradient
                      colors={['#0ea5e9', '#06b6d4']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: 24,
                      }}
                    />
                  )}
                  <Text
                    className={`text-base leading-7 ${
                      message.role === "user" ? "text-white font-semibold" : "text-gray-800 font-medium"
                    }`}
                  >
                    {message.content}
                  </Text>
                </View>
              </View>
            ))}
            {isLoading && (
              <View className="items-start mb-4">
                <View className="flex-row items-center mb-2">
                  <View
                    className="w-7 h-7 rounded-lg items-center justify-center mr-2"
                    style={{
                      backgroundColor: isRoastMode
                        ? 'rgba(251, 191, 36, 0.2)'
                        : 'rgba(14, 165, 233, 0.15)',
                    }}
                  >
                    <Ionicons
                      name={isRoastMode ? "flame" : "sparkles"}
                      size={14}
                      color={isRoastMode ? "#fbbf24" : "#0ea5e9"}
                    />
                  </View>
                  <Text className="text-gray-600 text-xs font-bold">
                    {isRoastMode ? "Roast Mode" : "AI Assistant"}
                  </Text>
                </View>
                <View
                  className="rounded-[24px] rounded-tl-md px-6 py-4"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderWidth: 1.5,
                    borderColor: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  <View className="flex-row items-center space-x-1.5">
                    <View className="w-2.5 h-2.5 bg-sky-400 rounded-full" style={{ opacity: 0.4 }} />
                    <View className="w-2.5 h-2.5 bg-sky-400 rounded-full" style={{ opacity: 0.6 }} />
                    <View className="w-2.5 h-2.5 bg-sky-400 rounded-full" style={{ opacity: 0.8 }} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Input Area - Glassmorphic - STICKY AT BOTTOM */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View
            style={{
              paddingTop: 20,
              paddingBottom: Math.max(insets.bottom + 5, 15),
              paddingHorizontal: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              shadowColor: '#0ea5e9',
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
              marginHorizontal: -20,
            }}
          >
          <View
            className="flex-row items-end rounded-[24px] px-5 py-2"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderWidth: 1.5,
              borderColor: 'rgba(14, 165, 233, 0.2)',
            }}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your question..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={500}
              editable={!isLoading}
              returnKeyType="send"
              blurOnSubmit={false}
              style={{
                flex: 1,
                fontSize: 16,
                paddingVertical: 10,
                maxHeight: 96,
                fontWeight: '500',
                color: '#111827',
              }}
            />
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              className="ml-2 w-11 h-11 rounded-full items-center justify-center"
              style={inputText.trim() && !isLoading ? {
                shadowColor: '#0ea5e9',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              } : {
                backgroundColor: '#d1d5db'
              }}
            >
              {inputText.trim() && !isLoading && (
                <LinearGradient
                  colors={['#0ea5e9', '#06b6d4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 999,
                  }}
                />
              )}
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() && !isLoading ? "white" : "#9ca3af"}
              />
            </Pressable>
          </View>
          {inputText.length > 400 && (
            <Text className="text-gray-400 text-xs mt-2 text-right font-medium">
              {inputText.length}/500 characters
            </Text>
          )}
          </View>
        </KeyboardAvoidingView>
    </View>
  );
}
