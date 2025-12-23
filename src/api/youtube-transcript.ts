import * as FileSystem from "expo-file-system";
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
    const rapidApiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
    const rapidApiHost = "youtube-transcripts-transcribe-youtube-video-to-text.p.rapidapi.com";

    // Helper to extract transcript text from various possible response shapes
    const extractTranscriptFromJson = (json: any): string | null => {
      if (!json) return null;
      if (typeof json === "string" && json.trim()) return json.trim();

      // Common top-level fields
      const candidates = [
        json.transcription,
        json.transcribe,
        json.transcript,
        json.text,
        json.result,
        json.output?.text,
        json.data?.transcription,
        json.data?.transcript,
        json.data?.text,
      ];

      for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
      }

      // Arrays of segments or strings
      if (Array.isArray(json)) {
        if (json.every((item) => typeof item === "string")) {
          return json.filter(Boolean).join(" ").trim();
        }

        // Array of objects with text fields
        const texts = json
          .map((item: any) => item?.text || item?.transcript || item?.transcribed_text || "")
          .filter(Boolean);
        if (texts.length) return texts.join(" ").trim();
      }

      if (Array.isArray(json.transcripts) && json.transcripts.length) {
        const texts = json.transcripts.map((t: any) => t?.text || t?.transcript || t?.content || "").filter(Boolean);
        if (texts.length) return texts.join(" ").trim();
      }

      return null;
    };

    // Try RapidAPI service first (if API key is available).
      try {

        const { controller, timeout } = createTimeoutController(120000);
        const rapidUrl = `https://${rapidApiHost}/transcribe`;

        const resp = await fetch(rapidUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // use header names recommended by RapidAPI
            "x-rapidapi-key": rapidApiKey,
            "x-rapidapi-host": rapidApiHost,
          },
          signal: controller.signal,
          body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}` }),
        });

        clearTimeout(timeout);

const json = await resp.json();
        console.log("🚀 ~ getYouTubeTranscript ~ json:", json)
        const transcript = extractTranscriptFromJson(json);
        
        if (transcript && transcript.trim()) {
          console.log("Transcript obtained from RapidAPI service");
          return transcript;
        }
      } catch (err) {
        console.warn("RapidAPI transcript attempt failed:", err);
        // Continue to fallback methods
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
