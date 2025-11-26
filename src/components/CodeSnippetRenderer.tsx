import React from "react";
import { View, Text, ScrollView } from "react-native";
import { CodeSnippet } from "../state/notesStore";

interface CodeSnippetRendererProps {
  snippet: CodeSnippet;
}

export const CodeSnippetRenderer: React.FC<CodeSnippetRendererProps> = ({ snippet }) => {
  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      javascript: "#f7df1e",
      typescript: "#3178c6",
      python: "#3776ab",
      java: "#007396",
      cpp: "#00599c",
      csharp: "#239120",
      ruby: "#cc342d",
      go: "#00add8",
      rust: "#000000",
      swift: "#fa7343",
      kotlin: "#7f52ff",
      php: "#777bb4",
      html: "#e34c26",
      css: "#563d7c",
      sql: "#00758f",
      default: "#6b7280",
    };
    return colors[language.toLowerCase()] || colors.default;
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
      <View
        className="px-4 py-3 flex-row items-center justify-between"
        style={{
          backgroundColor: getLanguageColor(snippet.language) + "15",
        }}
      >
        <View className="flex-row items-center">
          <View
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: getLanguageColor(snippet.language) }}
          />
          <Text className="text-gray-800 font-semibold text-base">
            {snippet.title || snippet.language}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
          }}
        >
          <Text className="text-gray-600 text-xs font-medium uppercase">
            {snippet.language}
          </Text>
        </View>
      </View>

      {/* Code Block */}
      <ScrollView
        horizontal
        className="bg-gray-900"
        showsHorizontalScrollIndicator={false}
      >
        <View className="px-4 py-4">
          <Text className="text-gray-100 font-mono text-sm leading-6">
            {snippet.code}
          </Text>
        </View>
      </ScrollView>

      {/* Explanation */}
      {snippet.explanation && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'rgba(14, 165, 233, 0.08)',
          }}
        >
          <Text className="text-blue-900 font-medium text-sm mb-1">
            💡 Explanation
          </Text>
          <Text className="text-gray-700 text-sm leading-5">
            {snippet.explanation}
          </Text>
        </View>
      )}
    </View>
  );
};
