import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase Configuration
 * 
 * IMPORTANT: Replace these with your actual Supabase credentials
 * Get them from: https://app.supabase.com/project/_/settings/api
 */
const SUPABASE_URL = 'https://edoerritiotovegznxww.supabase.co'; // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkb2Vycml0aW90b3ZlZ3pueHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTg1MTAsImV4cCI6MjA4MDE5NDUxMH0.QqudGtBFN1upZOqUEBgl_K9JK4qZphj1fEJLchSyE-s'; // Your anon/public key

// Supabase client instance
let supabase: SupabaseClient | null = null;

/**
 * Initialize Supabase client with AsyncStorage for session persistence
 * This ensures auth sessions persist across app restarts
 */
export const initializeSupabase = async (): Promise<SupabaseClient> => {
  try {
    if (supabase) {
      console.log('[Supabase] ✅ Already initialized');
      return supabase;
    }

    // Create Supabase client with AsyncStorage for auth persistence
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    console.log('[Supabase] ✅ Client initialized');
    return supabase;
  } catch (error) {
    console.error('[Supabase] ❌ Initialization error:', error);
    throw error;
  }
};

/**
 * Get Supabase client instance
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase not initialized. Call initializeSupabase() first.');
  }
  return supabase;
};

// Export config for reference
export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};
