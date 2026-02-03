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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your existing config
const firebaseConfig = {
  apiKey: "AIzaSyAw7dKdWkr7WBO_BUG8EFqLOYw-wr0n2Z8",
  authDomain: "hesi-ai.firebaseapp.com",
  projectId: "hesi-ai",
  storageBucket: "hesi-ai.firebasestorage.app",
  messagingSenderId: "204716304779",
  appId: "1:204716304779:web:b9876e929e0a60a717a78e"
};

// Initialize App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with Persistence
let auth;
if (getApps().length > 0) {
  try {
    auth = getAuth(app);
  } catch {
    // initialize below if getAuth fails
  }
}

if (!auth) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
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