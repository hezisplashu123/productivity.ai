import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  initializeAuth, 
  getReactNativePersistence, 
  GoogleAuthProvider, 
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  getAuth
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// 1. Your Firebase Config (Keep your existing keys)
const firebaseConfig = {
  apiKey: "AIzaSyAw7dKdWkr7WBO_BUG8EFqLOYw-wr0n2Z8",
  authDomain: "hesi-ai.firebaseapp.com",
  projectId: "hesi-ai",
  storageBucket: "hesi-ai.firebasestorage.app",
  messagingSenderId: "204716304779",
  appId: "1:204716304779:web:b9876e929e0a60a717a78e"
};

// 2. Initialize App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 3. Initialize Auth with Persistence (CRITICAL for React Native)
let auth;
try {
  // Check if auth is already initialized
  auth = getAuth(app);
} catch (e) {
  // If not, initialize with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

export { 
  auth, 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
};