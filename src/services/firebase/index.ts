// Firebase Services - Main Export File

// Export Firebase config
export { 
  initializeFirebase, 
  getFirebaseApp, 
  getFirebaseAuth, 
  getFirebaseFirestore,
  firebaseConfig 
} from './config';

// Export Firebase Auth
export {
  initializeAnonymousAuth,
  getCurrentUser,
  getCurrentUserId,
  linkAnonymousAccountWithEmail,
  onAuthStateChange,
  isAnonymousUser,
  getUserMetadata,
  clearAuthCache
} from './auth';

// Export Firestore Sync
export {
  // User sync
  syncUserToFirestore,
  getUserFromFirestore,
  updateUserMetadata,
  
  // Note sync
  syncNoteToFirestore,
  syncNotesToFirestore,
  getNotesFromFirestore,
  deleteNoteFromFirestore,
  
  // Flashcard sync
  syncFlashcardToFirestore,
  
  // Quiz progress sync
  syncQuizProgressToFirestore,
  
  // Learning path sync
  syncLearningPathToFirestore,
  
  // User preferences sync
  syncUserPreferencesToFirestore,
  getUserPreferencesFromFirestore,
  
  // Real-time listeners
  listenToUserChanges,
  listenToNotesChanges,
  
  // Batch sync
  syncAllDataToFirestore,
  
  // Network utilities
  isOnline,
  isWiFi,
  
  // Types
  type UserData,
  type NoteData,
  type FlashcardData,
  type QuizProgressData,
  type LearningPathData,
  type UserPreferencesData
} from './firestore';
