import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Equation } from "../state/notesStore";

interface EquationRendererProps {
  equation: Equation;
}

export const EquationRenderer: React.FC<EquationRendererProps> = ({ equation }) => {
  // Simple LaTeX to Unicode conversion for basic math symbols
  const renderLatex = (latex: string) => {
    let rendered = latex
      // Greek letters
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\gamma/g, "γ")
      .replace(/\\delta/g, "δ")
      .replace(/\\epsilon/g, "ε")
      .replace(/\\theta/g, "θ")
      .replace(/\\lambda/g, "λ")
      .replace(/\\mu/g, "μ")
      .replace(/\\pi/g, "π")
      .replace(/\\sigma/g, "σ")
      .replace(/\\phi/g, "φ")
      .replace(/\\omega/g, "ω")
      // Math operators
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\pm/g, "±")
      .replace(/\\infty/g, "∞")
      .replace(/\\sum/g, "∑")
      .replace(/\\int/g, "∫")
      .replace(/\\partial/g, "∂")
      .replace(/\\nabla/g, "∇")
      .replace(/\\sqrt/g, "√")
      // Relations
      .replace(/\\leq/g, "≤")
      .replace(/\\geq/g, "≥")
      .replace(/\\neq/g, "≠")
      .replace(/\\approx/g, "≈")
      .replace(/\\equiv/g, "≡")
      // Arrows
      .replace(/\\rightarrow/g, "→")
      .replace(/\\leftarrow/g, "←")
      .replace(/\\Rightarrow/g, "⇒")
      .replace(/\\Leftarrow/g, "⇐")
      // Remove remaining backslashes and braces for simple display
      .replace(/\\/g, "")
      .replace(/[{}]/g, "");

    return rendered;
  };

  return (
    <View
      style={{
        marginBottom: 24,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        shadowColor: '#A78BFA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* Header */}
      {equation.title && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
          }}
        >
          <View className="flex-row items-center">
            <Text className="text-2xl mr-2">∑</Text>
            <Text className="text-purple-900 font-bold text-lg">
              {equation.title}
            </Text>
          </View>
        </View>
      )}

      {/* Equation Display */}
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{
              backgroundColor: 'rgba(245, 243, 255, 0.95)',
              borderRadius: 20,
              paddingHorizontal: 32,
              paddingVertical: 24,
              borderWidth: 2,
              borderColor: 'rgba(196, 181, 253, 0.4)',
            }}
          >
            <Text className="text-purple-900 text-2xl font-semibold text-center">
              {renderLatex(equation.latex)}
            </Text>
          </View>
        </ScrollView>

        {/* LaTeX Source */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: 'rgba(248, 250, 252, 0.8)',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Text className="text-gray-500 text-xs mb-1 font-semibold">
            LaTeX Source:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text className="text-gray-700 text-sm font-mono">
              {equation.latex}
            </Text>
          </ScrollView>
        </View>
      </View>

      {/* Explanation */}
      {equation.explanation && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
            borderTopWidth: 1,
            borderTopColor: 'rgba(196, 181, 253, 0.3)',
          }}
        >
          <Text className="text-purple-900 font-semibold text-sm mb-1">
            📖 What this means:
          </Text>
          <Text className="text-gray-700 text-sm leading-5">
            {equation.explanation}
          </Text>
        </View>
      )}
    </View>
  );
};
