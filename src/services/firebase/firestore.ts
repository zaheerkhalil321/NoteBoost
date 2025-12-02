import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { getFirebaseFirestore } from './config';
import { getCurrentUserId } from './auth';
import NetInfo from '@react-native-community/netinfo';

/**
 * Firestore Collections Structure:
 * 
 * users/{userId}
 *   - referral_code: string
 *   - credits: number
 *   - created_at: timestamp
 *   - used_referral_code: string | null
 *   - email: string | null
 *   - name: string | null
 * 
 * referral_codes/{code} ← NEW: Lookup collection for O(1) access
 *   - user_id: string
 *   - created_at: timestamp
 * 
 * notes/{noteId}
 *   - user_id: string
 *   - title: string
 *   - content: string
 *   - source: string (text, audio, youtube, document, image)
 *   - created_at: timestamp
 *   - updated_at: timestamp
 * 
 * flashcards/{flashcardId}
 *   - user_id: string
 *   - note_id: string
 *   - question: string
 *   - answer: string
 *   - created_at: timestamp
 * 
 * quiz_progress/{progressId}
 *   - user_id: string
 *   - note_id: string
 *   - score: number
 *   - total_questions: number
 *   - completed_at: timestamp
 * 
 * learning_paths/{pathId}
 *   - user_id: string
 *   - title: string
 *   - notes: array of note_ids
 *   - created_at: timestamp
 * 
 * user_preferences/{userId}
 *   - theme: string
 *   - settings: object
 *   - updated_at: timestamp
 */

// Check if device is online
const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

// Check if WiFi is available (for large uploads)
const isWiFi = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.type === 'wifi' && (state.isConnected ?? false);
};

// ============================================
// USER SYNC
// ============================================

export interface UserData {
  referral_code: string;
  credits: number;
  created_at: number;
  used_referral_code?: string | null;
  email?: string | null;
  name?: string | null;
}

/**
 * Sync user data to Firestore
 * This is called after SQLite operations
 */
export const syncUserToFirestore = async (userId: string, userData: UserData): Promise<void> => {
  try {
    if (!(await isOnline())) {
      console.log('[Firestore] Offline, skipping user sync');
      return;
    }

    const db = getFirebaseFirestore();
    
    // 1. Sync user document
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      synced_at: serverTimestamp(),
    }, { merge: true });

    // 2. Create lookup entry for referral code (O(1) lookup instead of query!)
    // This is the key optimization - direct document access is much cheaper than querying
    if (userData.referral_code) {
      const codeRef = doc(db, 'referral_codes', userData.referral_code);
      await setDoc(codeRef, {
        user_id: userId,
        created_at: userData.created_at || Date.now(),
      }, { merge: true });
    }

    console.log('[Firestore] User synced:', userId);
  } catch (error) {
    console.error('[Firestore] User sync error:', error);
    // Don't throw - let the app continue with local data
  }
};

/**
 * Get user data from Firestore
 */
export const getUserFromFirestore = async (userId: string): Promise<UserData | null> => {
  try {
    const db = getFirebaseFirestore();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }

    return null;
  } catch (error) {
    console.error('[Firestore] Get user error:', error);
    return null;
  }
};

/**
 * Query Firestore for a user by referral code
 * Returns { id, data } or null
 * 
 * OPTIMIZED: Uses direct document lookup instead of collection query
 * Cost: 1 read (vs query which can be more expensive and slower)
 * 
 * Structure:
 * - referral_codes/{code} → { user_id: "abc123", created_at: timestamp }
 * - users/{user_id} → full user data
 */
export const getUserByReferralCode = async (referralCode: string): Promise<{ id: string; data: UserData } | null> => {
  try {
    if (!(await isOnline())) {
      console.log('[Firestore] Offline, cannot lookup referral code');
      return null;
    }

    const db = getFirebaseFirestore();
    
    // Step 1: Direct lookup in referral_codes collection (O(1) - very fast!)
    const codeRef = doc(db, 'referral_codes', referralCode);
    const codeDoc = await getDoc(codeRef);
    
    if (!codeDoc.exists()) {
      console.log('[Firestore] Referral code not found:', referralCode);
      
      // Fallback: Try old query method for backwards compatibility
      // (in case code was created before this optimization)
      console.log('[Firestore] Trying fallback query...');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('referral_code', '==', referralCode));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const docSnap = snapshot.docs[0];
      const data = docSnap.data() as UserData;
      
      // Migrate: Create lookup entry for future fast lookups
      const migrationRef = doc(db, 'referral_codes', referralCode);
      await setDoc(migrationRef, {
        user_id: docSnap.id,
        created_at: data.created_at || Date.now(),
      });
      console.log('[Firestore] Migrated referral code to lookup collection');
      
      return { id: docSnap.id, data };
    }
    
    // Step 2: Get the user ID from the lookup
    const codeData = codeDoc.data();
    const userId = codeData.user_id;
    
    // Step 3: Get full user data (another O(1) lookup)
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('[Firestore] User not found for code:', referralCode);
      return null;
    }
    
    const data = userDoc.data() as UserData;

    // Normalize created_at if it's a Firestore Timestamp
    if ((data as any).created_at?.toMillis) {
      (data as any).created_at = (data as any).created_at.toMillis();
    }

    console.log('[Firestore] Found user by referral code:', userId);
    return { id: userId, data };
  } catch (error) {
    console.error('[Firestore] getUserByReferralCode error:', error);
    return null;
  }
};

/**
 * Update user metadata (email, name)
 */
export const updateUserMetadata = async (
  userId: string,
  metadata: { email?: string; name?: string }
): Promise<void> => {
  try {
    if (!(await isOnline())) {
      console.log('[Firestore] Offline, metadata will sync later');
      return;
    }

    const db = getFirebaseFirestore();
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      ...metadata,
      updated_at: serverTimestamp(),
    });

    console.log('[Firestore] User metadata updated');
  } catch (error) {
    console.error('[Firestore] Update metadata error:', error);
  }
};

// ============================================
// NOTE SYNC
// ============================================

export interface NoteData {
  id: string;
  user_id: string;
  title: string;
  content: string;
  source: 'text' | 'audio' | 'youtube' | 'document' | 'image';
  created_at: number;
  updated_at: number;
}

/**
 * Sync note to Firestore
 */
export const syncNoteToFirestore = async (note: NoteData): Promise<void> => {
  try {
    if (!(await isOnline())) {
      console.log('[Firestore] Offline, note will sync later');
      return;
    }

    const db = getFirebaseFirestore();
    const noteRef = doc(db, 'notes', note.id);

    await setDoc(noteRef, {
      ...note,
      synced_at: serverTimestamp(),
    });

    console.log('[Firestore] Note synced:', note.id);
  } catch (error) {
    console.error('[Firestore] Note sync error:', error);
  }
};

/**
 * Sync multiple notes to Firestore (batch operation)
 */
export const syncNotesToFirestore = async (notes: NoteData[]): Promise<void> => {
  try {
    if (!(await isOnline())) {
      console.log('[Firestore] Offline, notes will sync later');
      return;
    }

    const db = getFirebaseFirestore();
    const batch = writeBatch(db);

    notes.forEach(note => {
      const noteRef = doc(db, 'notes', note.id);
      batch.set(noteRef, {
        ...note,
        synced_at: serverTimestamp(),
      });
    });

    await batch.commit();
    console.log(`[Firestore] ${notes.length} notes synced`);
  } catch (error) {
    console.error('[Firestore] Batch note sync error:', error);
  }
};

/**
 * Get all notes for a user from Firestore
 */
export const getNotesFromFirestore = async (userId: string): Promise<NoteData[]> => {
  try {
    const db = getFirebaseFirestore();
    const notesRef = collection(db, 'notes');
    const q = query(notesRef, where('user_id', '==', userId));
    
    const querySnapshot = await getDocs(q);
    const notes: NoteData[] = [];

    querySnapshot.forEach(doc => {
      notes.push(doc.data() as NoteData);
    });

    console.log(`[Firestore] Retrieved ${notes.length} notes`);
    return notes;
  } catch (error) {
    console.error('[Firestore] Get notes error:', error);
    return [];
  }
};

/**
 * Delete note from Firestore
 */
export const deleteNoteFromFirestore = async (noteId: string): Promise<void> => {
  try {
    if (!(await isOnline())) {
      console.log('[Firestore] Offline, deletion will sync later');
      return;
    }

    const db = getFirebaseFirestore();
    const noteRef = doc(db, 'notes', noteId);
    await deleteDoc(noteRef);

    console.log('[Firestore] Note deleted:', noteId);
  } catch (error) {
    console.error('[Firestore] Delete note error:', error);
  }
};

// ============================================
// FLASHCARD SYNC
// ============================================

export interface FlashcardData {
  id: string;
  user_id: string;
  note_id: string;
  question: string;
  answer: string;
  created_at: number;
}

/**
 * Sync flashcard to Firestore
 */
export const syncFlashcardToFirestore = async (flashcard: FlashcardData): Promise<void> => {
  try {
    if (!(await isOnline())) {
      console.log('[Firestore] Offline, flashcard will sync later');
      return;
    }

    const db = getFirebaseFirestore();
    const flashcardRef = doc(db, 'flashcards', flashcard.id);

    await setDoc(flashcardRef, {
      ...flashcard,
      synced_at: serverTimestamp(),
    });

    console.log('[Firestore] Flashcard synced:', flashcard.id);
  } catch (error) {
    console.error('[Firestore] Flashcard sync error:', error);
  }
};

// ============================================
// QUIZ PROGRESS SYNC
// ============================================

export interface QuizProgressData {
  id: string;
  user_id: string;
  note_id: string;
  score: number;
  total_questions: number;
  completed_at: number;
}

/**
 * Sync quiz progress to Firestore
 */
export const syncQuizProgressToFirestore = async (progress: QuizProgressData): Promise<void> => {
  try {
    if (!(await isOnline())) {
      console.log('[Firestore] Offline, quiz progress will sync later');
      return;
    }

    const db = getFirebaseFirestore();
    const progressRef = doc(db, 'quiz_progress', progress.id);

    await setDoc(progressRef, {
      ...progress,
      synced_at: serverTimestamp(),
    });

    console.log('[Firestore] Quiz progress synced:', progress.id);
  } catch (error) {
    console.error('[Firestore] Quiz progress sync error:', error);
  }
};

// ============================================
// LEARNING PATH SYNC
// ============================================

export interface LearningPathData {
  id: string;
  user_id: string;
  title: string;
  notes: string[]; // array of note IDs
  created_at: number;
}

/**
 * Sync learning path to Firestore
 */
export const syncLearningPathToFirestore = async (path: LearningPathData): Promise<void> => {
  try {
    if (!(await isOnline())) {
      console.log('[Firestore] Offline, learning path will sync later');
      return;
    }

    const db = getFirebaseFirestore();
    const pathRef = doc(db, 'learning_paths', path.id);

    await setDoc(pathRef, {
      ...path,
      synced_at: serverTimestamp(),
    });

    console.log('[Firestore] Learning path synced:', path.id);
  } catch (error) {
    console.error('[Firestore] Learning path sync error:', error);
  }
};

// ============================================
// USER PREFERENCES SYNC
// ============================================

export interface UserPreferencesData {
  user_id: string;
  theme?: string;
  settings?: Record<string, any>;
  updated_at: number;
}

/**
 * Sync user preferences to Firestore
 */
export const syncUserPreferencesToFirestore = async (
  userId: string,
  preferences: UserPreferencesData
): Promise<void> => {
  try {
    if (!(await isOnline())) {
      console.log('[Firestore] Offline, preferences will sync later');
      return;
    }

    const db = getFirebaseFirestore();
    const prefsRef = doc(db, 'user_preferences', userId);

    await setDoc(prefsRef, {
      ...preferences,
      synced_at: serverTimestamp(),
    }, { merge: true });

    console.log('[Firestore] Preferences synced');
  } catch (error) {
    console.error('[Firestore] Preferences sync error:', error);
  }
};

/**
 * Get user preferences from Firestore
 */
export const getUserPreferencesFromFirestore = async (
  userId: string
): Promise<UserPreferencesData | null> => {
  try {
    const db = getFirebaseFirestore();
    const prefsRef = doc(db, 'user_preferences', userId);
    const prefsDoc = await getDoc(prefsRef);

    if (prefsDoc.exists()) {
      return prefsDoc.data() as UserPreferencesData;
    }

    return null;
  } catch (error) {
    console.error('[Firestore] Get preferences error:', error);
    return null;
  }
};

// ============================================
// REAL-TIME SYNC LISTENERS
// ============================================

/**
 * Listen to user data changes in real-time
 */
export const listenToUserChanges = (
  userId: string,
  callback: (userData: UserData | null) => void
): (() => void) => {
  const db = getFirebaseFirestore();
  const userRef = doc(db, 'users', userId);

  return onSnapshot(
    userRef,
    (doc) => {
      if (doc.exists()) {
        callback(doc.data() as UserData);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('[Firestore] User listener error:', error);
      callback(null);
    }
  );
};

/**
 * Listen to notes changes in real-time
 */
export const listenToNotesChanges = (
  userId: string,
  callback: (notes: NoteData[]) => void
): (() => void) => {
  const db = getFirebaseFirestore();
  const notesRef = collection(db, 'notes');
  const q = query(notesRef, where('user_id', '==', userId));

  return onSnapshot(
    q,
    (querySnapshot) => {
      const notes: NoteData[] = [];
      querySnapshot.forEach(doc => {
        notes.push(doc.data() as NoteData);
      });
      callback(notes);
    },
    (error) => {
      console.error('[Firestore] Notes listener error:', error);
      callback([]);
    }
  );
};

// ============================================
// BATCH SYNC OPERATIONS
// ============================================

/**
 * Sync all local data to Firestore
 * Call this when user comes online or on WiFi
 */
export const syncAllDataToFirestore = async (
  userId: string,
  localData: {
    user?: UserData;
    notes?: NoteData[];
    flashcards?: FlashcardData[];
    quizProgress?: QuizProgressData[];
    learningPaths?: LearningPathData[];
    preferences?: UserPreferencesData;
  }
): Promise<void> => {
  try {
    const online = await isOnline();
    if (!online) {
      console.log('[Firestore] Offline, cannot sync');
      return;
    }

    console.log('[Firestore] Starting full sync...');

    // Sync user data
    if (localData.user) {
      await syncUserToFirestore(userId, localData.user);
    }

    // Sync notes
    if (localData.notes && localData.notes.length > 0) {
      await syncNotesToFirestore(localData.notes);
    }

    // Sync flashcards
    if (localData.flashcards) {
      for (const flashcard of localData.flashcards) {
        await syncFlashcardToFirestore(flashcard);
      }
    }

    // Sync quiz progress
    if (localData.quizProgress) {
      for (const progress of localData.quizProgress) {
        await syncQuizProgressToFirestore(progress);
      }
    }

    // Sync learning paths
    if (localData.learningPaths) {
      for (const path of localData.learningPaths) {
        await syncLearningPathToFirestore(path);
      }
    }

    // Sync preferences
    if (localData.preferences) {
      await syncUserPreferencesToFirestore(userId, localData.preferences);
    }

    console.log('[Firestore] Full sync completed');
  } catch (error) {
    console.error('[Firestore] Full sync error:', error);
  }
};

// Export network utilities
export { isOnline, isWiFi };
