import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trackReferredUserNote } from '../services/referralTracker';

export interface QuizItem {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizStats {
  completed: boolean;
  bestScore: number; // percentage 0-100
  attempts: number;
  lastAttemptDate: number;
  perfectScores: number; // count of 100% completions
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface TableData {
  headers: [string, string];
  rows: { col1: string; col2: string }[];
}

export interface CodeSnippet {
  language: string;
  code: string;
  title?: string;
  explanation?: string;
}

export interface ChartData {
  type: "line" | "bar" | "pie" | "area";
  title: string;
  data: { label: string; value: number; color?: string }[];
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export interface Diagram {
  type: "flowchart" | "sequence" | "mindmap" | "concept";
  title: string;
  description?: string;
  svgData?: string;
  mermaidCode?: string;
}

export interface Equation {
  title?: string;
  latex: string;
  explanation?: string;
}

export interface VisualContent {
  diagrams?: Diagram[];
  charts?: ChartData[];
  codeSnippets?: CodeSnippet[];
}

export interface TimestampedSegment {
  timestamp: number; // seconds
  text: string;
  keywords?: string[]; // Key terms mentioned in this segment
}

export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  createdAt: number;
  updatedAt: number;
  sourceType?: "audio" | "youtube" | "document" | "screenshot"; // Source of the note
  sourceImageUri?: string; // Original image for screenshot notes
  audioUri?: string; // Audio file URI for playback
  timestampedContent?: TimestampedSegment[]; // Timestamped transcript segments
  // Organization features
  tags?: string[]; // Tags for categorization
  isPinned?: boolean; // Pin important notes to the top
  // Processing state for background generation
  isProcessing?: boolean;
  processingProgress?: number; // 0-100
  processingMessage?: string;
  processingError?: string;
  // AI-generated structured content
  summary?: string;
  keyPoints?: string[];
  quiz?: QuizItem[];
  flashcards?: Flashcard[];
  transcript?: string;
  podcast?: string;
  table?: TableData;
  visualContent?: VisualContent;
  // Feynman Technique
  feynmanExplanation?: string; // Simplified explanation in user's own words
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

interface NotesState {
  notes: Note[];
  folders: Folder[];
  selectedFilter: "all" | "folder";
  selectedFolderId: string | null;
}

interface NotesActions {
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => string; // Return note ID
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addFolder: (name: string) => void;
  deleteFolder: (id: string) => void;
  setFilter: (filter: "all" | "folder", folderId?: string) => void;
  getFilteredNotes: () => Note[];
  updateNoteProgress: (id: string, progress: number, message: string) => void;
  completeNoteProcessing: (id: string, aiContent: Partial<Note>, error?: string) => void;
  togglePinNote: (id: string) => void;
  addTagToNote: (id: string, tag: string) => void;
  removeTagFromNote: (id: string, tag: string) => void;
  getAllTags: () => string[];
  clearAllData: () => void;
}

export const useNotesStore = create<NotesState & NotesActions>()(
  persist(
    (set, get) => ({
      notes: [],
      folders: [],
      selectedFilter: "all",
      selectedFolderId: null,

      addNote: (note): string => {
        const noteId = Date.now().toString() + Math.random().toString(36).substring(2, 11);
        const isFirstNote = get().notes.length === 0;

        set((state) => ({
          notes: [
            {
              ...note,
              id: noteId,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            ...state.notes,
          ],
        }));

        // Track note creation for referred users
        (async () => {
          try {
            const { createOrGetUser } = await import('../services/referralService');
            const user = await createOrGetUser();
            const totalNotes = get().notes.length;
            const noteSource = note.sourceType || 'text';

            await trackReferredUserNote(
              user.id,
              noteSource as 'text' | 'audio' | 'youtube' | 'document' | 'image',
              totalNotes,
              isFirstNote
            );
          } catch (error) {
            console.error('[NotesStore] Error tracking referred user note:', error);
          }
        })();

        return noteId;
      },

      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
          ),
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        })),

      addFolder: (name) =>
        set((state) => ({
          folders: [
            ...state.folders,
            {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
              name,
              createdAt: Date.now(),
            },
          ],
        })),

      deleteFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
          notes: state.notes.filter((note) => note.folderId !== id),
        })),

      setFilter: (filter, folderId) =>
        set({
          selectedFilter: filter,
          selectedFolderId: folderId || null,
        }),

      getFilteredNotes: () => {
        const state = get();
        if (state.selectedFilter === "folder" && state.selectedFolderId) {
          return state.notes.filter((note) => note.folderId === state.selectedFolderId);
        }
        return state.notes;
      },

      updateNoteProgress: (id, progress, message) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, processingProgress: progress, processingMessage: message, updatedAt: Date.now() }
              : note
          ),
        })),

      completeNoteProcessing: (id, aiContent, error) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  ...aiContent,
                  isProcessing: false,
                  processingProgress: error ? note.processingProgress : 100,
                  processingError: error,
                  updatedAt: Date.now(),
                }
              : note
          ),
        })),

      togglePinNote: (id) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, isPinned: !note.isPinned, updatedAt: Date.now() } : note
          ),
        })),

      addTagToNote: (id, tag) =>
        set((state) => ({
          notes: state.notes.map((note) => {
            if (note.id === id) {
              const tags = note.tags || [];
              if (!tags.includes(tag)) {
                return { ...note, tags: [...tags, tag], updatedAt: Date.now() };
              }
            }
            return note;
          }),
        })),

      removeTagFromNote: (id, tag) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, tags: (note.tags || []).filter((t) => t !== tag), updatedAt: Date.now() }
              : note
          ),
        })),

      getAllTags: () => {
        const state = get();
        const allTags = new Set<string>();
        state.notes.forEach((note) => {
          (note.tags || []).forEach((tag) => allTags.add(tag));
        });
        return Array.from(allTags).sort();
      },

      clearAllData: () =>
        set({
          notes: [],
          folders: [],
          selectedFilter: "all",
          selectedFolderId: null,
        }),
    }),
    {
      name: "notes-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
