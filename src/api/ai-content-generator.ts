import { getOpenAITextResponse } from "./chat-service";
import { AIMessage } from "../types/ai";
import { TableData } from "../state/notesStore";
import { useOnboardingStore, OnboardingAnswers } from "../state/onboardingStore";

export interface GeneratedNoteContent {
  title: string;
  summary: string;
  keyPoints: string[];
  quiz: QuizItem[];
  flashcards: Flashcard[];
  transcript: string;
  podcast: string;
  fullContent: string;
  table?: TableData;
}

export interface QuizItem {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Flashcard {
  front: string;
  back: string;
}

/**
 * Truncate text to a safe length for AI processing
 * Approximately 1 token = 4 characters normally, but some texts have poor efficiency
 * We'll use 100,000 chars as a conservative safe limit to handle edge cases
 */
const truncateText = (text: string, maxChars: number = 100000): string => {
  if (text.length <= maxChars) {
    return text;
  }

  console.log(`Truncating text from ${text.length} to ${maxChars} characters`);

  // Try to truncate at a paragraph break
  const truncated = text.substring(0, maxChars);
  const lastParagraph = truncated.lastIndexOf('\n\n');

  if (lastParagraph > maxChars * 0.8) {
    // If we found a paragraph break in the last 20%, use it
    return truncated.substring(0, lastParagraph) + '\n\n[Content truncated for length...]';
  }

  // Otherwise, truncate at a sentence
  const lastSentence = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('! '),
    truncated.lastIndexOf('? ')
  );

  if (lastSentence > maxChars * 0.8) {
    return truncated.substring(0, lastSentence + 1) + ' [Content truncated for length...]';
  }

  // Last resort: just cut at the limit
  return truncated + '... [Content truncated for length...]';
};

/**
 * Build personalization context from user's onboarding answers
 */
const buildPersonalizationContext = (userProfile: OnboardingAnswers | null): string => {
  if (!userProfile) return '';

  const context: string[] = [];

  // Add learning goal and style
  if (userProfile.learningGoal) {
    context.push(`The user's learning goal is: ${userProfile.learningGoal}`);
  }

  if (userProfile.studentType) {
    context.push(`The user identifies as: ${userProfile.studentType}`);
  }

  // Add what they struggle with
  if (userProfile.mainStruggle) {
    context.push(`They struggle with: ${userProfile.mainStruggle}`);
  }

  // Add their dream outcome
  if (userProfile.dreamOutcome) {
    context.push(`Their desired outcome is: ${userProfile.dreamOutcome}`);
  }

  // Add obstacles they face
  if (userProfile.obstacles && userProfile.obstacles.length > 0) {
    context.push(`Obstacles they face: ${userProfile.obstacles.join(', ')}`);
  }

  if (context.length === 0) return '';

  return `\n\nPERSONALIZATION CONTEXT (tailor the content to this user's needs):\n${context.join('\n')}\n`;
};

/**
 * Generate additional quiz questions from existing content
 * @param text - The source text to generate questions from
 * @param existingQuestions - Array of existing questions to avoid duplicates
 * @param count - Number of new questions to generate (default: 5)
 * @returns Array of new quiz questions
 */
export const generateAdditionalQuiz = async (
  text: string,
  existingQuestions: QuizItem[] = [],
  count: number = 5
): Promise<QuizItem[]> => {
  try {
    const safeText = truncateText(text, 50000);

    // Create a list of existing questions to avoid duplicates
    const existingQuestionsText = existingQuestions.length > 0
      ? `\n\nExisting questions (DO NOT duplicate these):\n${existingQuestions.map(q => `- ${q.question}`).join('\n')}`
      : '';

    const quizMessages: AIMessage[] = [
      {
        role: "user",
        content: `Create ${count} NEW multiple choice quiz questions based on this content. These questions should be DIFFERENT from any existing questions listed below.${existingQuestionsText}

Format as JSON array with this structure: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}].

Make questions challenging but fair. Ensure all 4 options are plausible. Cover different aspects of the content.

Only return the JSON array, no other text.

Content:
${safeText}`,
      },
    ];

    const quizResponse = await getOpenAITextResponse(quizMessages, { maxTokens: 1200 });
    let quiz: QuizItem[] = [];
    try {
      const jsonMatch = quizResponse.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        quiz = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log("Failed to parse additional quiz JSON:", e);
      quiz = [];
    }

    return quiz;
  } catch (error) {
    console.log("Failed to generate additional quiz questions:", error);
    throw error;
  }
};

/**
 * Generate additional flashcards from existing content
 * @param text - The source text to generate flashcards from
 * @param existingFlashcards - Array of existing flashcards to avoid duplicates
 * @param count - Number of new flashcards to generate (default: 10)
 * @returns Array of new flashcards
 */
export const generateAdditionalFlashcards = async (
  text: string,
  existingFlashcards: Flashcard[] = [],
  count: number = 10
): Promise<Flashcard[]> => {
  try {
    const safeText = truncateText(text, 50000);

    // Create a list of existing flashcards to avoid duplicates
    const existingFlashcardsText = existingFlashcards.length > 0
      ? `\n\nExisting flashcards (DO NOT duplicate these):\n${existingFlashcards.map(f => `- Front: ${f.front}`).join('\n')}`
      : '';

    const flashcardsMessages: AIMessage[] = [
      {
        role: "user",
        content: `Create ${count} NEW flashcards from this content. These flashcards should be DIFFERENT from any existing ones listed below.${existingFlashcardsText}

Format as JSON array with this structure: [{"front": "Question or term", "back": "Answer or definition"}].

Keep questions clear and concise. Keep answers brief but complete. Cover different concepts and terms from the content.

Only return the JSON array, no other text.

Content:
${safeText}`,
      },
    ];

    const flashcardsResponse = await getOpenAITextResponse(flashcardsMessages, { maxTokens: 1200 });
    let flashcards: Flashcard[] = [];
    try {
      const jsonMatch = flashcardsResponse.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log("Failed to parse additional flashcards JSON:", e);
      flashcards = [];
    }

    return flashcards;
  } catch (error) {
    console.log("Failed to generate additional flashcards:", error);
    throw error;
  }
};

/**
 * Generate comprehensive AI-powered note content from text
 * @param text - The source text (transcript, video content, etc.)
 * @param sourceType - Type of source: 'audio', 'youtube', 'document'
 * @returns Generated note content with all features
 */
export const generateNoteContent = async (
  text: string,
  sourceType: "audio" | "youtube" | "document"
): Promise<GeneratedNoteContent> => {
  try {
    // Get user profile for personalization
    const userProfile = useOnboardingStore.getState().userProfile;
    const personalizationContext = buildPersonalizationContext(userProfile);

    console.log('[AI Generation] Using personalization:', !!userProfile);

    // Truncate text if it's too long
    const safeText = truncateText(text);

    // For very long documents, use a more aggressive truncation for better AI performance
    const maxLength = sourceType === "document" ? 50000 : 100000;
    const optimizedText = safeText.length > maxLength ? truncateText(safeText, maxLength) : safeText;

    console.log(`AI Generation: Using ${optimizedText.length} characters for ${sourceType}`);

    // Generate title
    console.log('[AI Generation] Step 1: Generating title...');
    const titleMessages: AIMessage[] = [
      {
        role: "user",
        content: `Create a short, descriptive title (max 6 words) for this content:\n\n${optimizedText.substring(0, 500)}`,
      },
    ];
    const titleResponse = await getOpenAITextResponse(titleMessages, { maxTokens: 50 });
    const title = titleResponse.content.replace(/['"]/g, "").trim();
    console.log('[AI Generation] Title generated:', title);

    // Generate summary in student note format
    const summaryMessages: AIMessage[] = [
      {
        role: "user",
        content: `Create organized study notes from the following content. Format like how a student would actually take notes - clean, minimal, and readable.

FORMATTING RULES:
1. Use section headings with relevant emojis (e.g., "📚 Key Concepts", "🎯 Main Ideas", "💡 Important Points")
2. Use bullet points with the bullet circle character (•), NO long paragraphs
3. Each bullet should be concise (1-2 lines max)
4. For sub-bullets under main points, ALWAYS use the bullet circle character (•) with indentation (start with "  • ")
5. Include 2-4 section headings based on the content's topics
6. Add blank lines between sections for readability
7. DO NOT use ANY markdown formatting including: ** (bold), * (italics), __ (underline), - (dashes), > (blockquotes), or backticks for code. Write in plain text only.
8. ONLY use bullet circles (•) for all bullet points - no dashes, no asterisks, no hyphens
9. Keep it scannable - students should grasp the main ideas quickly${personalizationContext ? '\n10. TAILOR the content and explanations to help the user achieve their specific learning goals and overcome their challenges' : ''}

Example format:
📚 Main Topic
• Key concept with brief explanation in 1-2 lines
• Another important point with key term
  • Supporting detail as sub-bullet
  • Another related detail

💡 Additional Insights
• Important takeaway from the content
• Practical application or example${personalizationContext}

Content to create notes from:
${optimizedText}`,
      },
    ];
    console.log('[AI Generation] Step 2: Generating summary...');
    const summaryResponse = await getOpenAITextResponse(summaryMessages, { maxTokens: 800 });

    // Safely handle the summary response
    let summary = '';
    try {
      if (summaryResponse && summaryResponse.content && typeof summaryResponse.content === 'string') {
        summary = summaryResponse.content;
      } else {
        console.log('[AI Generation] Invalid summary response:', typeof summaryResponse?.content);
        summary = optimizedText.substring(0, 500) + '...'; // Fallback to truncated text
      }
    } catch (e) {
      console.log('[AI Generation] Error processing summary:', e);
      summary = optimizedText.substring(0, 500) + '...';
    }
    console.log('[AI Generation] Summary generated, length:', summary.length);

    // Generate key points with rich formatting
    const keyPointsMessages: AIMessage[] = [
      {
        role: "user",
        content: `Extract key points from the following content and organize them with clear formatting.

IMPORTANT FORMATTING RULES:
1. Start with 1-2 section headers using emojis (e.g., "🎯 Main Concepts")
2. DO NOT use ANY markdown formatting including: ** (bold), * (italics), __ (underline), - (dashes), > (blockquotes), or backticks for code. Write in plain text only.
3. Each point should be a complete sentence with clear wording
4. Focus on the most important insights and concepts

Example format:
🎯 Main Concepts
Keyword: Description with important terms
Another point with important concept clearly stated

Content to extract from:
${optimizedText}`,
      },
    ];
    console.log('[AI Generation] Step 3: Generating key points...');
    const keyPointsResponse = await getOpenAITextResponse(keyPointsMessages, { maxTokens: 800 });

    // Safely handle the key points response
    let keyPoints: string[] = [];
    try {
      if (keyPointsResponse && keyPointsResponse.content && typeof keyPointsResponse.content === 'string') {
        keyPoints = keyPointsResponse.content
          .split("\n")
          .filter((line: string) => line.trim().length > 0)
          .map((line: string) => line.trim());
      } else {
        console.log('[AI Generation] Invalid key points response:', typeof keyPointsResponse?.content);
        keyPoints = ['Summary of main content'];
      }
    } catch (e) {
      console.log('[AI Generation] Error processing key points:', e);
      keyPoints = ['Summary of main content'];
    }
    console.log('[AI Generation] Key points generated, count:', keyPoints.length);

    // Generate quiz
    console.log('[AI Generation] Step 4: Generating quiz...');
    const quizMessages: AIMessage[] = [
      {
        role: "user",
        content: `Create 5 multiple choice quiz questions based on this content. ${personalizationContext ? 'Focus on areas that align with the user\'s learning goals and help them overcome their challenges.' : ''} Format as JSON array with this structure: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]. Only return the JSON array, no other text:${personalizationContext}

${optimizedText}`,
      },
    ];
    const quizResponse = await getOpenAITextResponse(quizMessages, { maxTokens: 1000 });
    let quiz: QuizItem[] = [];
    try {
      if (quizResponse && quizResponse.content && typeof quizResponse.content === 'string') {
        const jsonMatch = quizResponse.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          quiz = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.log('[AI Generation] Failed to parse quiz JSON:', e);
      quiz = [];
    }
    console.log('[AI Generation] Quiz generated, questions:', quiz.length);

    // Generate flashcards
    console.log('[AI Generation] Step 5: Generating flashcards...');
    const flashcardsMessages: AIMessage[] = [
      {
        role: "user",
        content: `Create 6-8 flashcards from this content. ${personalizationContext ? 'Focus on key concepts that will help the user achieve their learning goals.' : ''} Format as JSON array with this structure: [{"front": "Question or term", "back": "Answer or definition"}]. Only return the JSON array, no other text:${personalizationContext}

${optimizedText}`,
      },
    ];
    const flashcardsResponse = await getOpenAITextResponse(flashcardsMessages, { maxTokens: 1000 });
    let flashcards: Flashcard[] = [];
    try {
      if (flashcardsResponse && flashcardsResponse.content && typeof flashcardsResponse.content === 'string') {
        const jsonMatch = flashcardsResponse.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          flashcards = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.log('[AI Generation] Failed to parse flashcards JSON:', e);
      flashcards = [];
    }
    console.log('[AI Generation] Flashcards generated, count:', flashcards.length);

    // Generate podcast script
    console.log('[AI Generation] Step 6: Generating podcast...');
    const podcastMessages: AIMessage[] = [
      {
        role: "user",
        content: `Create an engaging podcast script based on this content. Format it as a conversation between a Host and a Guest, with each speaker's dialogue clearly labeled (e.g., "Host:" and "Guest:"). Make it conversational and informative, as if explaining to a friend.${personalizationContext ? ' Ensure the discussion addresses topics relevant to the user\'s learning goals and helps overcome their specific challenges.' : ''}${personalizationContext}

${optimizedText}`,
      },
    ];
    const podcastResponse = await getOpenAITextResponse(podcastMessages, { maxTokens: 2000 });
    let podcast = '';
    try {
      if (podcastResponse && podcastResponse.content && typeof podcastResponse.content === 'string') {
        podcast = podcastResponse.content;
      } else {
        console.log('[AI Generation] Invalid podcast response:', typeof podcastResponse?.content);
        podcast = 'Podcast generation unavailable.';
      }
    } catch (e) {
      console.log('[AI Generation] Error processing podcast:', e);
      podcast = 'Podcast generation unavailable.';
    }
    console.log('[AI Generation] Podcast generated, length:', podcast.length);

    // Generate table with key data that would benefit from tabular format
    console.log('[AI Generation] Step 7: Generating table...');
    const tableMessages: AIMessage[] = [
      {
        role: "user",
        content: `Extract data from this content that would be best presented in a table format (comparisons, definitions, categories, timeline, specifications, etc.).

Create a two-column table with 4-8 rows.

FORMAT AS JSON:
{
  "headers": ["Column 1 Name", "Column 2 Name"],
  "rows": [
    {"col1": "Short label (2-4 words)", "col2": "Clear description or value (10-25 words)"},
    {"col1": "Another item", "col2": "Its description"}
  ]
}

GUIDELINES:
- Look for: definitions, comparisons, categories, features, timeline events, statistics, or key terms
- First column: Short labels, terms, names, or categories (2-4 words)
- Second column: Descriptions, values, or explanations (10-25 words)
- Make headers descriptive and relevant to the content
- Only include the most important information worth putting in a table
- If content doesn't have clear tabular data, create a simple key terms/definitions table

Only return the JSON object, no other text.

Content:
${optimizedText}`,
      },
    ];
    const tableResponse = await getOpenAITextResponse(tableMessages, { maxTokens: 1000 });
    let table: TableData | undefined;
    try {
      if (tableResponse && tableResponse.content && typeof tableResponse.content === 'string') {
        const jsonMatch = tableResponse.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          table = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.log('[AI Generation] Failed to parse table JSON:', e);
      table = undefined;
    }
    console.log('[AI Generation] Table generated:', !!table);

    // Format full content
    console.log('[AI Generation] Step 8: Formatting full content...');

    // Ensure all arrays are actually arrays to prevent "undefined is not a function"
    const safeKeyPoints = Array.isArray(keyPoints) ? keyPoints : [];
    const safeQuiz = Array.isArray(quiz) ? quiz : [];
    const safeFlashcards = Array.isArray(flashcards) ? flashcards : [];

    const fullContent = `
## Summary
${summary}

## Key Points
${safeKeyPoints.map((point) => `• ${point}`).join("\n")}

## Quiz
${safeQuiz
  .filter((q) => q && q.question && Array.isArray(q.options) && typeof q.correctAnswer === 'number')
  .map(
    (q, i) =>
      `**Question ${i + 1}:** ${q.question}\n${q.options.map((opt, j) => `${j + 1}. ${opt}`).join("\n")}\n*Answer: ${q.correctAnswer + 1}*`
  )
  .join("\n\n")}

## Flashcards
${safeFlashcards.filter((card) => card && card.front && card.back).map((card, i) => `**Card ${i + 1}**\nFront: ${card.front}\nBack: ${card.back}`).join("\n\n")}

## Transcript
${safeText}

## Podcast Script
${podcast}
`.trim();

    console.log('[AI Generation] Content generation complete!');
    console.log('[AI Generation] Title:', title);
    console.log('[AI Generation] Summary length:', summary.length);
    console.log('[AI Generation] Key points:', safeKeyPoints.length);
    console.log('[AI Generation] Quiz questions:', safeQuiz.length);
    console.log('[AI Generation] Flashcards:', safeFlashcards.length);
    console.log('[AI Generation] Has table:', !!table);

    return {
      title,
      summary,
      keyPoints: safeKeyPoints,
      quiz: safeQuiz,
      flashcards: safeFlashcards,
      transcript: safeText,
      podcast,
      fullContent,
      table,
    };
  } catch (error) {
    // Using console.log instead of console.error to avoid React Native error handling issues
    console.log("Failed to generate note content - error occurred");
    console.log("Error type:", typeof error);
    if (error && typeof error === 'object' && 'message' in error) {
      console.log("Error message:", error.message);
    }
    throw error;
  }
};
