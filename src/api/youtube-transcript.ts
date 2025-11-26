import * as FileSystem from "expo-file-system/legacy";
import { transcribeAudio } from "./transcribe-audio";

/**
 * Create an AbortController with timeout
 */
const createTimeoutController = (timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeout };
};

/**
 * Download YouTube audio and transcribe it
 * @param videoId - YouTube video ID
 * @param onProgress - Optional callback to report progress
 * @returns The transcribed text
 */
const downloadAndTranscribeYouTubeAudio = async (
  videoId: string,
  onProgress?: (message: string) => void
): Promise<string> => {
  try {
    console.log("Downloading audio for video:", videoId);
    onProgress?.("Downloading audio from YouTube...");

    // Use a backend service to extract and download audio
    const audioUrl = `https://youtube-audio-extractor.fly.dev/audio?videoId=${videoId}`;

    // Download the audio file with progress tracking
    const audioUri = `${FileSystem.cacheDirectory}youtube_audio_${videoId}.m4a`;

    // Create download with callback for progress
    const downloadResumable = FileSystem.createDownloadResumable(
      audioUrl,
      audioUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        const percentage = Math.round(progress * 100);
        onProgress?.(`Downloading audio... ${percentage}%`);
      }
    );

    const downloadResult = await downloadResumable.downloadAsync();

    if (!downloadResult || downloadResult.status !== 200) {
      throw new Error("Failed to download audio");
    }

    console.log("Audio downloaded, starting transcription...");
    onProgress?.("Audio downloaded. Transcribing audio...");

    // Transcribe the audio
    const transcript = await transcribeAudio(downloadResult.uri);

    onProgress?.("Transcription complete!");

    // Clean up the temporary file
    try {
      await FileSystem.deleteAsync(audioUri, { idempotent: true });
    } catch (cleanupError) {
      console.warn("Failed to clean up audio file:", cleanupError);
    }

    return transcript;
  } catch (error) {
    console.error("Audio download and transcription error:", error);
    throw error;
  }
};

/**
 * Get YouTube video transcript
 * @param videoId - YouTube video ID
 * @param onProgress - Optional callback to report progress
 * @returns The transcript text
 */
export const getYouTubeTranscript = async (
  videoId: string,
  onProgress?: (message: string) => void
): Promise<string> => {
  try {
    // First, try to get captions if available
    console.log("Attempting to fetch captions for video:", videoId);
    onProgress?.("Checking for captions...");

    try {
      const apiUrl = `https://youtube-transcript-api.fly.dev/transcript?videoId=${videoId}`;

      const { controller, timeout } = createTimeoutController(15000); // Increased to 15s

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();

        if (data && Array.isArray(data) && data.length > 0) {
          const transcriptText = data
            .map((segment: { text: string }) => segment.text)
            .filter((text: string) => text && text.trim())
            .join(" ")
            .trim();

          if (transcriptText) {
            console.log("Captions found and extracted successfully");
            onProgress?.("Captions found!");
            return transcriptText;
          }
        }
      }
    } catch (captionError) {
      console.log("Captions not available, will try audio extraction:", captionError);
    }

    // If captions are not available, try audio transcription
    console.log("No captions found, attempting audio transcription...");
    onProgress?.("No captions found. Downloading audio...");
    const audioTranscript = await downloadAndTranscribeYouTubeAudio(videoId, onProgress);

    if (audioTranscript && audioTranscript.trim()) {
      console.log("Audio transcription successful");
      return audioTranscript;
    }

    throw new Error(
      "Unable to extract transcript from this video. Please try a different video."
    );
  } catch (error) {
    console.error("YouTube transcript error:", error);

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes("Network request failed")) {
        throw new Error(
          "Network error: Please check your internet connection and try again."
        );
      }
      if (error.message.includes("aborted") || error.name === "AbortError") {
        throw new Error(
          "Request timed out. The video may be too long. Please try a shorter video."
        );
      }
      throw error;
    }

    throw new Error("Failed to fetch YouTube transcript. Please try again.");
  }
};
