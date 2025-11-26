import { create } from 'zustand';

export interface AudioProcessingJob {
  id: string;
  audioUri: string;
  status: 'transcribing' | 'generating' | 'completed' | 'error';
  progress: number;
  progressMessage: string;
  error?: string;
  noteId?: string;
  createdAt: number;
}

interface AudioProcessingState {
  jobs: AudioProcessingJob[];

  // Actions
  addJob: (audioUri: string) => string;
  updateJobProgress: (id: string, progress: number, message: string, status?: AudioProcessingJob['status']) => void;
  completeJob: (id: string, noteId: string) => void;
  failJob: (id: string, error: string) => void;
  removeJob: (id: string) => void;
  getActiveJob: () => AudioProcessingJob | undefined;
  hasActiveJobs: () => boolean;
}

export const useAudioProcessingStore = create<AudioProcessingState>((set, get) => ({
  jobs: [],

  addJob: (audioUri: string) => {
    const id = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: AudioProcessingJob = {
      id,
      audioUri,
      status: 'transcribing',
      progress: 0,
      progressMessage: 'Starting transcription...',
      createdAt: Date.now(),
    };

    set((state) => ({
      jobs: [...state.jobs, job],
    }));

    console.log('[AudioProcessing] Added job:', id);
    return id;
  },

  updateJobProgress: (id: string, progress: number, message: string, status?: AudioProcessingJob['status']) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id
          ? {
              ...job,
              progress,
              progressMessage: message,
              ...(status && { status })
            }
          : job
      ),
    }));
  },

  completeJob: (id: string, noteId: string) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id
          ? {
              ...job,
              status: 'completed',
              progress: 100,
              progressMessage: 'Note created successfully!',
              noteId
            }
          : job
      ),
    }));

    // Auto-remove completed job after 3 seconds
    setTimeout(() => {
      get().removeJob(id);
    }, 3000);

    console.log('[AudioProcessing] Completed job:', id, 'Note:', noteId);
  },

  failJob: (id: string, error: string) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id
          ? { ...job, status: 'error', error, progressMessage: 'Failed to process audio' }
          : job
      ),
    }));

    console.log('[AudioProcessing] Failed job:', id, error);
  },

  removeJob: (id: string) => {
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
    }));
    console.log('[AudioProcessing] Removed job:', id);
  },

  getActiveJob: () => {
    const state = get();
    return state.jobs.find((job) => job.status === 'transcribing' || job.status === 'generating');
  },

  hasActiveJobs: () => {
    const state = get();
    return state.jobs.some((job) => job.status === 'transcribing' || job.status === 'generating');
  },
}));
