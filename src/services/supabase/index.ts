// Supabase Services - Main Export File

// Export Supabase config
export {
  initializeSupabase,
  getSupabaseClient,
  supabaseConfig,
} from './config';

// Export Supabase Auth
export {
  initializeAnonymousAuth,
  getCurrentUserId,
  getCurrentUser,
  signOut,
  onAuthStateChange,
} from './auth';

// Export Supabase Database
export {
  syncUserToSupabase,
  getUserFromSupabase,
  getUserByReferralCode,
  syncNoteToSupabase,
  syncNotesToSupabase,
  getNotesFromSupabase,
  deleteNoteFromSupabase,
  isOnline,
  // Export with old names for compatibility
  syncUserToSupabase as syncUserToFirestore,
  syncNotesToSupabase as syncNotesToFirestore,
} from './database';

// Export types
export type { UserData, NoteData } from './database';
