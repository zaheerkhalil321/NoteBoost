import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { useNotesStore } from "../state/notesStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

type FeynmanScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Feynman">;
  route: RouteProp<RootStackParamList, "Feynman">;
};

export default function FeynmanScreen({ navigation, route }: FeynmanScreenProps) {
  const insets = useSafeAreaInsets();
  const { noteId } = route.params;

  const note = useNotesStore((s) => s.notes.find((n) => n.id === noteId));
  const updateNote = useNotesStore((s) => s.updateNote);

  const [explanation, setExplanation] = useState(note?.feynmanExplanation || "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (explanation !== (note?.feynmanExplanation || "")) {
      setHasChanges(true);
    }
  }, [explanation, note?.feynmanExplanation]);

  const handleSave = () => {
    if (noteId) {
      updateNote(noteId, { feynmanExplanation: explanation });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasChanges(false);
      Alert.alert("Saved!", "Your explanation has been saved successfully.");
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Do you want to save before leaving?",
        [
          {
            text: "Don't Save",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Save",
            onPress: () => {
              handleSave();
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (!note) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-600">Note not found</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ paddingTop: insets.top }}
    >
   
        {/* Header */}
        <View className="px-5 py-4 border-b border-gray-200 bg-white/80">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={handleBack}
              className="flex-row items-center"
            >
              <Ionicons name="arrow-back" size={24} color="#0EA5E9" />
              <Text className="text-lg font-semibold text-sky-500 ml-2">
                Back
              </Text>
            </Pressable>

            <View className="flex-1 items-center mx-4">
              <Text className="text-xl font-bold text-gray-800" numberOfLines={1}>
                Feynman Technique
              </Text>
            </View>

            <Pressable
              onPress={handleSave}
              disabled={!hasChanges}
              className={`px-4 py-2 rounded-full ${
                hasChanges ? "bg-sky-500" : "bg-gray-300"
              }`}
            >
              <Text
                className={`font-semibold ${
                  hasChanges ? "text-white" : "text-gray-500"
                }`}
              >
                Save
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 grow" contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          <View className="p-5">
            {/* Instructions Card */}
            <View className="bg-white/90 rounded-2xl p-5 mb-5 border border-sky-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="bulb-outline" size={24} color="#0EA5E9" />
                <Text className="text-lg font-bold text-gray-800 ml-2">
                  How It Works
                </Text>
              </View>
              <Text className="text-gray-600 leading-6 mb-3">
                The Feynman Technique helps you truly understand concepts by explaining them simply:
              </Text>
              <View className="space-y-2">
                <View className="flex-row items-start">
                  <Text className="text-sky-500 font-bold mr-2">1.</Text>
                  <Text className="flex-1 text-gray-700">
                    Explain this concept as if teaching a 10-year-old
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-sky-500 font-bold mr-2">2.</Text>
                  <Text className="flex-1 text-gray-700">
                    Use simple words and avoid jargon
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-sky-500 font-bold mr-2">3.</Text>
                  <Text className="flex-1 text-gray-700">
                    Use analogies and everyday examples
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <Text className="text-sky-500 font-bold mr-2">4.</Text>
                  <Text className="flex-1 text-gray-700">
                    Identify gaps in your understanding and review
                  </Text>
                </View>
              </View>
            </View>

            {/* Note Context */}
            <View className="bg-white/90 rounded-2xl p-5 mb-5 border border-yellow-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="document-text-outline" size={24} color="#FCD34D" />
                <Text className="text-lg font-bold text-gray-800 ml-2">
                  {note.title}
                </Text>
              </View>
              {note.summary && (
                <View className="bg-yellow-50 rounded-lg p-3 mb-3">
                  <Text className="text-sm font-semibold text-gray-700 mb-1">
                    Summary:
                  </Text>
                  <Text className="text-sm text-gray-600 leading-5">
                    {note.summary}
                  </Text>
                </View>
              )}
              {note.keyPoints && note.keyPoints.length > 0 && (
                <View className="bg-yellow-50 rounded-lg p-3">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Key Points:
                  </Text>
                  {note.keyPoints.slice(0, 3).map((point, index) => (
                    <Text key={index} className="text-sm text-gray-600 leading-5 mb-1">
                      • {point}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Explanation Input */}
            <View className="bg-white/90 rounded-2xl p-5 mb-5 border border-sky-200">
              <View className="flex-row items-center mb-3">
                <Ionicons name="create-outline" size={24} color="#0EA5E9" />
                <Text className="text-lg font-bold text-gray-800 ml-2">
                  Your Simple Explanation
                </Text>
              </View>
              <Text className="text-sm text-gray-500 mb-3">
                Explain this concept in your own words, as simply as possible:
              </Text>
              <TextInput
                value={explanation}
                onChangeText={setExplanation}
                multiline
                placeholder="Imagine you're explaining this to a friend who knows nothing about the topic. How would you describe it? What analogies would you use?"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 rounded-xl p-4 text-gray-800 min-h-[300px]"
                style={{
                  textAlignVertical: "top",
                  fontSize: 16,
                  lineHeight: 24,
                }}
              />
            </View>

            {/* Tips Card */}
            <View className="bg-gradient-to-br from-sky-50 to-yellow-50 rounded-2xl p-5 mb-5 border border-sky-100">
              <View className="flex-row items-center mb-3">
                <Ionicons name="star-outline" size={24} color="#FCD34D" />
                <Text className="text-lg font-bold text-gray-800 ml-2">
                  Pro Tips
                </Text>
              </View>
              <View className="space-y-2">
                <Text className="text-gray-700 leading-6">
                  💡 If you struggle to explain something simply, you've found a gap in your understanding
                </Text>
                <Text className="text-gray-700 leading-6">
                  💡 Use analogies from everyday life to make complex ideas relatable
                </Text>
                <Text className="text-gray-700 leading-6">
                  💡 Read your explanation out loud - does it make sense?
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}
