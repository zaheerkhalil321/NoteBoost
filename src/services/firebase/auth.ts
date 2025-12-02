import { 
  signInAnonymously, 
  User,
  linkWithCredential,
  EmailAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirebaseAuth } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_USER_KEY = '@noteboost_firebase_user';
let authInitialized = false;

/**
 * Initialize Firebase Anonymous Authentication
 * This creates a persistent user ID without requiring login
 * Called on app first launch
 * 
 * IMPORTANT: Firebase Auth automatically persists on React Native
 * It uses AsyncStorage under the hood - no configuration needed
 */
export const initializeAnonymousAuth = async (): Promise<User> => {
  try {
    const auth = getFirebaseAuth();

    // Wait for Firebase Auth to restore any existing session
    // On React Native, this reads from AsyncStorage
    console.log('[Auth] ⏳ Checking for existing session...');
    
    const existingUser = await new Promise<User | null>((resolve) => {
      let resolved = false;
      let attempts = 0;
      
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        attempts++;
        console.log(`[Auth] 🔄 onAuthStateChanged fired (attempt ${attempts}), user:`, user ? user.uid : 'null');
        
        // On React Native, onAuthStateChanged fires twice:
        // 1st time: immediately with null (or current state)
        // 2nd time: after loading from AsyncStorage (if session exists)
        
        // If this is the first call and user is null, wait for potential 2nd call
        if (attempts === 1 && !user) {
          console.log('[Auth] 🕐 First call returned null, waiting for persistence to load...');
          return; // Don't resolve yet, wait for 2nd call
        }
        
        // If we get here, either:
        // - User exists (session restored)
        // - This is the 2nd+ call
        if (!resolved) {
          resolved = true;
          unsubscribe();
          
          if (user) {
            console.log('[Auth] ✅ Found existing user:', user.uid);
          } else {
            console.log('[Auth] ℹ️ No existing session found');
          }
          
          resolve(user);
        }
      });
      
      // Failsafe timeout (in case 2nd callback never comes)
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          unsubscribe();
          console.log('[Auth] ⏱️ Timeout - using current state:', auth.currentUser ? auth.currentUser.uid : 'null');
          resolve(auth.currentUser);
        }
      }, 2000); // 2 seconds should be enough for AsyncStorage
    });

    // If we found an existing user, return it
    if (existingUser) {
      await AsyncStorage.setItem(AUTH_USER_KEY, existingUser.uid);
      authInitialized = true;
      return existingUser;
    }

    // No existing session - create new anonymous user
    console.log('[Auth] 🆕 Creating new anonymous user...');
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    
    // Cache the user ID
    await AsyncStorage.setItem(AUTH_USER_KEY, user.uid);
    authInitialized = true;
    
    console.log('[Auth] ✅ New anonymous user created:', user.uid);
    
    return user;
  } catch (error) {
    console.error('[Auth] ❌ Error:', error);
    throw error;
  }
};

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export const getCurrentUser = (): User | null => {
  const auth = getFirebaseAuth();
  return auth.currentUser;
};

/**
 * Get current user ID
 * Throws error if not authenticated
 */
export const getCurrentUserId = (): string => {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('[Auth] No user is currently authenticated');
  }
  return user.uid;
};

/**
 * Link anonymous account with email/password
 * This upgrades the anonymous account to a permanent account
 * All data associated with the UID remains intact
 */
export const linkAnonymousAccountWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('[Auth] No user is currently authenticated');
    }
    
    if (!currentUser.isAnonymous) {
      console.log('[Auth] User already has email/password');
      return currentUser;
    }
    
    // Create email credential
    const credential = EmailAuthProvider.credential(email, password);
    
    // Link the credential to the anonymous user
    console.log('[Auth] Linking anonymous account with email...');
    const userCredential = await linkWithCredential(currentUser, credential);
    
    console.log('[Auth] Account linked successfully:', userCredential.user.email);
    return userCredential.user;
  } catch (error: any) {
    console.error('[Auth] Account linking error:', error);
    
    // Handle common errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already in use by another account');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak');
    }
    
    throw error;
  }
};

/**
 * Set up auth state listener
 * Callback is called whenever auth state changes (login, logout, etc.)
 */
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
};

/**
 * Check if current user is anonymous
 */
export const isAnonymousUser = (): boolean => {
  const user = getCurrentUser();
  return user ? user.isAnonymous : false;
};

/**
 * Get user metadata for display
 */
export const getUserMetadata = (): {
  uid: string;
  isAnonymous: boolean;
  email: string | null;
  createdAt: string | null;
} | null => {
  const user = getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  return {
    uid: user.uid,
    isAnonymous: user.isAnonymous,
    email: user.email,
    createdAt: user.metadata.creationTime || null,
  };
};

/**
 * Clear cached auth data (for testing/debugging only)
 */
export const clearAuthCache = async (): Promise<void> => {
  await AsyncStorage.removeItem(AUTH_USER_KEY);
  console.log('[Auth] Cache cleared');
};
