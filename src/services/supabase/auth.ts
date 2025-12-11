import { getSupabaseClient } from './config';
import * as SecureStore from 'expo-secure-store';
import { User } from '@supabase/supabase-js';

const USER_ID_KEY = 'supabase_user_id';

/**
 * Initialize anonymous authentication with Supabase
 * Creates a new anonymous user or restores existing session
 */
export const initializeAnonymousAuth = async (): Promise<User> => {
  try {
    const supabase = getSupabaseClient();
    
    // Check if there's an existing session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (session?.user) {
      console.log('[Supabase Auth] ✅ Existing session found:', session.user.id);
      await SecureStore.setItemAsync(USER_ID_KEY, session.user.id);
      return session.user;
    }

    // No existing session - create anonymous user
    console.log('[Supabase Auth] Creating anonymous user...');
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error('[Supabase Auth] ❌ Anonymous sign-in error:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('No user returned from anonymous sign-in');
    }

    console.log('[Supabase Auth] ✅ Anonymous user created:', data.user.id);
    await SecureStore.setItemAsync(USER_ID_KEY, data.user.id);
    
    return data.user;
  } catch (error) {
    console.error('[Supabase Auth] ❌ Auth initialization error:', error);
    throw error;
  }
};

/**
 * Get current user ID (synchronous)
 * Returns the UID of the currently authenticated user from session
 */
export const getCurrentUserId = (): string => {
  try {
    
    // Get from cached session (synchronous)
    const cachedUserId = SecureStore.getItem(USER_ID_KEY);
    
    if (!cachedUserId) {
      throw new Error('No authenticated user found');
    }
    
    return cachedUserId;
  } catch (error) {
    console.error('[Supabase Auth] ❌ Get user ID error:', error);
    throw error;
  }
};

/**
 * Get current user object
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[Supabase Auth] ❌ Get user error:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('[Supabase Auth] ❌ Get user error:', error);
    return null;
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[Supabase Auth] ❌ Sign out error:', error);
      throw error;
    }
    
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    console.log('[Supabase Auth] ✅ User signed out');
  } catch (error) {
    console.error('[Supabase Auth] ❌ Sign out error:', error);
    throw error;
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  const supabase = getSupabaseClient();
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('[Supabase Auth] State change:', event);
    callback(session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
};
