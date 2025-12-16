import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  Modal,
  Alert,
  PanResponder,
  Animated,
  ScrollView,
  Image,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNotesStore, Note } from "../state/notesStore";
import { useOnboardingStore } from "../state/onboardingStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { EncodingType } from "expo-file-system";
import { captureRef } from "react-native-view-shot";
import * as Haptics from "expo-haptics";

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();

  // Get store values with individual selectors to prevent re-render loops
  const selectedFilter = useNotesStore((state) => state.selectedFilter);
  const selectedFolderId = useNotesStore((state) => state.selectedFolderId);
  const allNotes = useNotesStore((state) => state.notes);
  const folders = useNotesStore((state) => state.folders);
  const setFilter = useNotesStore((state) => state.setFilter);
  const addFolder = useNotesStore((state) => state.addFolder);
  const deleteFolder = useNotesStore((state) => state.deleteFolder);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const updateNote = useNotesStore((state) => state.updateNote);
  const addNote = useNotesStore((state) => state.addNote);
  const togglePinNote = useNotesStore((state) => state.togglePinNote);

  // State declarations
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [contentModalVisible, setContentModalVisible] = useState(false);
  const [noteMenuVisible, setNoteMenuVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [folderPickerVisible, setFolderPickerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");


  // Initialize sample note with rich content if no notes exist
  useEffect(() => {
    // Find existing Welcome note
    const welcomeNote = allNotes.find(note => note.title === "Welcome to NoteBoost");

    if (welcomeNote) {
      // Update existing Welcome note to remove markdown formatting
      updateNote(welcomeNote.id, {
        content: "Your personal AI-powered study companion",
        summary: "Welcome to NoteBoost! This is your personal AI-powered study companion. You can create beautiful, organized notes and transform any content into study materials that help you learn and retain information better.",
        keyPoints: [
          "🌟 Core Features of NoteBoost",
          "Audio Recording: Transform your voice into organized notes with AI-powered transcription and analysis",
          "YouTube Integration: Extract key insights from any YouTube video automatically",
          "Document Upload: Upload PDFs and documents to generate comprehensive study materials",
          "When you use NoteBoost, you're not just taking notes. You're building a knowledge system that helps you learn and retain information better.",
          "🎯 Powerful Study Tools",
          "AI Summaries: Get concise summaries of your audio, videos, and documents instantly",
          "Smart Flashcards: Automatically generate flashcards for effective studying and memorization",
          "Interactive Quiz: Test your knowledge with AI-generated quizzes based on your content",
          "Podcast Mode: Convert your notes into engaging podcast-style audio conversations",
          "Feynman Technique: Master concepts by explaining them in simple terms",
          "The best way to predict the future is to invent it. Alan Kay",
        ],
        table: {
          headers: ["Study Mode", "What It Does"],
          rows: [
            {
              col1: "Quiz",
              col2: "Test yourself with multiple choice questions generated from your notes"
            },
            {
              col1: "Flashcards",
              col2: "Review key concepts with spaced repetition for better retention"
            },
            {
              col1: "Podcast",
              col2: "Listen to your notes as natural conversations between two voices"
            },
            {
              col1: "Feynman",
              col2: "Deepen understanding by teaching concepts in your own simple words"
            }
          ]
        }
      });
    } else if (allNotes.length === 0) {
      // Create new Welcome note if no notes exist
      addNote({
        title: "Welcome to NoteBoost",
        content: "Your personal AI-powered study companion",
        folderId: null,
        sourceType: "document",
        summary: "Welcome to NoteBoost! This is your personal AI-powered study companion. You can create beautiful, organized notes and transform any content into study materials that help you learn and retain information better.",
        keyPoints: [
          "🌟 Core Features of NoteBoost",
          "Audio Recording: Transform your voice into organized notes with AI-powered transcription and analysis",
          "YouTube Integration: Extract key insights from any YouTube video automatically",
          "Document Upload: Upload PDFs and documents to generate comprehensive study materials",
          "When you use NoteBoost, you're not just taking notes. You're building a knowledge system that helps you learn and retain information better.",
          "🎯 Powerful Study Tools",
          "AI Summaries: Get concise summaries of your audio, videos, and documents instantly",
          "Smart Flashcards: Automatically generate flashcards for effective studying and memorization",
          "Interactive Quiz: Test your knowledge with AI-generated quizzes based on your content",
          "Podcast Mode: Convert your notes into engaging podcast-style audio conversations",
          "Feynman Technique: Master concepts by explaining them in simple terms",
          "The best way to predict the future is to invent it. Alan Kay",
        ],
        table: {
          headers: ["Study Mode", "What It Does"],
          rows: [
            {
              col1: "Quiz",
              col2: "Test yourself with multiple choice questions generated from your notes"
            },
            {
              col1: "Flashcards",
              col2: "Review key concepts with spaced repetition for better retention"
            },
            {
              col1: "Podcast",
              col2: "Listen to your notes as natural conversations between two voices"
            },
            {
              col1: "Feynman",
              col2: "Deepen understanding by teaching concepts in your own simple words"
            }
          ]
        }
      });
    }
  }, []);

  // Memoize filtered notes to prevent recalculation on every render
  const notes = useMemo(() => {
    let filtered = allNotes;

    // Filter by folder
    if (selectedFilter === "folder" && selectedFolderId) {
      filtered = filtered.filter((note) => note.folderId === selectedFolderId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((note) => {
        const title = note.title?.toLowerCase() || "";
        const content = note.content?.toLowerCase() || "";
        const summary = note.summary?.toLowerCase() || "";
        const keyPoints = note.keyPoints?.join(" ").toLowerCase() || "";
        const tags = (note.tags || []).join(" ").toLowerCase();

        return title.includes(query) || content.includes(query) || summary.includes(query) || keyPoints.includes(query) || tags.includes(query);
      });
    }

    // Sort: pinned notes first, then by updatedAt
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [selectedFilter, selectedFolderId, allNotes, searchQuery]);

  // Animated value for swipe-to-close
  const translateY = useRef(new Animated.Value(0)).current;

  // PanResponder for swipe down gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only activate for downward swipes starting from near the top
        return Math.abs(gestureState.dx) < 10 && gestureState.dy > 10;
      },
      onPanResponderGrant: () => {
        translateY.setOffset(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward movement
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();

        // Close if swiped down more than 150px or with significant velocity
        if (gestureState.dy > 150 || gestureState.vy > 0.8) {
          Animated.timing(translateY, {
            toValue: 600,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            setContentModalVisible(false);
            translateY.setValue(0);
          });
        } else {
          // Snap back to original position
          Animated.spring(translateY, {
            toValue: 0,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // Reset if gesture is interrupted
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleNotePress = useCallback((note: Note) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("NoteEditor", { noteId: note.id });
  }, [navigation]);

  const handleAddFolder = useCallback(() => {
    if (newFolderName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addFolder(newFolderName.trim());
      setNewFolderName("");
      setFolderModalVisible(false);
      // Reset filter to "all" so user can see all their notes
      setFilter("all");
    }
  }, [newFolderName, addFolder, setFilter]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
    return `${month} ${day}${suffix}`;
  };

  const getNoteEmoji = (note: Note): string => {
    const title = note.title?.toLowerCase() || "";
    const sourceType = note.sourceType;

    // Default emojis based on source
    const sourceEmojis = {
      audio: "🎙️",
      youtube: "🎬",
      document: "📄",
      screenshot: "📸",
    };

    // Topic-based emojis - check title for keywords
    const topicEmojis: { [key: string]: string } = {
      // Sciences
      "biology": "🧬", "bio": "🧬", "cell": "🧬", "dna": "🧬", "genetics": "🧬", "organism": "🧬",
      "chemistry": "⚗️", "chem": "⚗️", "molecule": "⚗️", "reaction": "⚗️", "chemical": "⚗️",
      "physics": "⚛️", "quantum": "⚛️", "mechanics": "⚛️", "force": "⚛️", "energy": "⚛️",
      "science": "🔬", "lab": "🔬", "experiment": "🔬", "research": "🔬",
      "math": "🔢", "algebra": "🔢", "calculus": "🔢", "geometry": "📐", "statistics": "📊", "equation": "🔢",
      "astronomy": "🌌", "space": "🚀", "planet": "🪐", "star": "⭐",

      // Humanities
      "history": "📜", "historical": "📜", "ancient": "📜", "medieval": "🏰", "war": "⚔️",
      "literature": "📚", "book": "📖", "novel": "📖", "poetry": "✍️", "writing": "✍️",
      "language": "🗣️", "english": "🇬🇧", "spanish": "🇪🇸", "french": "🇫🇷", "grammar": "📝",
      "philosophy": "💭", "ethics": "💭", "logic": "🧩", "thought": "💭",
      "psychology": "🧠", "psych": "🧠", "behavior": "🧠", "mental": "🧠", "cognitive": "🧠",

      // Technology & Computing
      "programming": "💻", "code": "💻", "software": "💻", "developer": "💻", "coding": "💻",
      "computer": "🖥️", "computing": "🖥️", "hardware": "🖥️", "tech": "⚙️",
      "web": "🌐", "internet": "🌐", "online": "🌐", "website": "🌐",
      "data": "📊", "database": "🗄️", "analytics": "📊", "big data": "📊",
      "ai": "🤖", "machine learning": "🤖", "artificial intelligence": "🤖", "neural": "🧠",
      "cybersecurity": "🔒", "security": "🔐", "encryption": "🔑",

      // Business & Economics
      "business": "💼", "management": "💼", "corporate": "💼", "company": "🏢",
      "economics": "💰", "finance": "💵", "money": "💵", "trading": "📈", "investment": "💹",
      "marketing": "📢", "sales": "💰", "advertising": "📺", "brand": "🏷️",
      "entrepreneur": "🚀", "startup": "🚀", "innovation": "💡",

      // Arts & Music
      "art": "🎨", "paint": "🖌️", "design": "🎨", "creative": "✨", "drawing": "✏️",
      "music": "🎵", "song": "🎶", "concert": "🎤", "instrument": "🎸", "guitar": "🎸", "piano": "🎹",
      "film": "🎬", "movie": "🎥", "cinema": "🎬", "video": "📹",
      "photography": "📸", "photo": "📸", "camera": "📷",

      // Health & Fitness
      "health": "🏥", "medical": "⚕️", "medicine": "💊", "doctor": "👨‍⚕️", "hospital": "🏥",
      "fitness": "💪", "workout": "🏋️", "exercise": "🏃", "gym": "🏋️", "training": "💪",
      "nutrition": "🥗", "diet": "🥗", "food": "🍽️", "cooking": "👨‍🍳", "recipe": "📝",
      "yoga": "🧘", "meditation": "🧘", "wellness": "🌟",

      // Nature & Environment
      "environment": "🌍", "climate": "🌡️", "earth": "🌍", "ecology": "♻️",
      "nature": "🌿", "plant": "🌱", "botany": "🌿", "tree": "🌳", "forest": "🌲",
      "animal": "🐾", "zoo": "🦁", "wildlife": "🦌", "bird": "🐦",
      "ocean": "🌊", "marine": "🐠", "sea": "🌊", "fish": "🐟", "water": "💧",

      // Education & Learning
      "study": "📚", "learn": "🎓", "education": "🎓", "school": "🏫", "university": "🎓",
      "lecture": "👨‍🏫", "class": "📝", "teacher": "👨‍🏫", "tutorial": "📖", "course": "📚",
      "exam": "✍️", "test": "📄", "quiz": "❓", "assignment": "📝",
      "note": "📝", "notes": "📝", "summary": "📋",

      // Other
      "travel": "✈️", "trip": "🧳", "vacation": "🏖️", "journey": "🗺️", "adventure": "🏔️",
      "sport": "⚽", "football": "⚽", "basketball": "🏀", "tennis": "🎾",
      "game": "🎮", "gaming": "🎮", "esport": "🕹️",
      "news": "📰", "current events": "📰", "politics": "🏛️",
      "law": "⚖️", "legal": "⚖️", "court": "⚖️", "justice": "⚖️",
      "religion": "🕊️", "spiritual": "✨", "faith": "🙏",
    };

    // Check title for topic keywords
    for (const [keyword, emoji] of Object.entries(topicEmojis)) {
      if (title.includes(keyword)) {
        return emoji;
      }
    }

    // Fall back to source-based emoji
    if (sourceType && sourceEmojis[sourceType]) {
      return sourceEmojis[sourceType];
    }

    // Default emoji for older notes without sourceType
    return "📝";
  };

  const handleOpenNoteMenu = useCallback((note: Note) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNote(note);
    setNoteMenuVisible(true);
  }, []);

  const handleAddToFolder = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNoteMenuVisible(false);
    setFolderPickerVisible(true);
  }, []);

  const handleSelectFolder = useCallback((folderId: string) => {
    if (selectedNote) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateNote(selectedNote.id, { folderId });
      Alert.alert("Added!", "Your note has been added to the folder");
    }
    setFolderPickerVisible(false);
    setSelectedNote(null);
  }, [selectedNote, updateNote]);

  const handleShareNote = useCallback(async () => {
    if (!selectedNote) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Create a text file with the note content
      const content = `${selectedNote.title}\n\n${selectedNote.content || ""}${
        selectedNote.summary ? "\n\nSummary:\n" + selectedNote.summary : ""
      }${
        selectedNote.keyPoints
          ? "\n\nKey Points:\n" + selectedNote.keyPoints.map((p) => `• ${p}`).join("\n")
          : ""
      }${selectedNote.transcript ? "\n\nTranscript:\n" + selectedNote.transcript : ""}`;

      const fileUri = `${FileSystem.cacheDirectory}${selectedNote.title.replace(/[^a-z0-9]/gi, "_")}.txt`;

      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: "text/plain",
        dialogTitle: "Share Note",
      });

      setNoteMenuVisible(false);
      setSelectedNote(null);
    } catch (error) {
      console.error("Error sharing note:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Oops!", "We couldn't share your note. Please try again.");
    }
  }, [selectedNote]);

  const handleExportToPDF = useCallback(async () => {
    if (!selectedNote) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Create an HTML representation of the note
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: white; color: black; }
    h1 { color: #06b6d4; margin-bottom: 10px; }
    h2 { color: #333; margin-top: 20px; margin-bottom: 10px; }
    p { line-height: 1.6; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <h1>${selectedNote.title}</h1>
  ${selectedNote.summary ? `<h2>Summary</h2><p>${selectedNote.summary}</p>` : ""}
  ${
    selectedNote.keyPoints
      ? `<h2>Key Points</h2><ul>${selectedNote.keyPoints.map((p) => `<li>${p}</li>`).join("")}</ul>`
      : ""
  }
  ${selectedNote.content ? `<h2>Content</h2><p>${selectedNote.content}</p>` : ""}
  ${selectedNote.transcript ? `<h2>Transcript</h2><p>${selectedNote.transcript}</p>` : ""}
</body>
</html>`;

      const htmlUri = `${FileSystem.cacheDirectory}${selectedNote.title.replace(/[^a-z0-9]/gi, "_")}.html`;

      await FileSystem.writeAsStringAsync(htmlUri, htmlContent, {
        encoding: EncodingType.UTF8,
      });

      await Sharing.shareAsync(htmlUri, {
        mimeType: "text/html",
        dialogTitle: "Export Note (HTML)",
      });

      setNoteMenuVisible(false);
      setSelectedNote(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Exported!",
        "Your note has been exported. You can convert it to PDF using any PDF app or by opening it in a browser."
      );
    } catch (error) {
      console.error("Error exporting note:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Oops!", "We couldn't export your note. Please try again.");
    }
  }, [selectedNote]);

  const handleDeleteNote = useCallback(() => {
    if (!selectedNote) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete This Note?",
      "This note will be deleted permanently. This can't be undone.",
      [
        { text: "Cancel", style: "cancel", onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deleteNote(selectedNote.id);
            setNoteMenuVisible(false);
            setSelectedNote(null);
          },
        },
      ]
    );
  }, [selectedNote, deleteNote]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Simulate a refresh - in a real app, this would sync with a backend
    await new Promise(resolve => setTimeout(resolve, 1000));

    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);


  const renderNote = useCallback(({ item }: { item: Note }) => {
    // Extract clean preview text from content or summary
    const getPreviewText = () => {
      const text = item.summary || item.content || "";
      // Remove markdown formatting and special characters
      const cleanText = text
        .replace(/\*\*/g, '') // Remove bold markers
        .replace(/>/g, '') // Remove blockquote markers
        .replace(/#+/g, '') // Remove header markers
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();
      return cleanText.substring(0, 80) + (cleanText.length > 80 ? '...' : '');
    };

    // Check if note is being processed
    const isProcessing = item.isProcessing === true;
    const hasError = !!item.processingError;

    return (
      <Pressable
        onPress={() => {
          if (isProcessing && !hasError) {
            // Don't allow opening processing notes
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert(
              "Still Processing",
              "This note is still being generated. Please wait until it's complete."
            );
            return;
          }
          handleNotePress(item);
        }}
        className="mx-5 mb-4 p-5 rounded-[20px] active:opacity-90"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.8)",
          shadowColor: isProcessing ? (hasError ? "#EF4444" : "#F59E0B") : "#7DD3FC",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 5,
        }}
      >
        <View className="flex-row items-start">
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
            style={{
              backgroundColor: isProcessing
                ? hasError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(252, 211, 77, 0.2)'
                : 'rgba(125, 211, 252, 0.2)'
            }}
          >
            {isProcessing ? (
              hasError ? (
                <Ionicons name="alert-circle" size={32} color="#EF4444" />
              ) : (
                <Ionicons name="hourglass-outline" size={28} color="#F59E0B" />
              )
            ) : (
              <Text style={{ fontSize: 32 }}>{getNoteEmoji(item)}</Text>
            )}
          </View>
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              {item.isPinned && (
                <Ionicons name="pin" size={16} color="#f59e0b" style={{ marginRight: 6 }} />
              )}
              <Text
                className="text-lg font-semibold flex-1 mr-2"
                numberOfLines={2}
                style={{ color: isProcessing ? '#92400E' : '#1e293b' }}
              >
                {item.title || "Untitled Note"}
              </Text>
            </View>
            {isProcessing ? (
              <View>
                {hasError ? (
                  <Text className="text-sm text-[#EF4444] mb-1">
                    ⚠️ Generation failed
                  </Text>
                ) : (
                  <>
                    <Text className="text-sm mb-1" style={{ color: '#F59E0B' }}>
                      ⏳ {item.processingProgress || 0}% • {item.processingMessage || "Processing..."}
                    </Text>
                    <View
                      className="h-1.5 rounded-full overflow-hidden mt-1"
                      style={{ backgroundColor: 'rgba(252, 211, 77, 0.2)' }}
                    >
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${item.processingProgress || 0}%`,
                          backgroundColor: '#F59E0B',
                        }}
                      />
                    </View>
                  </>
                )}
              </View>
            ) : (
              <View>
                <Text className="text-sm text-[#64748b] mb-1">
                  {formatDate(item.updatedAt)}
                </Text>
                {item.tags && item.tags.length > 0 && (
                  <View className="flex-row flex-wrap mt-1">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <View
                        key={index}
                        className="px-2 py-0.5 rounded-full mr-1 mb-1"
                        style={{ backgroundColor: 'rgba(125, 211, 252, 0.2)' }}
                      >
                        <Text className="text-xs text-[#06b6d4] font-semibold">
                          #{tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleOpenNoteMenu(item);
            }}
            className="ml-2 w-10 h-10 rounded-full items-center justify-center active:bg-[#3a3a3a]"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={isProcessing ? "#F59E0B" : "#06b6d4"} />
          </Pressable>
        </View>
      </Pressable>
    );
  }, [handleNotePress, handleOpenNoteMenu]);

  const renderListHeader = useCallback(() => (
    <View className="px-5">
      {/* Folder Chips - Horizontal Scrollable */}
      {folders.length > 0 && (
        <View className="mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {/* All Notes Chip */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter("all");
              }}
              className={`mr-2 px-4 py-2.5 rounded-full flex-row items-center`}
              style={{
                backgroundColor: selectedFilter === "all"
                  ? "#7DD3FC"
                  : "rgba(255, 255, 255, 0.6)",
                borderWidth: 1,
                borderColor: selectedFilter === "all"
                  ? "rgba(255, 255, 255, 0.5)"
                  : "rgba(255, 255, 255, 0.7)",
                shadowColor: selectedFilter === "all" ? "#7DD3FC" : "#94A3B8",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: selectedFilter === "all" ? 0.35 : 0.15,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons
                name="apps"
                size={16}
                color={selectedFilter === "all" ? "#1e293b" : "#7DD3FC"}
              />
              <Text className={`ml-2 font-semibold ${
                selectedFilter === "all" ? "text-[#1e293b]" : "text-[#64748b]"
              }`}>
                All Notes
              </Text>
            </Pressable>

            {/* Folder Chips */}
            {folders.map((folder) => (
              <Pressable
                key={folder.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilter("folder", folder.id);
                }}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert(
                    "Delete This Folder?",
                    `All notes in "${folder.name}" will be moved out of this folder. The folder will be permanently deleted.`,
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                        onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          deleteFolder(folder.id);
                          // If this folder was selected, reset to all notes
                          if (selectedFolderId === folder.id) {
                            setFilter("all");
                          }
                        },
                      },
                    ]
                  );
                }}
                className={`mr-2 px-4 py-2.5 rounded-full flex-row items-center`}
                style={{
                  backgroundColor: selectedFilter === "folder" && selectedFolderId === folder.id
                    ? "#7DD3FC"
                    : "rgba(255, 255, 255, 0.6)",
                  borderWidth: 1,
                  borderColor: selectedFilter === "folder" && selectedFolderId === folder.id
                    ? "rgba(255, 255, 255, 0.5)"
                    : "rgba(255, 255, 255, 0.7)",
                  shadowColor: selectedFilter === "folder" && selectedFolderId === folder.id ? "#7DD3FC" : "#94A3B8",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: selectedFilter === "folder" && selectedFolderId === folder.id ? 0.35 : 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                  maxWidth: 200,
                }}
              >
                <Ionicons
                  name="folder"
                  size={16}
                  color={selectedFilter === "folder" && selectedFolderId === folder.id ? "#1e293b" : "#7DD3FC"}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    selectedFilter === "folder" && selectedFolderId === folder.id
                      ? "text-[#1e293b]"
                      : "text-[#64748b]"
                  }`}
                  numberOfLines={1}
                  style={{ flexShrink: 1 }}
                >
                  {folder.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  ), [folders, selectedFilter, selectedFolderId]);

  return (
    <>
      <View className="flex-1 bg-white">
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
      <View className="px-5 pb-3" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center flex-1">
            {/* Mascot Icon */}
            <Image
              source={require('../assets/images/logo.png')}
              style={{ width: 44, height: 44, marginRight: 8 }}
              resizeMode="contain"
            />
            <Text className="text-2xl font-bold text-[#1e293b]">NoteBoost</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("LearningPath");
              }}
              className="w-12 h-12 rounded-[16px] items-center justify-center active:scale-95"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.95)',
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name="trending-up" size={24} color="#7DD3FC" />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("VoiceAssistant");
              }}
              className="w-12 h-12 rounded-[16px] items-center justify-center active:scale-95"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.95)',
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={24} color="#7DD3FC" />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("Settings");
              }}
              className="w-12 h-12 rounded-[16px] items-center justify-center active:scale-95"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.95)',
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name="settings" size={24} color="#7DD3FC" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Notes List */}
      {allNotes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 pb-32">
          <View className="items-center">
            {/* Beautiful icon container with glassmorphic design */}
            <View
              className="w-28 h-28 rounded-[32px] items-center justify-center mb-6"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.65)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.9)',
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 5,
              }}
            >
              <View
                className="w-20 h-20 rounded-[24px] items-center justify-center"
                style={{ backgroundColor: 'rgba(125, 211, 252, 0.2)' }}
              >
                <Ionicons name="document-text-outline" size={44} color="#7DD3FC" />
              </View>
            </View>

            {/* Beautiful text styling */}
            <Text className="text-2xl font-bold text-[#1e293b] mb-3 text-center">
              No notes yet
            </Text>
            <Text className="text-base text-[#64748b] text-center leading-6 mb-8 max-w-xs">
              Start your learning journey by creating your first note from audio, video, or documents
            </Text>

            {/* Decorative hint with arrow pointing to FAB */}
            <View className="items-center">
              <View
                className="px-6 py-3 rounded-full"
                style={{
                  backgroundColor: 'rgba(125, 211, 252, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(125, 211, 252, 0.3)',
                }}
              >
                <Text className="text-[#7DD3FC] text-sm font-semibold">
                  Tap the + button to get started
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-1">
          {/* Search Bar */}
          <View className="px-5 mb-4">
            <View
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.8)',
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center px-4 py-3">
                <Ionicons name="search" size={20} color="#7DD3FC" />
                <TextInput
                  className="flex-1 ml-3 text-base text-[#1e293b]"
                  placeholder="Search notes..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSearchQuery("");
                    }}
                    className="ml-2 active:opacity-60"
                  >
                    <Ionicons name="close-circle" size={20} color="#94A3B8" />
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={21}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#7DD3FC"
              colors={["#7DD3FC"]}
              progressBackgroundColor="rgba(255, 255, 255, 0.9)"
            />
          }
        />
        </View>
      )}

      {/* Create New Button - Gradient FAB matching modal design */}
      <View
        className="absolute right-5"
        style={{ bottom: insets.bottom + 20 }}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setContentModalVisible(true);
          }}
          className="active:scale-95"
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#7DD3FC',
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.6,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            <Ionicons name="add" size={32} color="white" />
          </View>
        </Pressable>
      </View>

      {/* Folder Modal - Beautiful Light Theme */}
      <Modal
        visible={folderModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFolderModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: 'rgba(125, 211, 252, 0.3)' }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFolderModalVisible(false);
          }}
        >
          <Pressable
            className="rounded-[28px] w-full max-w-md overflow-hidden"
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.9)',
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.3,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <View className="p-7">
              {/* Header Section with better hierarchy */}
              <View className="mb-6">
                <Text className="text-3xl font-bold text-[#1e293b] mb-3">Your Folders</Text>
                <Text className="text-[#64748b] text-base leading-6">
                  Organize your notes into folders to keep everything neat and easy to find
                </Text>
              </View>

              {/* Folder List or Empty State */}
              {folders.length === 0 ? (
                <View className="py-8 px-4 mb-6 rounded-[24px]" style={{ backgroundColor: 'rgba(125, 211, 252, 0.1)' }}>
                  <View className="items-center">
                    <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: 'rgba(125, 211, 252, 0.2)' }}>
                      <Ionicons name="folder-open-outline" size={40} color="#7DD3FC" />
                    </View>
                    <Text className="text-[#1e293b] text-lg font-semibold mb-2 text-center">
                      No folders yet
                    </Text>
                    <Text className="text-[#64748b] text-sm text-center leading-5">
                      Create your first folder below to start organizing your notes
                    </Text>
                  </View>
                </View>
              ) : (
                <ScrollView
                  className="mb-6 max-h-64 rounded-[24px] px-1"
                  style={{ backgroundColor: 'rgba(125, 211, 252, 0.08)' }}
                  showsVerticalScrollIndicator={false}
                >
                  {folders.map((folder, index) => (
                    <View key={folder.id}>
                      <View className="flex-row items-center py-4 px-4">
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setFilter("folder", folder.id);
                            setFolderModalVisible(false);
                          }}
                          className="flex-1 flex-row items-center active:opacity-60"
                          style={{ minHeight: 48 }}
                        >
                          <View className="w-12 h-12 rounded-[16px] items-center justify-center mr-4" style={{ backgroundColor: 'rgba(125, 211, 252, 0.2)' }}>
                            <Ionicons name="folder" size={24} color="#7DD3FC" />
                          </View>
                          <Text className="text-[#1e293b] text-lg font-semibold flex-1">
                            {folder.name}
                          </Text>
                          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            Alert.alert(
                              "Delete This Folder?",
                              `All notes in "${folder.name}" will be permanently deleted. This can't be undone.`,
                              [
                                {
                                  text: "Cancel",
                                  style: "cancel",
                                  onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: () => {
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    deleteFolder(folder.id);
                                  },
                                },
                              ]
                            );
                          }}
                          className="ml-3 w-12 h-12 rounded-[16px] items-center justify-center"
                          style={{
                            minHeight: 48,
                            minWidth: 48,
                            backgroundColor: 'rgba(239, 68, 68, 0.1)'
                          }}
                        >
                          <Ionicons name="trash-outline" size={22} color="#ef4444" />
                        </Pressable>
                      </View>
                      {index < folders.length - 1 && (
                        <View className="h-px mx-4" style={{ backgroundColor: 'rgba(148, 163, 184, 0.2)' }} />
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* New Folder Input Section */}
              <View className="mb-5">
                <Text className="text-[#1e293b] text-sm font-semibold mb-3 ml-1">
                  Create New Folder
                </Text>
                <View
                  className="rounded-[20px] overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(248, 250, 252, 0.8)',
                    borderWidth: 1,
                    borderColor: 'rgba(203, 213, 225, 0.5)',
                    shadowColor: "#7DD3FC",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <TextInput
                    className="px-6 py-5 text-base text-[#1e293b]"
                    placeholder="e.g., Biology, Math, History"
                    placeholderTextColor="#94A3B8"
                    value={newFolderName}
                    onChangeText={setNewFolderName}
                    onSubmitEditing={handleAddFolder}
                    returnKeyType="done"
                    maxLength={30}
                    style={{ minHeight: 56 }}
                  />
                </View>
              </View>

              {/* Action Buttons with better spacing */}
              <View className="flex-row gap-4">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setNewFolderName("");
                    setFolderModalVisible(false);
                  }}
                  className="flex-1 py-5 rounded-[20px]"
                  style={{
                    backgroundColor: 'rgba(148, 163, 184, 0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(148, 163, 184, 0.3)',
                    shadowColor: "#94A3B8",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text className="text-center text-[#64748b] text-base font-bold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddFolder}
                  className="flex-1 py-5 rounded-[20px]"
                  disabled={!newFolderName.trim()}
                  style={{
                    backgroundColor: newFolderName.trim() ? '#7DD3FC' : 'rgba(125, 211, 252, 0.3)',
                    opacity: newFolderName.trim() ? 1 : 0.5,
                    shadowColor: newFolderName.trim() ? "#7DD3FC" : "#94A3B8",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: newFolderName.trim() ? 0.3 : 0.15,
                    shadowRadius: 8,
                    elevation: newFolderName.trim() ? 4 : 2,
                  }}
                >
                  <Text className="text-center text-[#1e293b] text-base font-bold">
                    Create Folder
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Content Source Bottom Sheet - Polished */}
      <Modal
        visible={contentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setContentModalVisible(false)}
      >
        <View className="flex-1">
          {/* Tap outside to close - no backdrop */}
          <Pressable
            className="flex-1"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setContentModalVisible(false);
            }}
          />

          {/* Bottom Sheet Content */}
          <Animated.View
            className="rounded-t-[24px] px-6 pt-4"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.92)",
              borderTopWidth: 1,
              borderTopColor: "rgba(255, 255, 255, 0.8)",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              paddingBottom: insets.bottom + 24,
              transform: [{ translateY }]
            }}
            {...panResponder.panHandlers}
          >
            {/* Handle bar */}
            <View className="items-center mb-5">
              <View className="w-12 h-1.5 bg-[#CBD5E1] rounded-full" />
            </View>

            <Text className="text-2xl font-bold text-[#1e293b] mb-2">
              Create a Note
            </Text>
            <Text className="text-[#64748b] text-base mb-6">
              Choose where your content comes from
            </Text>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setContentModalVisible(false);
                navigation.navigate("AudioRecorder");
              }}
              style={{
                backgroundColor: "rgba(248, 250, 252, 0.8)",
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.9)",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 3,
              }}
              className="flex-row items-center active:opacity-80"
            >
              <View className="w-14 h-14 bg-[#06b6d4] rounded-2xl items-center justify-center">
                <Ionicons name="mic" size={28} color="white" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[#1e293b] text-lg font-semibold mb-0.5">
                  Record Audio
                </Text>
                <Text className="text-[#64748b] text-sm">
                  Record a lecture or upload an audio file
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setContentModalVisible(false);
                navigation.navigate("YouTubeInput");
              }}
              style={{
                backgroundColor: "rgba(248, 250, 252, 0.8)",
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.9)",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 3,
              }}
              className="flex-row items-center active:opacity-80"
            >
              <View className="w-14 h-14 bg-[#ef4444] rounded-2xl items-center justify-center">
                <Ionicons name="logo-youtube" size={28} color="white" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[#1e293b] text-lg font-semibold mb-0.5">
                  YouTube Video
                </Text>
                <Text className="text-[#64748b] text-sm">
                  Turn any video into study notes
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setContentModalVisible(false);
                navigation.navigate("DocumentUpload");
              }}
              style={{
                backgroundColor: "rgba(248, 250, 252, 0.8)",
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.9)",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 3,
              }}
              className="flex-row items-center active:opacity-80"
            >
              <View className="w-14 h-14 bg-[#8b5cf6] rounded-2xl items-center justify-center">
                <Ionicons name="document-text" size={28} color="white" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[#1e293b] text-lg font-semibold mb-0.5">
                  Upload Document
                </Text>
                <Text className="text-[#64748b] text-sm">
                  PDF, DOCX, TXT, and more
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setContentModalVisible(false);
                navigation.navigate("TextInput");
              }}
              style={{
                backgroundColor: "rgba(248, 250, 252, 0.8)",
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.9)",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 3,
              }}
              className="flex-row items-center active:opacity-80"
            >
              <View className="w-14 h-14 bg-[#10b981] rounded-2xl items-center justify-center">
                <Ionicons name="clipboard-outline" size={28} color="white" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[#1e293b] text-lg font-semibold mb-0.5">
                  Paste Text
                </Text>
                <Text className="text-[#64748b] text-sm">
                  Copy and paste any text content
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setContentModalVisible(false);
                navigation.navigate("LinkInput");
              }}
              style={{
                backgroundColor: "rgba(248, 250, 252, 0.8)",
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.9)",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 3,
              }}
              className="flex-row items-center active:opacity-80"
            >
              <View className="w-14 h-14 bg-[#f59e0b] rounded-2xl items-center justify-center">
                <Ionicons name="link-outline" size={28} color="white" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[#1e293b] text-lg font-semibold mb-0.5">
                  Insert Link
                </Text>
                <Text className="text-[#64748b] text-sm">
                  Extract content from any web page
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* Note Menu Modal - Polished */}
      <Modal
        visible={noteMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNoteMenuVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(125, 211, 252, 0.3)' }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setNoteMenuVisible(false);
          }}
        >
          <Pressable
            className="rounded-t-[32px] px-6 pt-5"
            style={{
              paddingBottom: insets.bottom + 24,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.9)',
              borderBottomWidth: 0,
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <View className="items-center mb-6">
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: 'rgba(148, 163, 184, 0.3)',
                  borderRadius: 2,
                }}
              />
            </View>

            <Text style={{ fontSize: 24, fontWeight: '700', color: '#1e293b', marginBottom: 6 }}>
              {selectedNote?.title || "Note Options"}
            </Text>
            <Text style={{ fontSize: 15, color: '#64748b', marginBottom: 24 }}>
              What would you like to do?
            </Text>

            <Pressable
              onPress={() => {
                if (selectedNote) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  togglePinNote(selectedNote.id);
                  setNoteMenuVisible(false);
                  setSelectedNote(null);
                }
              }}
              className="rounded-[18px] p-4 mb-3 flex-row items-center"
              style={({ pressed }) => ({
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(251, 191, 36, 0.2)',
                shadowColor: "#fbbf24",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: pressed ? 0.15 : 0.08,
                shadowRadius: 8,
                elevation: 2,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#fbbf24',
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name={selectedNote?.isPinned ? "pin" : "pin-outline"} size={24} color="white" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#1e293b', flex: 1 }}>
                {selectedNote?.isPinned ? "Unpin Note" : "Pin Note"}
              </Text>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </Pressable>

            <Pressable
              onPress={handleAddToFolder}
              className="rounded-[18px] p-4 mb-3 flex-row items-center"
              style={({ pressed }) => ({
                backgroundColor: 'rgba(125, 211, 252, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(125, 211, 252, 0.2)',
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: pressed ? 0.15 : 0.08,
                shadowRadius: 8,
                elevation: 2,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#06b6d4',
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="folder" size={24} color="white" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#1e293b', flex: 1 }}>
                Add to Folder
              </Text>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </Pressable>

            <Pressable
              onPress={handleShareNote}
              className="rounded-[18px] p-4 mb-3 flex-row items-center"
              style={({ pressed }) => ({
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(59, 130, 246, 0.2)',
                shadowColor: "#3B82F6",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: pressed ? 0.15 : 0.08,
                shadowRadius: 8,
                elevation: 2,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#3b82f6',
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="share-outline" size={24} color="white" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#1e293b', flex: 1 }}>
                Share Note
              </Text>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </Pressable>

            <Pressable
              onPress={handleExportToPDF}
              className="rounded-[18px] p-4 mb-5 flex-row items-center"
              style={({ pressed }) => ({
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.2)',
                shadowColor: "#10b981",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: pressed ? 0.15 : 0.08,
                shadowRadius: 8,
                elevation: 2,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#10b981',
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="download-outline" size={24} color="white" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#1e293b', flex: 1 }}>
                Export Note
              </Text>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </Pressable>

            <View style={{ height: 1, backgroundColor: 'rgba(148, 163, 184, 0.2)', marginVertical: 8 }} />

            <Pressable
              onPress={handleDeleteNote}
              className="rounded-[18px] p-4 flex-row items-center"
              style={({ pressed }) => ({
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.15)',
                shadowColor: "#ef4444",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: pressed ? 0.15 : 0.08,
                shadowRadius: 8,
                elevation: 2,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#ef4444',
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Ionicons name="trash" size={24} color="white" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#ef4444', flex: 1 }}>
                Delete Note
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Folder Picker Modal - Beautiful Glassmorphic Light Theme */}
      <Modal
        visible={folderPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFolderPickerVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: 'rgba(125, 211, 252, 0.3)' }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFolderPickerVisible(false);
          }}
        >
          <Pressable
            className="rounded-[28px] w-full max-w-md overflow-hidden"
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.9)',
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.3,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <View className="p-7">
              <Text className="text-3xl font-bold text-[#1e293b] mb-3">
                Choose a Folder
              </Text>
              <Text className="text-[#64748b] text-base mb-6 leading-6">
                Where should this note go?
              </Text>

              {folders.length === 0 ? (
                <View className="py-8 px-4 mb-6 rounded-[24px]" style={{ backgroundColor: 'rgba(125, 211, 252, 0.1)' }}>
                  <View className="items-center">
                    <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: 'rgba(125, 211, 252, 0.2)' }}>
                      <Ionicons name="folder-open-outline" size={40} color="#7DD3FC" />
                    </View>
                    <Text className="text-[#1e293b] text-lg font-semibold mb-2 text-center">
                      No folders yet
                    </Text>
                    <Text className="text-[#64748b] text-sm text-center mb-6 leading-5">
                      Create your first folder to organize notes
                    </Text>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFolderPickerVisible(false);
                        setFolderModalVisible(true);
                      }}
                      className="py-4 px-6 rounded-[20px] w-full"
                      style={{
                        backgroundColor: '#7DD3FC',
                        shadowColor: "#7DD3FC",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <Text className="text-center text-[#1e293b] text-base font-bold">
                        Create Folder
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <ScrollView
                  className="max-h-80 mb-6 rounded-[24px] px-1"
                  style={{ backgroundColor: 'rgba(125, 211, 252, 0.08)' }}
                  showsVerticalScrollIndicator={false}
                >
                  {folders.map((folder, index) => (
                    <View key={folder.id}>
                      <Pressable
                        onPress={() => handleSelectFolder(folder.id)}
                        className="py-4 px-4 active:opacity-70"
                        style={{ minHeight: 48 }}
                      >
                        <View className="flex-row items-center">
                          <View className="w-12 h-12 rounded-[16px] items-center justify-center mr-4" style={{ backgroundColor: 'rgba(125, 211, 252, 0.2)' }}>
                            <Ionicons name="folder" size={24} color="#7DD3FC" />
                          </View>
                          <Text className="text-[#1e293b] text-lg font-semibold flex-1">
                            {folder.name}
                          </Text>
                          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                        </View>
                      </Pressable>
                      {index < folders.length - 1 && (
                        <View className="h-px mx-4" style={{ backgroundColor: 'rgba(148, 163, 184, 0.2)' }} />
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFolderPickerVisible(false);
                }}
                className="py-5 rounded-[20px]"
                style={{
                  backgroundColor: 'rgba(148, 163, 184, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgba(148, 163, 184, 0.3)',
                  shadowColor: "#94A3B8",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text className="text-center text-[#64748b] text-base font-bold">
                  Cancel
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
    </>
  );
}
