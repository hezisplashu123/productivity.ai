import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  auth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail,
  sendEmailVerification,
} from '../config/firebase';
import { apiService } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

interface UseAuthOptions {
  isDeleteMode: boolean;
  prefillEmail?: string;
  initialIsLogin?: boolean;
}

export function useAuth({ isDeleteMode, prefillEmail = '', initialIsLogin = true }: UseAuthOptions) {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: '204716304779-266i58dfvid6mg70reivvtdqqrpv2v9p.apps.googleusercontent.com',
    webClientId: '204716304779-uuamf2qm95cj38oa4dif2jc91tu0hp3k.apps.googleusercontent.com',
  });

  const executeAccountDeletion = useCallback(async (firebaseUser: { email: string | null; delete: () => Promise<void> }) => {
    try {
      if (firebaseUser.email) await apiService.deleteUser(firebaseUser.email);
      await deleteUser(firebaseUser as Parameters<typeof deleteUser>[0]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Account Deleted', 'Your account has been permanently removed.');
      if (router.canGoBack()) router.dismissAll();
      router.replace('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not delete account.';
      Alert.alert('Deletion Failed', message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const syncUserWithBackend = useCallback(async (
    firebaseUser: { email: string | null; uid: string; displayName: string | null },
    provider: string,
    nameOverride?: string,
    emailOverride?: string
  ) => {
    try {
      await apiService.syncUser({
        email: emailOverride || firebaseUser.email || '',
        socialId: firebaseUser.uid,
        name: nameOverride || firebaseUser.displayName || name || 'Player',
        provider,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/onboarding');
    } catch (error) {
      Alert.alert('Sync Error', 'Logged in, but failed to connect to the backend.');
    } finally {
      setLoading(false);
    }
  }, [name, router]);

  const handleGoogleSignIn = useCallback(async (idToken: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      if (isDeleteMode) return await executeAccountDeletion(userCredential.user);
      await syncUserWithBackend(
        userCredential.user,
        'google',
        userCredential.user.displayName || 'Google User',
        userCredential.user.email || ''
      );
    } catch (error: unknown) {
      setLoading(false);
      const message = error instanceof Error ? error.message : 'Login failed';
      Alert.alert('Login Failed', message);
    }
  }, [isDeleteMode, executeAccountDeletion, syncUserWithBackend]);

  useEffect(() => {
    if (response?.type === 'success') handleGoogleSignIn(response.params.id_token);
  }, [response, handleGoogleSignIn]);

  const handleAppleLogin = useCallback(async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      setLoading(true);
      if (!credential.identityToken) throw new Error('Apple Sign-In failed');
      const firebaseCredential = new OAuthProvider('apple.com').credential({ idToken: credential.identityToken });
      const userCredential = await signInWithCredential(auth, firebaseCredential);
      if (isDeleteMode) return await executeAccountDeletion(userCredential.user);
      const displayName = credential.fullName?.givenName
        ? `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim()
        : (userCredential.user.displayName || 'Apple User');
      await syncUserWithBackend(
        userCredential.user,
        'apple',
        displayName,
        userCredential.user.email || credential.email || ''
      );
    } catch (e: unknown) {
      setLoading(false);
      const err = e as { code?: string; message?: string };
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Login Failed', err.message || 'Could not sign in with Apple.');
      }
    }
  }, [isDeleteMode, executeAccountDeletion, syncUserWithBackend]);

  const handleForgotPassword = useCallback(async () => {
    if (!email.trim()) {
      setEmailError('Enter your email first.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setEmailError('');
    setPasswordError('');
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Reset Link Sent', `Check ${email.trim()} for a link.`);
    } catch (error) {
      setEmailError('Failed to send reset link. Try again.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleSubmit = useCallback(async () => {
    setEmailError('');
    setPasswordError('');
    let hasError = false;
    if (!email.trim()) {
      setEmailError('Email is required.');
      hasError = true;
    } else if (!email.includes('@')) {
      setEmailError('Please enter a valid email.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    } else if (!isLogin && password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    }
    if (!isLogin && !name.trim()) {
      Alert.alert('Missing Info', 'Please enter your name.');
      return;
    }
    if (hasError) return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    setLoading(true);
    Haptics.selectionAsync();
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (isDeleteMode) return await executeAccountDeletion(userCredential.user);
        if (!userCredential.user.emailVerified) {
          setLoading(false);
          return router.push({ pathname: '/verify-email', params: { email, name } });
        }
        await syncUserWithBackend(userCredential.user, 'email');
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: name });
          await sendEmailVerification(auth.currentUser);
        }
        setLoading(false);
        router.push({ pathname: '/verify-email', params: { email, name } });
      }
    } catch (error) {
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPasswordError('Authentication failed. Please try again.');
    }
  }, [email, password, isLogin, name, isDeleteMode, executeAccountDeletion, syncUserWithBackend, router]);

  const toggleLoginMode = useCallback(() => {
    setIsLogin(!isLogin);
    setEmailError('');
    setPasswordError('');
  }, [isLogin]);

  return {
    isLogin,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    emailError,
    setEmailError,
    passwordError,
    setPasswordError,
    request,
    promptAsync,
    handleGoogleSignIn,
    handleAppleLogin,
    handleForgotPassword,
    handleSubmit,
    toggleLoginMode,
  };
}
