import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface MarkdownEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function MarkdownEditor({
  value,
  onChangeText,
  placeholder = "Start typing...",
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: MarkdownEditorProps) {
  const textInputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const insertMarkdown = (prefix: string, suffix: string = '', placeholder: string = 'text') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { start, end } = selection;
    const selectedText = value.substring(start, end) || placeholder;
    const before = value.substring(0, start);
    const after = value.substring(end);

    const newText = `${before}${prefix}${selectedText}${suffix}${after}`;
    const newCursorPos = start + prefix.length + selectedText.length + suffix.length;

    onChangeText(newText);

    // Set cursor position after the inserted text
    setTimeout(() => {
      textInputRef.current?.setNativeProps({
        selection: { start: newCursorPos, end: newCursorPos }
      });
    }, 10);
  };

  const insertLineMarkdown = (prefix: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { start } = selection;
    const lines = value.split('\n');
    let currentPos = 0;
    let lineIndex = 0;

    // Find which line the cursor is on
    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length >= start) {
        lineIndex = i;
        break;
      }
      currentPos += lines[i].length + 1; // +1 for newline
    }

    const currentLine = lines[lineIndex];

    // Toggle: if line already has this prefix, remove it
    if (currentLine.startsWith(prefix)) {
      lines[lineIndex] = currentLine.substring(prefix.length);
    } else {
      lines[lineIndex] = prefix + currentLine;
    }

    const newText = lines.join('\n');
    onChangeText(newText);
  };

  const insertListItem = () => {
    insertLineMarkdown('- ');
  };

  const insertNumberedListItem = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { start } = selection;
    const lines = value.split('\n');
    let currentPos = 0;
    let lineIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length >= start) {
        lineIndex = i;
        break;
      }
      currentPos += lines[i].length + 1;
    }

    // Find the previous number if there is one
    let prevNumber = 1;
    if (lineIndex > 0) {
      const prevLine = lines[lineIndex - 1];
      const match = prevLine.match(/^(\d+)\.\s/);
      if (match) {
        prevNumber = parseInt(match[1]) + 1;
      }
    }

    lines[lineIndex] = `${prevNumber}. ${lines[lineIndex]}`;
    const newText = lines.join('\n');
    onChangeText(newText);
  };

  const insertHeading = () => {
    insertLineMarkdown('## ');
  };

  const insertBlockquote = () => {
    insertLineMarkdown('> ');
  };

  const insertCodeBlock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { start, end } = selection;
    const selectedText = value.substring(start, end) || 'code';
    const before = value.substring(0, start);
    const after = value.substring(end);

    const newText = `${before}\`\`\`\n${selectedText}\n\`\`\`${after}`;
    onChangeText(newText);
  };

  const insertLink = () => {
    Alert.prompt(
      'Insert Link',
      'Enter the URL',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Insert',
          onPress: (url) => {
            if (url) {
              const { start, end } = selection;
              const selectedText = value.substring(start, end) || 'link text';
              const before = value.substring(0, start);
              const after = value.substring(end);

              const newText = `${before}[${selectedText}](${url})${after}`;
              onChangeText(newText);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const formatButtons = [
    { icon: 'text', action: () => insertMarkdown('**', '**', 'bold'), label: 'Bold' },
    { icon: 'text-outline', action: () => insertMarkdown('*', '*', 'italic'), label: 'Italic' },
    { icon: 'code-slash', action: () => insertMarkdown('`', '`', 'code'), label: 'Code' },
    { icon: 'text', action: insertHeading, label: 'Heading' },
    { icon: 'list', action: insertListItem, label: 'List' },
    { icon: 'list-outline', action: insertNumberedListItem, label: 'Numbered' },
    { icon: 'chatbox-outline', action: insertBlockquote, label: 'Quote' },
    { icon: 'code', action: insertCodeBlock, label: 'Block' },
    { icon: 'link', action: insertLink, label: 'Link' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1">
        {/* Formatting Toolbar */}
        <View
          className="px-4 py-3 mb-3 rounded-2xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.9)',
            shadowColor: '#7DD3FC',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            {/* Undo/Redo */}
            {(onUndo || onRedo) && (
              <>
                {onUndo && (
                  <Pressable
                    onPress={onUndo}
                    disabled={!canUndo}
                    className="w-10 h-10 rounded-xl items-center justify-center mr-2"
                    style={{
                      backgroundColor: canUndo ? 'rgba(14, 165, 233, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                      opacity: canUndo ? 1 : 0.5,
                    }}
                  >
                    <Ionicons name="arrow-undo" size={18} color={canUndo ? "#0ea5e9" : "#94a3b8"} />
                  </Pressable>
                )}
                {onRedo && (
                  <Pressable
                    onPress={onRedo}
                    disabled={!canRedo}
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{
                      backgroundColor: canRedo ? 'rgba(14, 165, 233, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                      opacity: canRedo ? 1 : 0.5,
                    }}
                  >
                    <Ionicons name="arrow-redo" size={18} color={canRedo ? "#0ea5e9" : "#94a3b8"} />
                  </Pressable>
                )}
                <View className="w-px h-10 bg-[#cbd5e1] mr-3" />
              </>
            )}

            {formatButtons.map((button, index) => (
              <Pressable
                key={index}
                onPress={button.action}
                className="w-10 h-10 rounded-xl items-center justify-center mr-2 active:opacity-70"
                style={{
                  backgroundColor: 'rgba(14, 165, 233, 0.1)',
                }}
              >
                <Ionicons name={button.icon as any} size={18} color="#0ea5e9" />
              </Pressable>
            ))}
          </ScrollView>

          {/* Quick reference */}
          <Text className="text-xs text-[#64748b] mt-2">
            Tip: Select text before formatting or use **bold**, *italic*, `code`, {'>'} quote, ## heading
          </Text>
        </View>

        {/* Text Editor */}
        <TextInput
          ref={textInputRef}
          value={value}
          onChangeText={onChangeText}
          onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          multiline
          className="flex-1 text-base text-[#1e293b] p-5 rounded-2xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.9)',
            shadowColor: '#7DD3FC',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 2,
            textAlignVertical: 'top',
            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
