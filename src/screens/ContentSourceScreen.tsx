import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

type ContentSourceScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ContentSource">;
};

export default function ContentSourceScreen({
  navigation,
}: ContentSourceScreenProps) {
  const insets = useSafeAreaInsets();

  const sources = [
    {
      id: "audio",
      title: "Record or upload audio",
      icon: "mic",
      iconColor: "#06b6d4",
      bgColor: "#06b6d4",
      screen: "AudioRecorder" as const,
    },
    {
      id: "youtube",
      title: "YouTube video",
      icon: "logo-youtube",
      iconColor: "#ef4444",
      bgColor: "#ef4444",
      screen: "YouTubeInput" as const,
    },
    {
      id: "document",
      title: "Upload document",
      subtitle: "Any PDF, DOCX, PPT, TXT, etc!",
      icon: "document-text",
      iconColor: "#ef4444",
      bgColor: "#ef4444",
      screen: "DocumentUpload" as const,
    },
    {
      id: "screenshot",
      title: "Screenshot / Photo",
      subtitle: "Extract text from images",
      icon: "camera",
      iconColor: "#8b5cf6",
      bgColor: "#8b5cf6",
      screen: "ScreenshotOCR" as const,
    },
  ];

  return (
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
      <View className="px-5" style={{ paddingTop: insets.top + 16, paddingBottom: 24 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          className="active:opacity-60 mb-4"
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#7DD3FC",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#7DD3FC" />
        </Pressable>
        <Text className="text-3xl font-bold text-[#1e293b]">
          Choose content source
        </Text>
      </View>

      {/* Source Options */}
      <View className="px-5">
        {sources.map((source, index) => (
          <Pressable
            key={source.id}
            onPress={() => {
              navigation.navigate(source.screen);
            }}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              shadowColor: "#7DD3FC",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 2,
            }}
            className="flex-row items-center justify-between active:bg-[#F1F5F9]"
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center"
                style={{ backgroundColor: source.bgColor }}
              >
                <Ionicons
                  name={source.icon as any}
                  size={28}
                  color="white"
                />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-[#1e293b] text-lg font-semibold">
                  {source.title}
                </Text>
                {source.subtitle && (
                  <Text className="text-[#64748b] text-sm mt-1">
                    {source.subtitle}
                  </Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
