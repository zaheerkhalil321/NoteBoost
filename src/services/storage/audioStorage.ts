import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';

/**
 * Local Audio Storage Service
 * 
 * Since Firebase Storage is not available yet, all audio recordings
 * are stored locally using expo-file-system.
 * 
 * Storage Location: {FileSystem.documentDirectory}audio/
 * 
 * Features:
 * - Store audio recordings locally
 * - Compress audio files
 * - Auto-delete old recordings after X days
 * - Get audio file info (size, duration, etc.)
 */

const AUDIO_DIRECTORY = `${FileSystem.documentDirectory}audio/`;
const MAX_AUDIO_AGE_DAYS = 30; // Auto-delete audio older than 30 days

/**
 * Initialize audio storage directory
 */
export const initializeAudioStorage = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(AUDIO_DIRECTORY);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(AUDIO_DIRECTORY, { intermediates: true });
      console.log('[AudioStorage] Directory created:', AUDIO_DIRECTORY);
    } else {
      console.log('[AudioStorage] Directory already exists');
    }
    
    // Clean up old recordings
    await cleanupOldRecordings();
  } catch (error) {
    console.error('[AudioStorage] Initialization error:', error);
    throw error;
  }
};

/**
 * Save audio recording to local storage
 * @param audioUri - URI of the audio file from recording
 * @param noteId - ID of the note this audio belongs to
 * @returns Path to saved audio file
 */
export const saveAudioRecording = async (
  audioUri: string,
  noteId: string
): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = `${noteId}_${timestamp}.m4a`;
    const destinationUri = `${AUDIO_DIRECTORY}${fileName}`;
    
    // Copy/move the audio file to our storage directory
    await FileSystem.copyAsync({
      from: audioUri,
      to: destinationUri,
    });
    
    const fileInfo = await FileSystem.getInfoAsync(destinationUri);
    const sizeInMB = ((fileInfo as any).size || 0) / (1024 * 1024);
    
    console.log(`[AudioStorage] Audio saved: ${fileName} (${sizeInMB.toFixed(2)} MB)`);
    
    return destinationUri;
  } catch (error) {
    console.error('[AudioStorage] Save error:', error);
    throw error;
  }
};

/**
 * Get audio file URI for a note
 * @param noteId - ID of the note
 * @returns URI of the audio file or null if not found
 */
export const getAudioForNote = async (noteId: string): Promise<string | null> => {
  try {
    const files = await FileSystem.readDirectoryAsync(AUDIO_DIRECTORY);
    const audioFile = files.find(file => file.startsWith(`${noteId}_`));
    
    if (audioFile) {
      return `${AUDIO_DIRECTORY}${audioFile}`;
    }
    
    return null;
  } catch (error) {
    console.error('[AudioStorage] Get audio error:', error);
    return null;
  }
};

/**
 * Delete audio file for a note
 * @param noteId - ID of the note
 */
export const deleteAudioForNote = async (noteId: string): Promise<void> => {
  try {
    const audioUri = await getAudioForNote(noteId);
    
    if (audioUri) {
      await FileSystem.deleteAsync(audioUri, { idempotent: true });
      console.log('[AudioStorage] Audio deleted:', audioUri);
    }
  } catch (error) {
    console.error('[AudioStorage] Delete error:', error);
  }
};

/**
 * Get all audio files
 * @returns Array of audio file info
 */
export const getAllAudioFiles = async (): Promise<Array<{
  uri: string;
  fileName: string;
  noteId: string;
  size: number;
  createdAt: number;
}>> => {
  try {
    const files = await FileSystem.readDirectoryAsync(AUDIO_DIRECTORY);
    const audioFiles = [];
    
    for (const fileName of files) {
      const uri = `${AUDIO_DIRECTORY}${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      // Extract note ID from filename (format: noteId_timestamp.m4a)
      const noteId = fileName.split('_')[0];
      const timestamp = parseInt(fileName.split('_')[1].replace('.m4a', ''));
      
      audioFiles.push({
        uri,
        fileName,
        noteId,
        size: (fileInfo as any).size || 0,
        createdAt: timestamp,
      });
    }
    
    return audioFiles;
  } catch (error) {
    console.error('[AudioStorage] Get all files error:', error);
    return [];
  }
};

/**
 * Get total storage used by audio files
 * @returns Size in bytes
 */
export const getTotalAudioStorageUsed = async (): Promise<number> => {
  try {
    const audioFiles = await getAllAudioFiles();
    return audioFiles.reduce((total, file) => total + file.size, 0);
  } catch (error) {
    console.error('[AudioStorage] Get total storage error:', error);
    return 0;
  }
};

/**
 * Get storage info in a human-readable format
 */
export const getStorageInfo = async (): Promise<{
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeMB: number;
  oldestFile: Date | null;
  newestFile: Date | null;
}> => {
  try {
    const audioFiles = await getAllAudioFiles();
    const totalSizeBytes = audioFiles.reduce((total, file) => total + file.size, 0);
    
    let oldestFile: Date | null = null;
    let newestFile: Date | null = null;
    
    if (audioFiles.length > 0) {
      const timestamps = audioFiles.map(f => f.createdAt);
      oldestFile = new Date(Math.min(...timestamps));
      newestFile = new Date(Math.max(...timestamps));
    }
    
    return {
      totalFiles: audioFiles.length,
      totalSizeBytes,
      totalSizeMB: totalSizeBytes / (1024 * 1024),
      oldestFile,
      newestFile,
    };
  } catch (error) {
    console.error('[AudioStorage] Get storage info error:', error);
    return {
      totalFiles: 0,
      totalSizeBytes: 0,
      totalSizeMB: 0,
      oldestFile: null,
      newestFile: null,
    };
  }
};

/**
 * Clean up old audio recordings (older than MAX_AUDIO_AGE_DAYS)
 */
export const cleanupOldRecordings = async (): Promise<number> => {
  try {
    const audioFiles = await getAllAudioFiles();
    const now = Date.now();
    const maxAge = MAX_AUDIO_AGE_DAYS * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    
    let deletedCount = 0;
    
    for (const file of audioFiles) {
      const age = now - file.createdAt;
      
      if (age > maxAge) {
        await FileSystem.deleteAsync(file.uri, { idempotent: true });
        deletedCount++;
        console.log(`[AudioStorage] Deleted old recording: ${file.fileName}`);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`[AudioStorage] Cleanup: Deleted ${deletedCount} old recordings`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('[AudioStorage] Cleanup error:', error);
    return 0;
  }
};

/**
 * Delete all audio files (use with caution!)
 */
export const deleteAllAudioFiles = async (): Promise<void> => {
  try {
    await FileSystem.deleteAsync(AUDIO_DIRECTORY, { idempotent: true });
    await FileSystem.makeDirectoryAsync(AUDIO_DIRECTORY, { intermediates: true });
    console.log('[AudioStorage] All audio files deleted');
  } catch (error) {
    console.error('[AudioStorage] Delete all error:', error);
  }
};

/**
 * Check if device is on WiFi (for future cloud upload when available)
 */
export const isOnWiFi = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.type === 'wifi' && (state.isConnected ?? false);
  } catch (error) {
    console.error('[AudioStorage] WiFi check error:', error);
    return false;
  }
};

/**
 * Get file info for an audio URI
 */
export const getAudioFileInfo = async (uri: string): Promise<{
  exists: boolean;
  size: number;
  sizeMB: number;
  modificationTime: number;
} | null> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists) {
      return null;
    }
    
    return {
      exists: true,
      size: (fileInfo as any).size || 0,
      sizeMB: ((fileInfo as any).size || 0) / (1024 * 1024),
      modificationTime: (fileInfo as any).modificationTime || 0,
    };
  } catch (error) {
    console.error('[AudioStorage] Get file info error:', error);
    return null;
  }
};

/**
 * Move audio file (for renaming or organizing)
 */
export const moveAudioFile = async (
  fromUri: string,
  toFileName: string
): Promise<string> => {
  try {
    const toUri = `${AUDIO_DIRECTORY}${toFileName}`;
    
    await FileSystem.moveAsync({
      from: fromUri,
      to: toUri,
    });
    
    console.log('[AudioStorage] Audio file moved:', toFileName);
    return toUri;
  } catch (error) {
    console.error('[AudioStorage] Move file error:', error);
    throw error;
  }
};

// Export constants
export { AUDIO_DIRECTORY, MAX_AUDIO_AGE_DAYS };
