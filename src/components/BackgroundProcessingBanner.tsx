import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAudioProcessingStore } from '../state/audioProcessingStore';
import { Loader2, Check, AlertCircle, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

export default function BackgroundProcessingBanner() {
  const { jobs, removeJob } = useAudioProcessingStore();
  const activeJob = jobs.find((job) => job.status === 'transcribing' || job.status === 'generating');

  if (!activeJob) return null;

  const getStatusIcon = () => {
    switch (activeJob.status) {
      case 'transcribing':
      case 'generating':
        return <Loader2 size={20} color="#0ea5e9" className="animate-spin" />;
      case 'completed':
        return <Check size={20} color="#10b981" />;
      case 'error':
        return <AlertCircle size={20} color="#ef4444" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (activeJob.status) {
      case 'transcribing':
      case 'generating':
        return 'rgba(14, 165, 233, 0.1)';
      case 'completed':
        return 'rgba(16, 185, 129, 0.1)';
      case 'error':
        return 'rgba(239, 68, 68, 0.1)';
      default:
        return 'rgba(148, 163, 184, 0.1)';
    }
  };

  const getBorderColor = () => {
    switch (activeJob.status) {
      case 'transcribing':
      case 'generating':
        return '#0ea5e9';
      case 'completed':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  const getTextColor = () => {
    switch (activeJob.status) {
      case 'transcribing':
      case 'generating':
        return '#0ea5e9';
      case 'completed':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOutUp}
      style={{
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: getStatusColor(),
        borderRadius: 16,
        borderWidth: 1,
        borderColor: getBorderColor(),
        padding: 16,
        shadowColor: getBorderColor(),
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="mr-3">{getStatusIcon()}</View>
          <View className="flex-1">
            <Text
              className="font-semibold text-base"
              style={{ color: getTextColor() }}
            >
              {activeJob.status === 'error' ? 'Processing Failed' : activeJob.progressMessage}
            </Text>
            {activeJob.status !== 'error' && (
              <View className="mt-2 bg-white/50 rounded-full h-2 overflow-hidden">
                <View
                  style={{
                    width: `${activeJob.progress}%`,
                    backgroundColor: getBorderColor(),
                    height: '100%',
                    borderRadius: 9999,
                  }}
                />
              </View>
            )}
            {activeJob.error && (
              <Text className="text-sm mt-1" style={{ color: '#ef4444' }}>
                {activeJob.error}
              </Text>
            )}
          </View>
        </View>

        {(activeJob.status === 'completed' || activeJob.status === 'error') && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              removeJob(activeJob.id);
            }}
            className="ml-2 active:opacity-60"
          >
            <X size={20} color="#94a3b8" />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
