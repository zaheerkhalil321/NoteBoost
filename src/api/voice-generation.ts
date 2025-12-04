import * as FileSystem from "expo-file-system";
import { EncodingType } from "expo-file-system";

/**
 * Generate speech audio from text using OpenAI's text-to-speech API
 * Supports multiple voices for podcast-style conversations
 */

// Lazy load Audio module to avoid early initialization
const getAudio = async () => {
  const expoAV = await import("expo-av");
  return expoAV.Audio;
};

export type VoiceType = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

export interface VoiceSegment {
  text: string;
  voice: VoiceType;
  speaker: string; // e.g., "Host", "Guest", "Narrator"
}

/**
 * Parse podcast script into segments with different voices
 * Looks for patterns like "Host:", "Guest:", etc.
 */
export const parsePodcastScript = (script: string): VoiceSegment[] => {
  const segments: VoiceSegment[] = [];

  // Split by speaker patterns (e.g., "Host:", "Guest:", "Narrator:")
  const speakerPattern = /^(Host|Guest|Narrator|Speaker [12]):\s*/gim;
  const lines = script.split('\n');

  let currentSpeaker = "Host";
  let currentVoice: VoiceType = "alloy";
  let currentText = "";

  // Voice mapping for different speakers
  const voiceMap: { [key: string]: VoiceType } = {
    "Host": "alloy",
    "Guest": "nova",
    "Narrator": "onyx",
    "Speaker 1": "echo",
    "Speaker 2": "shimmer"
  };

  for (const line of lines) {
    const match = line.match(speakerPattern);

    if (match) {
      // Save previous segment if it exists
      if (currentText.trim()) {
        segments.push({
          text: currentText.trim(),
          voice: currentVoice,
          speaker: currentSpeaker
        });
      }

      // Start new segment
      currentSpeaker = match[1];
      currentVoice = voiceMap[currentSpeaker] || "alloy";
      currentText = line.replace(speakerPattern, "");
    } else {
      currentText += (currentText ? "\n" : "") + line;
    }
  }

  // Add the last segment
  if (currentText.trim()) {
    segments.push({
      text: currentText.trim(),
      voice: currentVoice,
      speaker: currentSpeaker
    });
  }

  // If no speakers found, treat entire script as single segment
  if (segments.length === 0) {
    segments.push({
      text: script.trim(),
      voice: "alloy",
      speaker: "Narrator"
    });
  }

  return segments;
};

/**
 * Generate audio from a single text segment using OpenAI TTS
 */
export const generateSpeechSegment = async (
  text: string,
  voice: VoiceType = "alloy",
  onProgress?: (progress: number) => void
): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key not found. Please add it in the ENV tab of Vibecode app.");
  }

  try {
    if (onProgress) onProgress(0.1);

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1", // or "tts-1-hd" for higher quality
        input: text,
        voice: voice,
        response_format: "mp3"
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI TTS failed: ${error}`);
    }

    if (onProgress) onProgress(0.5);

    // Save audio to file system
    const audioData = await response.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(audioData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const fileUri = `${FileSystem.cacheDirectory}tts_${Date.now()}_${voice}.mp3`;
    await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
      encoding: EncodingType.Base64,
    });

    if (onProgress) onProgress(1.0);

    return fileUri;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};

/**
 * Generate complete podcast audio from script with multiple voices
 */
export const generatePodcastAudio = async (
  script: string,
  onProgress?: (progress: number, currentSegment: number, totalSegments: number) => void
): Promise<string[]> => {
  const segments = parsePodcastScript(script);
  const audioFiles: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (onProgress) {
      onProgress((i / segments.length), i + 1, segments.length);
    }

    const audioUri = await generateSpeechSegment(
      segment.text,
      segment.voice,
      (segmentProgress) => {
        if (onProgress) {
          const totalProgress = (i + segmentProgress) / segments.length;
          onProgress(totalProgress, i + 1, segments.length);
        }
      }
    );

    audioFiles.push(audioUri);
  }

  if (onProgress) {
    onProgress(1.0, segments.length, segments.length);
  }

  return audioFiles;
};

/**
 * Concatenate multiple audio files into one
 * Note: This is a simplified version. For production, you might want to use FFmpeg
 */
export const concatenateAudioFiles = async (audioFiles: string[]): Promise<string> => {
  if (audioFiles.length === 0) {
    throw new Error("No audio files to concatenate");
  }

  if (audioFiles.length === 1) {
    return audioFiles[0];
  }

  // For React Native, we'll return the array and play them sequentially
  // A full concatenation would require FFmpeg or similar
  // For now, we'll just return the first file and handle sequential playback in the UI
  return audioFiles[0];
};

/**
 * Play audio segments sequentially
 */
export const playAudioSegments = async (
  audioFiles: string[],
  onSegmentChange?: (index: number) => void,
  onComplete?: () => void
): Promise<void> => {
  const Audio = await getAudio();
  const { sound } = await Audio.Sound.createAsync(
    { uri: audioFiles[0] },
    { shouldPlay: true }
  );

  let currentIndex = 0;

  sound.setOnPlaybackStatusUpdate(async (status: any) => {
    if (status.isLoaded && status.didJustFinish) {
      currentIndex++;

      if (currentIndex < audioFiles.length) {
        // Play next segment
        if (onSegmentChange) onSegmentChange(currentIndex);
        await sound.unloadAsync();
        const { sound: nextSound } = await Audio.Sound.createAsync(
          { uri: audioFiles[currentIndex] },
          { shouldPlay: true }
        );
        // Set up the status listener for the next sound
        (nextSound as any).setOnPlaybackStatusUpdate((sound as any)._onPlaybackStatusUpdate);
      } else {
        // All segments played
        await sound.unloadAsync();
        if (onComplete) onComplete();
      }
    }
  });
};

/**
 * Clean up temporary audio files
 */
export const cleanupAudioFiles = async (audioFiles: string[]): Promise<void> => {
  for (const file of audioFiles) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(file);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(file);
      }
    } catch (error) {
      console.error("Error deleting audio file:", error);
    }
  }
};
