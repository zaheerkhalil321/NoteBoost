import React, { useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useNotesStore, Note } from "../state/notesStore";
import * as Haptics from "expo-haptics";

type SearchScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Search">;
};

type FilterType = "all" | "audio" | "youtube" | "document";
type SortType = "recent" | "oldest" | "a-z" | "z-a";

export default function SearchScreen({ navigation }: SearchScreenProps) {
  const insets = useSafeAreaInsets();
  const notes = useNotesStore((state) => state.notes);
  const folders = useNotesStore((state) => state.folders);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortType, setSortType] = useState<SortType>("recent");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  let filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Apply source filter
  if (filterType !== "all") {
    filteredNotes = filteredNotes.filter((note) => note.sourceType === filterType);
  }

  // Apply folder filter
  if (selectedFolder) {
    filteredNotes = filteredNotes.filter((note) => note.folderId === selectedFolder);
  }

  // Apply sorting
  filteredNotes = [...filteredNotes].sort((a, b) => {
    switch (sortType) {
      case "recent":
        return b.updatedAt - a.updatedAt;
      case "oldest":
        return a.updatedAt - b.updatedAt;
      case "a-z":
        return a.title.localeCompare(b.title);
      case "z-a":
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  const handleNotePress = (note: Note) => {
    navigation.navigate("NoteEditor", { noteId: note.id });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const renderNote = ({ item }: { item: Note }) => (
    <Pressable
      onPress={() => handleNotePress(item)}
      className="bg-white px-4 py-3 border-b border-gray-100 active:bg-gray-50"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-2">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {item.title || "Untitled Note"}
          </Text>
          <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
            {item.content || "No content"}
          </Text>
        </View>
        <Text className="text-xs text-gray-400">{formatDate(item.updatedAt)}</Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => navigation.goBack()}
            className="mr-3 active:opacity-60"
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </Pressable>
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-2 text-base"
              placeholder="Search notes..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} className="active:opacity-60">
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-gray-100 px-4 py-3"
        contentContainerStyle={{ gap: 8 }}
      >
        {/* Source Type Filters */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFilterType("all");
          }}
          className={`px-4 py-2 rounded-full ${filterType === "all" ? "bg-cyan-500" : "bg-gray-100"}`}
        >
          <Text className={`font-semibold ${filterType === "all" ? "text-white" : "text-gray-700"}`}>
            All
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFilterType("audio");
          }}
          className={`px-4 py-2 rounded-full flex-row items-center ${filterType === "audio" ? "bg-cyan-500" : "bg-gray-100"}`}
        >
          <Ionicons name="mic" size={16} color={filterType === "audio" ? "white" : "#06b6d4"} />
          <Text className={`font-semibold ml-1 ${filterType === "audio" ? "text-white" : "text-gray-700"}`}>
            Audio
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFilterType("youtube");
          }}
          className={`px-4 py-2 rounded-full flex-row items-center ${filterType === "youtube" ? "bg-red-500" : "bg-gray-100"}`}
        >
          <Ionicons name="logo-youtube" size={16} color={filterType === "youtube" ? "white" : "#ef4444"} />
          <Text className={`font-semibold ml-1 ${filterType === "youtube" ? "text-white" : "text-gray-700"}`}>
            YouTube
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFilterType("document");
          }}
          className={`px-4 py-2 rounded-full flex-row items-center ${filterType === "document" ? "bg-purple-500" : "bg-gray-100"}`}
        >
          <Ionicons name="document-text" size={16} color={filterType === "document" ? "white" : "#8b5cf6"} />
          <Text className={`font-semibold ml-1 ${filterType === "document" ? "text-white" : "text-gray-700"}`}>
            Document
          </Text>
        </Pressable>

        {/* Sort Options */}
        <View className="w-px h-8 bg-gray-300 mx-2" />
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSortType(sortType === "recent" ? "oldest" : "recent");
          }}
          className="px-4 py-2 rounded-full flex-row items-center bg-gray-100"
        >
          <Ionicons name="time-outline" size={16} color="#64748b" />
          <Text className="font-semibold ml-1 text-gray-700">
            {sortType === "recent" ? "Recent" : "Oldest"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSortType(sortType === "a-z" ? "z-a" : "a-z");
          }}
          className="px-4 py-2 rounded-full flex-row items-center bg-gray-100"
        >
          <Ionicons name="text-outline" size={16} color="#64748b" />
          <Text className="font-semibold ml-1 text-gray-700">
            {sortType === "a-z" ? "A-Z" : "Z-A"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Results */}
      {searchQuery.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="search-outline" size={64} color="#d1d5db" />
          <Text className="text-gray-400 text-center mt-4">
            Search through your notes
          </Text>
        </View>
      ) : filteredNotes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="document-outline" size={64} color="#d1d5db" />
          <Text className="text-gray-400 text-center mt-4">No notes found</Text>
        </View>
      ) : (
        <View className="flex-1">
          <View className="px-4 py-2 bg-gray-50">
            <Text className="text-sm text-gray-600">
              {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}{" "}
              found
            </Text>
          </View>
          <FlatList
            data={filteredNotes}
            renderItem={renderNote}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}
    </View>
  );
}
