import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { useNotesStore, TimestampedSegment } from "../state/notesStore";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  Search,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";

type AudioTimestampScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "AudioTimestamp">;
  route: RouteProp<RootStackParamList, "AudioTimestamp">;
};

export default function AudioTimestampScreen({
  navigation,
  route,
}: AudioTimestampScreenProps) {
  const insets = useSafeAreaInsets();
  const { noteId } = route.params;
  const note = useNotesStore((state) => state.notes.find((n) => n.id === noteId));

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (note?.audioUri) {
      loadAudio();
    }

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [note?.audioUri]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (sound && isPlaying) {
      interval = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis / 1000);

          // Auto-highlight current segment
          if (note?.timestampedContent) {
            const currentSegmentIndex = note.timestampedContent.findIndex(
              (seg, idx) => {
                const nextSeg = note.timestampedContent![idx + 1];
                return (
                  seg.timestamp <= status.positionMillis / 1000 &&
                  (!nextSeg || nextSeg.timestamp > status.positionMillis / 1000)
                );
              }
            );
            if (currentSegmentIndex !== -1) {
              setSelectedSegment(currentSegmentIndex);
            }
          }
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sound, isPlaying, note?.timestampedContent]);

  const loadAudio = async () => {
    try {
      setIsLoading(true);
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri: note!.audioUri! },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(audioSound);

      const status = await audioSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
      }
    } catch (error) {
      console.error("Error loading audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis / 1000);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const seekToPosition = async (seconds: number) => {
    if (!sound) return;

    await sound.setPositionAsync(seconds * 1000);
    setPosition(seconds);
  };

  const jumpToTimestamp = async (timestamp: number, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await seekToPosition(timestamp);
    setSelectedSegment(index);

    if (!isPlaying && sound) {
      await sound.playAsync();
    }
  };

  const skipForward = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await seekToPosition(Math.min(position + 10, duration));
  };

  const skipBackward = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await seekToPosition(Math.max(position - 10, 0));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!note) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-gray-600">Note not found</Text>
      </View>
    );
  }

  if (!note.audioUri || !note.timestampedContent) {
    return (
      <View className="flex-1 bg-gray-100">
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingBottom: 16,
            paddingHorizontal: 16,
            backgroundColor: "white",
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            className="active:opacity-70"
          >
            <X size={28} color="#0ea5e9" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-900 text-xl font-bold mb-3 text-center">
            No Audio Available
          </Text>
          <Text className="text-gray-600 text-base text-center">
            This note doesn't have audio with timestamps. Try creating a note from
            audio recording to use this feature.
          </Text>
        </View>
      </View>
    );
  }

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
              <Text className="text-gray-900 text-xl font-bold" numberOfLines={1}>
                {note.title}
              </Text>
              <Text className="text-gray-600 text-sm">
                Audio with Timestamps
              </Text>
            </View>
          </View>
          <Clock size={28} color="#0ea5e9" />
        </View>
      </View>

      {/* Audio Player Card */}
      <View
        style={{
          margin: 16,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.4)",
          shadowColor: "#7DD3FC",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 5,
        }}
      >
        {/* Progress Slider */}
        <View className="mb-4">
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={seekToPosition}
            minimumTrackTintColor="#0ea5e9"
            maximumTrackTintColor="#e2e8f0"
            thumbTintColor="#0ea5e9"
          />
          <View className="flex-row justify-between px-2">
            <Text className="text-gray-600 text-sm">{formatTime(position)}</Text>
            <Text className="text-gray-600 text-sm">{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View className="flex-row items-center justify-center">
          <Pressable
            onPress={skipBackward}
            disabled={!sound || isLoading}
            className="active:opacity-70 mx-4"
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: "rgba(14, 165, 233, 0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SkipBack size={24} color="#0ea5e9" />
            </View>
          </Pressable>

          <Pressable
            onPress={togglePlayPause}
            disabled={!sound || isLoading}
            className="active:opacity-90"
          >
            <LinearGradient
              colors={["#0ea5e9", "#06b6d4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : isPlaying ? (
                <Pause size={32} color="white" fill="white" />
              ) : (
                <Play size={32} color="white" fill="white" />
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={skipForward}
            disabled={!sound || isLoading}
            className="active:opacity-70 mx-4"
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: "rgba(14, 165, 233, 0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SkipForward size={24} color="#0ea5e9" />
            </View>
          </Pressable>
        </View>
      </View>

      {/* Timestamped Content */}
      <View className="flex-1 px-4">
        <View className="flex-row items-center mb-3">
          <Search size={18} color="#64748b" />
          <Text className="text-gray-700 text-base font-semibold ml-2">
            Tap any segment to jump to that moment
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {note.timestampedContent.map((segment, index) => {
            const isActive = selectedSegment === index;

            return (
              <Pressable
                key={index}
                onPress={() => jumpToTimestamp(segment.timestamp, index)}
                className="active:opacity-90 mb-3"
              >
                <View
                  style={{
                    backgroundColor: isActive
                      ? "rgba(14, 165, 233, 0.15)"
                      : "rgba(255, 255, 255, 0.9)",
                    borderRadius: 12,
                    padding: 14,
                    borderLeftWidth: 3,
                    borderLeftColor: isActive ? "#0ea5e9" : "#e2e8f0",
                    borderWidth: 1,
                    borderColor: isActive
                      ? "rgba(14, 165, 233, 0.3)"
                      : "rgba(255, 255, 255, 0.4)",
                  }}
                >
                  <View className="flex-row items-center mb-2">
                    <Clock size={14} color={isActive ? "#0ea5e9" : "#64748b"} />
                    <Text
                      className={`text-sm font-bold ml-1 ${
                        isActive ? "text-[#0ea5e9]" : "text-gray-600"
                      }`}
                    >
                      {formatTime(segment.timestamp)}
                    </Text>
                  </View>
                  <Text
                    className={`text-base leading-6 ${
                      isActive ? "text-gray-900" : "text-gray-700"
                    }`}
                  >
                    {segment.text}
                  </Text>

                  {segment.keywords && segment.keywords.length > 0 && (
                    <View className="flex-row flex-wrap mt-2">
                      {segment.keywords.map((keyword, kidx) => (
                        <View
                          key={kidx}
                          style={{
                            backgroundColor: isActive
                              ? "rgba(14, 165, 233, 0.2)"
                              : "rgba(148, 163, 184, 0.1)",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            marginRight: 6,
                            marginTop: 4,
                          }}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              isActive ? "text-[#0ea5e9]" : "text-gray-600"
                            }`}
                          >
                            #{keyword}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
