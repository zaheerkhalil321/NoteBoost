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
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

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
let analytics: Analytics | null = null;

// Initialize Firebase
export const initializeFirebase = async (): Promise<{
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  analytics: Analytics | null;
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

    // Initialize Analytics (only if supported in environment)
    const analyticsSupported = await isSupported();
    if (analyticsSupported) {
      analytics = getAnalytics(app);
      console.log('[Firebase] ✅ Analytics initialized');
    } else {
      console.log('[Firebase] ℹ️ Analytics not supported (React Native)');
    }

    return { app, auth, firestore, analytics };
  } catch (error) {
    console.error('[Firebase] ❌ Initialization error:', error);
    throw error;
  }
};

// Getters for Firebase instances
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

export const getFirebaseAnalytics = (): Analytics | null => {
  return analytics;
};

// Export config for reference
export { firebaseConfig };
