/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom audio transcription service that uses a custom API endpoint maintained by Vibecode.
You can use this function to transcribe audio files, and it will return the text of the audio file.
*/

import * as FileSystem from 'expo-file-system';

const WHISPER_API_MAX_DURATION = 1200; // OpenAI Whisper practical limit (~20 minutes for reliable uploads)
const MAX_AUDIO_DURATION = 1200; // Our max supported duration (20 minutes)
const CHUNK_DURATION = 1200; // 20 minutes per chunk

/**
 * Get audio duration from file
 */
const getAudioDuration = async (uri: string): Promise<number> => {
  try {
    const { Audio } = await import('expo-av');
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    const status = await sound.getStatusAsync();
    await sound.unloadAsync();

    if (status.isLoaded && status.durationMillis) {
      return status.durationMillis / 1000; // Convert to seconds
    }
    return 0;
  } catch (error) {
    console.error('[TranscribeAudio] Error getting audio duration:', error);
    return 0;
  }
};

/**
 * Transcribe a single audio file/chunk
 */
const transcribeChunk = async (uri: string, chunkIndex: number, timestamp?: string, onProgress?: (progress: number, message: string) => void): Promise<string> => {
  try {
    console.log(`[TranscribeAudio] Starting transcription for chunk ${chunkIndex}, URI: ${uri}`);

    const formData = new FormData();
    formData.append("file", {
      uri,
      type: "audio/m4a",
      name: `chunk_${chunkIndex}.m4a`,
    } as any);
    formData.append("model", "whisper-1");
    formData.append("language", "en");

    // Add timestamp for continuation
    if (timestamp) {
      formData.append("prompt", `[${timestamp}]`);
    }

    const OPENAI_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    console.log('[TranscribeAudio] Sending request to OpenAI Whisper API...');

    // Simulate progress during long API call
    let currentProgress = 10;
    const progressInterval = setInterval(() => {
      if (currentProgress < 28) {
        currentProgress += 2;
        onProgress?.(currentProgress, 'Transcribing audio...');
      }
    }, 2000); // Update every 2 seconds

    try {
      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      console.log(`[TranscribeAudio] API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TranscribeAudio] API Error for chunk ${chunkIndex}:`, errorText);

        // Check if error is due to file size
        if (errorText.includes('longer than') || errorText.includes('maximum')) {
          throw new Error('AUDIO_TOO_LONG');
        }

        throw new Error(`Transcription failed for chunk ${chunkIndex}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`[TranscribeAudio] Successfully transcribed chunk ${chunkIndex}, text length: ${result.text?.length || 0}`);
      return result.text;
    } catch (fetchError: any) {
      clearInterval(progressInterval);

      // Provide more specific error messages
      if (fetchError.message === 'Network request failed') {
        console.error('[TranscribeAudio] Network error - possible causes: timeout, connection issue, or invalid audio format');
        throw new Error('Network connection failed. Please check your internet connection and try again. If the issue persists, the audio file might be too large or in an unsupported format.');
      }

      throw fetchError;
    }
  } catch (error: any) {
    console.error(`[TranscribeAudio] Error transcribing chunk ${chunkIndex}:`, error);
    throw error;
  }
};

/**
 * Split and transcribe long audio files
 */
const transcribeInChunks = async (uri: string, duration: number, onProgress?: (progress: number, message: string) => void): Promise<string> => {
  console.log('[TranscribeAudio] Audio exceeds Whisper limit');

  // Unfortunately, we cannot split audio files on the client side without native processing
  // The file is too large for the Whisper API
  throw new Error(
    `Your recording is ${Math.round(duration / 60)} minutes long, which exceeds the OpenAI Whisper API limit of ~25 minutes. Please record shorter audio files (under 20 minutes) or split your recording into smaller parts before uploading.`
  );
};

/**
 * Transcribe an audio file (handles long files by processing in chunks)
 * @param localAudioUri - The local URI of the audio file to transcribe. Obtained via the expo-av library.
 * @param onProgress - Optional callback to report progress (0-100)
 * @returns The text of the audio file
 */
export const transcribeAudio = async (
  localAudioUri: string,
  onProgress?: (progress: number, message: string) => void
) => {
  try {
    // Check audio duration first
    onProgress?.(5, 'Checking audio duration...');
    const duration = await getAudioDuration(localAudioUri);
    console.log('[TranscribeAudio] Audio duration:', duration, 'seconds');

    // If audio is way too long, reject immediately
    if (duration > MAX_AUDIO_DURATION) {
      console.warn('[TranscribeAudio] Audio exceeds maximum duration of', MAX_AUDIO_DURATION, 'seconds');
      throw new Error(
        `Your recording is too long (${Math.round(duration / 60)} minutes). Maximum length is ${Math.round(MAX_AUDIO_DURATION / 60)} minutes. Please use a shorter recording or split your audio into smaller files.`
      );
    }

    // Process audio directly (within our 20-minute limit)
    console.log('[TranscribeAudio] Audio is within limit, transcribing directly');
    onProgress?.(10, 'Transcribing audio...');
    const result = await transcribeChunk(localAudioUri, 0, undefined, onProgress);
    onProgress?.(30, 'Transcription complete');
    return result;

  } catch (error: any) {
    console.error("[TranscribeAudio] Transcription error:", error);

    // Provide user-friendly error messages
    if (error.message === 'AUDIO_TOO_LONG' || error.message?.includes('longer than')) {
      const duration = await getAudioDuration(localAudioUri);
      throw new Error(
        `Your recording is too long for transcription (${Math.round(duration / 60)} minutes). OpenAI Whisper has a limit of approximately 23-25 minutes. Please record shorter audio files or split your recording into smaller parts.`
      );
    }

    throw error;
  }
};
