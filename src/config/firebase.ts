import { initializeApp, getApp, getApps } from 'firebase/app';
// Change getAuth to initializeAuth and import persistence helpers
import { 
  initializeAuth, 
  getReactNativePersistence, 
  GoogleAuthProvider, 
  signInWithCredential,
  getAuth
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAw7dKdWkr7WBO_BUG8EFqLOYw-wr0n2Z8",
  authDomain: "hesi-ai.firebaseapp.com",
  projectId: "hesi-ai",
  storageBucket: "hesi-ai.firebasestorage.app",
  messagingSenderId: "204716304779",
  appId: "1:204716304779:web:b9876e929e0a60a717a78e"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with Persistence
// We check if auth is already initialized to avoid errors during hot reload
let auth;
try {
  auth = getAuth(app);
} catch (e) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

export { auth, GoogleAuthProvider, signInWithCredential };