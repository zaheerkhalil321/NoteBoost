import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  initializeAuth,
  Auth,
//@ts-ignore
  getReactNativePersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getFirestore, 
  Firestore
} from 'firebase/firestore';
// Note: Analytics is handled by @react-native-firebase/analytics, not web SDK

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwe3plHGNnDs6k--6HzXLxcuUsK-2MLvg",
  authDomain: "noteboost-59477.firebaseapp.com",
  projectId: "noteboost-59477",
  storageBucket: "noteboost-59477.firebasestorage.app",
  messagingSenderId: "678216663997",
  appId: "1:678216663997:web:16039c065aadfd3ccf08d4",
  measurementId: "G-GZBJNS2V9Y"
};

// Firebase instances
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// Initialize Firebase (without analytics - handled by @react-native-firebase/analytics)
export const initializeFirebase = async (): Promise<{
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}> => {
  try {
    // Initialize Firebase app
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] ✅ App initialized');

    // Initialize Auth with React Native AsyncStorage persistence
    // This is CRITICAL for React Native - it won't persist without this!
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('[Firebase] ✅ Auth initialized with React Native persistence');

    // Initialize Firestore
    firestore = getFirestore(app);
    console.log('[Firebase] ✅ Firestore initialized');

    // Note: Analytics initialization is handled automatically by @react-native-firebase/analytics
    // No need to initialize it here as it would conflict with the native SDK

    return { app, auth, firestore };
  } catch (error) {
    console.error('[Firebase] ❌ Initialization error:', error);
    throw error;
  }
};// Getters for Firebase instances
export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    throw new Error('Firebase app not initialized. Call initializeFirebase() first.');
  }
  return app;
};

export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    throw new Error('Firebase Auth not initialized. Call initializeFirebase() first.');
  }
  return auth;
};

export const getFirebaseFirestore = (): Firestore => {
  if (!firestore) {
    throw new Error('Firebase Firestore not initialized. Call initializeFirebase() first.');
  }
  return firestore;
};

// Note: Analytics is handled by @react-native-firebase/analytics
// Use analytics() from that package instead of getFirebaseAnalytics()

// Export config for reference
export { firebaseConfig };
