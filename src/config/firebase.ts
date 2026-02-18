import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  initializeAuth, 
  getReactNativePersistence, 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  getAuth,
  deleteUser,
  sendPasswordResetEmail,
  Auth
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAw7dKdWkr7WBO_BUG8EFqLOYw-wr0n2Z8",
  authDomain: "hesi-ai.firebaseapp.com",
  projectId: "hesi-ai",
  storageBucket: "hesi-ai.firebasestorage.app",
  messagingSenderId: "204716304779",
  appId: "1:204716304779:web:b9876e929e0a60a717a78e"
};

let app: FirebaseApp;
let auth: Auth;

if (getApps().length > 0) {
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}

export { 
  auth, 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  deleteUser,
  sendPasswordResetEmail
};