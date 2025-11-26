import React, { forwardRef, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";

type ContentSourceBottomSheetProps = {
  onSourceSelect: (screen: "AudioRecorder" | "YouTubeInput" | "DocumentUpload") => void;
};

const ContentSourceBottomSheet = forwardRef<BottomSheetMethods, ContentSourceBottomSheetProps>(
  ({ onSourceSelect }, ref) => {
    const snapPoints = useMemo(() => ["50%"], []);

    console.log("[ContentSourceBottomSheet] Component mounted with ref:", ref);

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
    ];

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: "#FFFFFF" }}
        handleIndicatorStyle={{ backgroundColor: "#CBD5E1" }}
      >
        <View className="flex-1 px-5 pt-4">
          <Text className="text-2xl font-bold text-[#1e293b] mb-2">
            Create a Note
          </Text>
          <Text className="text-base text-[#64748b] mb-6">
            Choose where your content comes from
          </Text>

          {sources.map((source) => (
            <Pressable
              key={source.id}
              onPress={() => onSourceSelect(source.screen)}
              style={{
                backgroundColor: "#F8FAFC",
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                shadowColor: "#7DD3FC",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 1,
              }}
              className="flex-row items-center justify-between active:bg-[#E0F2FE]"
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
                  <Text className="text-[#1e293b] text-lg font-semibold mb-0.5">
                    {source.title}
                  </Text>
                  {source.subtitle && (
                    <Text className="text-[#64748b] text-sm">
                      {source.subtitle}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    );
  }
);

export default ContentSourceBottomSheet;
