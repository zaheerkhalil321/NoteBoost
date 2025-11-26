import React, { useState } from "react";
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { Diagram } from "../state/notesStore";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, CheckCircle2, Circle, Diamond, Maximize2, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface DiagramRendererProps {
  diagram: Diagram;
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({ diagram }) => {
  const [imageExpanded, setImageExpanded] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  console.log('[DiagramRenderer] Rendering with diagram:', {
    type: diagram.type,
    title: diagram.title,
    hasSvgData: !!diagram.svgData,
    hasMermaidCode: !!diagram.mermaidCode,
  });

  const getDiagramIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      flowchart: "🔄",
      sequence: "📊",
      mindmap: "🧠",
      concept: "💡",
    };
    return icons[type] || "📈";
  };

  const getDiagramColor = (type: string) => {
    const colors: { [key: string]: string } = {
      flowchart: "#3b82f6",
      sequence: "#8b5cf6",
      mindmap: "#ec4899",
      concept: "#10b981",
    };
    return colors[type] || "#6b7280";
  };

  // Parse mermaid flowchart into steps
  const parseFlowchart = (mermaidCode: string) => {
    if (!mermaidCode) return [];

    const lines = mermaidCode.split('\n').filter(line => line.trim() && !line.trim().startsWith('flowchart') && !line.trim().startsWith('graph'));
    const steps: Array<{ id: string; label: string; type: string }> = [];
    const seenLabels = new Set<string>();

    lines.forEach((line, lineIndex) => {
      // First try to match arrow-based format: Start --> Rain and Flurries --> Colder Air
      if (line.includes('-->') || line.includes('->')) {
        const parts = line.split(/-->|->/).map(part => part.trim());
        parts.forEach((part, index) => {
          if (part && !seenLabels.has(part)) {
            seenLabels.add(part);
            steps.push({
              id: `step-${steps.length}`,
              label: part,
              type: 'process'
            });
          }
        });
        return;
      }

      // Fallback: Try bracket-based format: A[text], A(text), A{text}, etc.
      const nodeMatches = line.matchAll(/(\w+)\s*[\[\(\{]([^\]\)\}]+)[\]\)\}]/g);
      for (const match of nodeMatches) {
        const [fullMatch, id, label] = match;

        if (seenLabels.has(label.trim())) continue;
        seenLabels.add(label.trim());

        let type = 'process';
        if (fullMatch.includes('{') && fullMatch.includes('}')) type = 'decision';

        steps.push({ id, label: label.trim(), type });
      }
    });

    console.log('[DiagramRenderer] Parsed steps:', steps);
    return steps;
  };

  const steps = diagram.mermaidCode ? parseFlowchart(diagram.mermaidCode) : [];
  const color = getDiagramColor(diagram.type);

  const renderFlowStep = (step: { id: string; label: string; type: string }, index: number) => {
    const isDecision = step.type === 'decision';
    const isLast = index === steps.length - 1;

    return (
      <View key={step.id + index} style={{ alignItems: 'center', marginBottom: 16, width: '100%', paddingHorizontal: 20 }}>
        {/* Step Node Container with Badge Space */}
        <View style={{ width: '100%', alignItems: 'center', marginTop: 12 }}>
          {/* Step Number Badge */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: color,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: -20,
              zIndex: 10,
              borderWidth: 4,
              borderColor: 'white',
              shadowColor: color,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 5,
            }}
          >
            <Text className="text-white text-lg font-bold">{index + 1}</Text>
          </View>

          {/* Step Node */}
          <View
            style={{
              width: '100%',
              minHeight: 90,
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              borderRadius: 18,
              paddingTop: 30,
              paddingBottom: 18,
              paddingHorizontal: 18,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: color + '35',
              shadowColor: color,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <LinearGradient
              colors={[color + '12', color + '03']}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 18,
              }}
            />

            {/* Step Icon */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: color + '18',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                borderWidth: 1,
                borderColor: color + '30',
              }}
            >
              {isDecision ? (
                <Diamond size={24} color={color} strokeWidth={2.5} />
              ) : index === steps.length - 1 ? (
                <CheckCircle2 size={24} color={color} strokeWidth={2.5} />
              ) : (
                <Circle size={24} color={color} fill={color + '40'} strokeWidth={2.5} />
              )}
            </View>

            {/* Step Text */}
            <Text
              style={{
                color: '#1f2937',
                fontSize: 15,
                fontWeight: '600',
                textAlign: 'center',
                lineHeight: 21,
              }}
            >
              {step.label}
            </Text>
          </View>
        </View>

        {/* Arrow to next step */}
        {!isLast && (
          <View style={{ marginTop: 12, marginBottom: 0 }}>
            <View
              style={{
                backgroundColor: color + '15',
                borderRadius: 20,
                padding: 6,
              }}
            >
              <ArrowRight size={32} color={color} strokeWidth={2.5} style={{ transform: [{ rotate: '90deg' }] }} />
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View
      style={{
        marginBottom: 24,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#7DD3FC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* Header */}
      <LinearGradient
        colors={[color + '20', color + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="px-4 py-4">
          <View className="flex-row items-center mb-1">
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Text className="text-3xl">{getDiagramIcon(diagram.type)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold text-lg">
                {diagram.title}
              </Text>
              <View
                style={{
                  marginTop: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  alignSelf: 'flex-start',
                }}
              >
                <Text
                  className="text-xs font-semibold uppercase"
                  style={{ color: color }}
                >
                  {diagram.type}
                </Text>
              </View>
            </View>
          </View>
          {diagram.description && (
            <Text className="text-gray-700 text-sm mt-3 leading-5">
              {diagram.description}
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* Diagram Content */}
      <View
        style={{
          backgroundColor: 'rgba(248, 250, 252, 0.6)',
        }}
      >
        {/* Image Display - if svgData or image URL exists */}
        {diagram.svgData && !imageError && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 20,
              paddingBottom: 16,
            }}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setImageExpanded(!imageExpanded);
              }}
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: 'white',
                borderWidth: 2,
                borderColor: color + '30',
                shadowColor: color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              {/* Image Container */}
              <View style={{ position: 'relative' }}>
                {imageLoading && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(248, 250, 252, 0.9)',
                      zIndex: 1,
                    }}
                  >
                    <ActivityIndicator size="large" color={color} />
                    <Text className="text-gray-600 text-sm mt-3">Loading diagram...</Text>
                  </View>
                )}

                <Image
                  source={{ uri: diagram.svgData }}
                  style={{
                    width: '100%',
                    height: imageExpanded ? 500 : 250,
                    resizeMode: imageExpanded ? 'contain' : 'cover',
                  }}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                />

                {/* Expand/Collapse Button Overlay */}
                {!imageLoading && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      borderRadius: 20,
                      padding: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    {imageExpanded ? (
                      <X size={20} color="white" />
                    ) : (
                      <Maximize2 size={20} color="white" />
                    )}
                  </View>
                )}

                {/* Tap to expand hint */}
                {!imageLoading && !imageExpanded && (
                  <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                    }}
                  >
                    <Text className="text-white text-xs text-center font-semibold">
                      Tap to expand
                    </Text>
                  </LinearGradient>
                )}
              </View>
            </Pressable>
          </View>
        )}

        {/* Flowchart Steps - Scrollable */}
        {steps.length > 0 && (
          <ScrollView
            style={{ maxHeight: 600 }}
            contentContainerStyle={{
              paddingTop: diagram.svgData && !imageError ? 8 : 20,
              paddingBottom: 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ width: '100%' }}>
              {steps.map((step, index) => renderFlowStep(step, index))}
            </View>
          </ScrollView>
        )}

        {/* Fallback: Show mermaid code if no image and no parsed steps */}
        {!diagram.svgData && steps.length === 0 && diagram.mermaidCode && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 20,
              paddingBottom: 24,
            }}
          >
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: color + '30',
                shadowColor: color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="flex-row items-center mb-3">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: color + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  <Text className="text-lg">📝</Text>
                </View>
                <Text className="text-gray-900 font-bold text-base">Diagram Details</Text>
              </View>
              <Text className="text-gray-700 text-sm font-mono leading-6">
                {diagram.mermaidCode}
              </Text>
            </View>
          </View>
        )}

        {/* Empty state if nothing to show */}
        {!diagram.svgData && steps.length === 0 && !diagram.mermaidCode && (
          <View className="items-center justify-center py-12 px-6">
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: color + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Text className="text-5xl">{getDiagramIcon(diagram.type)}</Text>
            </View>
            <Text className="text-gray-500 text-base font-semibold text-center">
              Visual diagram representation
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2">
              The diagram will appear here once generated
            </Text>
          </View>
        )}
      </View>

      {/* Footer note */}
      <LinearGradient
        colors={[color + '10', color + '05']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderTopWidth: 1,
          borderTopColor: 'rgba(226, 232, 240, 0.4)',
        }}
      >
        <View className="flex-row items-center">
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Text className="text-base">💡</Text>
          </View>
          <Text className="text-gray-700 text-xs font-medium flex-1">
            This diagram visualizes key concepts from your notes
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};
