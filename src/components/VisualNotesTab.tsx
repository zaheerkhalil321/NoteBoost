import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Note } from "../state/notesStore";
import { CodeSnippetRenderer } from "../components/CodeSnippetRenderer";
import { ChartRenderer } from "../components/ChartRenderer";
import { DiagramRenderer } from "../components/DiagramRenderer";
import * as Haptics from "expo-haptics";
import { Sparkles, Code, BarChart3, Network } from "lucide-react-native";

interface VisualNotesTabProps {
  note: Note;
  onGenerateVisuals: () => void;
  isGenerating: boolean;
}

export const VisualNotesTab: React.FC<VisualNotesTabProps> = ({
  note,
  onGenerateVisuals,
  isGenerating,
}) => {
  const [activeFilter, setActiveFilter] = useState<
    "all" | "charts" | "diagrams"
  >("all");

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

    // Pulse animation when loading
    if (isGenerating) {
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
  }, [isGenerating]);

  const hasVisuals =
    note.visualContent &&
    (note.visualContent.charts?.length ||
      note.visualContent.diagrams?.length);

  const handleFilterPress = (filter: typeof activeFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <Animated.View
        style={{
          transform: [{ translateY: floatAnim }, { scale: pulseAnim }],
        }}
      >
        <View
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
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
              width: 100,
              height: 100,
            }}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      <Text className="text-gray-900 text-2xl font-bold text-center mb-3 mt-6">
        No Visuals Yet
      </Text>
      <Text className="text-gray-600 text-base text-center mb-8 leading-6">
        Transform your notes into powerful visuals with AI-generated diagrams,
        graphs, and code snippets
      </Text>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onGenerateVisuals();
        }}
        disabled={isGenerating}
        className="active:opacity-70"
      >
        <LinearGradient
          colors={["#0ea5e9", "#06b6d4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white text-lg font-bold ml-3">
                Generating Visuals...
              </Text>
            </>
          ) : (
            <>
              <Sparkles size={24} color="white" />
              <Text className="text-white text-lg font-bold ml-3">
                Generate Visuals
              </Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );

  const renderFilterChip = (
    filter: typeof activeFilter,
    label: string,
    icon: React.ReactNode,
    count: number
  ) => {
    const isActive = activeFilter === filter;
    return (
      <Pressable
        onPress={() => handleFilterPress(filter)}
        className="active:opacity-70"
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 20,
            marginRight: 8,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isActive ? 'rgba(14, 165, 233, 0.9)' : 'rgba(255, 255, 255, 0.6)',
            borderWidth: 1,
            borderColor: isActive ? 'rgba(125, 211, 252, 0.5)' : 'rgba(255, 255, 255, 0.8)',
            shadowColor: isActive ? '#7DD3FC' : '#94A3B8',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isActive ? 0.3 : 0.1,
            shadowRadius: isActive ? 6 : 3,
            elevation: isActive ? 4 : 2,
          }}
        >
          {icon}
          <Text
            className={`font-semibold ml-2 ${
              isActive ? "text-white" : "text-gray-700"
            }`}
          >
            {label}
          </Text>
          {count > 0 && (
            <View
              style={{
                marginLeft: 8,
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(14, 165, 233, 0.9)',
              }}
            >
              <Text
                className={`text-xs font-bold ${
                  isActive ? "text-white" : "text-white"
                }`}
              >
                {count}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  if (!hasVisuals) {
    return renderEmptyState();
  }

  const chartCount = note.visualContent?.charts?.length || 0;
  const diagramCount = note.visualContent?.diagrams?.length || 0;
  const totalCount = chartCount + diagramCount;

  const shouldShowCharts =
    activeFilter === "all" || activeFilter === "charts";
  const shouldShowDiagrams =
    activeFilter === "all" || activeFilter === "diagrams";

  return (
    <View className="flex-1">
      {/* Gradient Background - Glassmorphic Design */}
      <LinearGradient
        colors={['#D6EAF8', '#E8F4F8', '#F9F7E8', '#FFF9E6']}
        locations={[0, 0.4, 0.7, 1]}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
      />

      {/* Filter Bar */}
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 16,
          marginBottom: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.4)',
          paddingHorizontal: 12,
          paddingVertical: 12,
          shadowColor: '#7DD3FC',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {renderFilterChip(
            "all",
            "All",
            <Sparkles
              size={16}
              color={activeFilter === "all" ? "white" : "#0ea5e9"}
            />,
            totalCount
          )}
          {renderFilterChip(
            "charts",
            "Charts",
            <BarChart3
              size={16}
              color={activeFilter === "charts" ? "white" : "#6b7280"}
            />,
            chartCount
          )}
          {renderFilterChip(
            "diagrams",
            "Diagrams",
            <Network
              size={16}
              color={activeFilter === "diagrams" ? "white" : "#6b7280"}
            />,
            diagramCount
          )}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Charts */}
        {shouldShowCharts &&
          note.visualContent?.charts?.map((chart, index) => (
            <ChartRenderer key={`chart-${index}`} chart={chart} />
          ))}

        {/* Diagrams */}
        {shouldShowDiagrams &&
          note.visualContent?.diagrams?.map((diagram, index) => (
            <DiagramRenderer key={`diagram-${index}`} diagram={diagram} />
          ))}

        {/* Regenerate Button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onGenerateVisuals();
          }}
          disabled={isGenerating}
          className="active:opacity-70 mt-4"
        >
          <LinearGradient
            colors={["#0ea5e9", "#06b6d4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white text-base font-semibold ml-3">
                  Regenerating...
                </Text>
              </>
            ) : (
              <>
                <Sparkles size={20} color="white" />
                <Text className="text-white text-base font-semibold ml-3">
                  Regenerate Visuals
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
};
