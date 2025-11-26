import { generateNoteContent } from "./ai-content-generator";
import { useNotesStore } from "../state/notesStore";
import { useGamificationStore } from "../state/gamificationStore";

/**
 * Process note generation in the background
 * This allows users to navigate away while AI content is being generated
 */
export const processNoteInBackground = async (
  noteId: string,
  transcript: string,
  sourceType: "audio" | "youtube" | "document"
): Promise<void> => {
  const { updateNoteProgress, completeNoteProcessing } = useNotesStore.getState();
  const { addXP } = useGamificationStore.getState();

  try {
    console.log(`[Background AI] Starting generation for note ${noteId}`);

    updateNoteProgress(noteId, 45, "🧠 Analyzing content...\nExtracting key insights");

    await new Promise(resolve => setTimeout(resolve, 300)); // Brief pause for UI update

    updateNoteProgress(noteId, 55, "📝 Generating summary...\nCreating concise overview");

    // Generate AI content
    const aiContent = await generateNoteContent(transcript, sourceType);

    updateNoteProgress(noteId, 75, "🎯 Creating flashcards...\nBuilding study materials");

    await new Promise(resolve => setTimeout(resolve, 300));

    updateNoteProgress(noteId, 88, "❓ Generating quiz...\nPreparing test questions");

    await new Promise(resolve => setTimeout(resolve, 300));

    updateNoteProgress(noteId, 95, "✨ Finalizing your note...\nAlmost there!");

    await new Promise(resolve => setTimeout(resolve, 500));

    // Complete the note with AI content
    completeNoteProcessing(noteId, {
      title: aiContent.title,
      content: aiContent.fullContent,
      summary: aiContent.summary,
      keyPoints: aiContent.keyPoints,
      quiz: aiContent.quiz,
      flashcards: aiContent.flashcards,
      transcript: aiContent.transcript,
      podcast: aiContent.podcast,
      table: aiContent.table,
    });

    // Award XP
    const xpAmount = sourceType === "youtube" ? 20 : sourceType === "audio" ? 15 : 10;
    addXP(xpAmount);

    console.log(`[Background AI] Note ${noteId} completed! +${xpAmount} XP awarded`);
  } catch (error) {
    console.error(`[Background AI] Failed to process note ${noteId}:`, error);

    const errorMessage = error instanceof Error
      ? error.message
      : "Failed to generate AI content. Please try again.";

    completeNoteProcessing(noteId, {}, errorMessage);
  }
};
