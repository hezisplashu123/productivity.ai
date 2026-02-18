import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { apiService } from '../src/services/api';
import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';
import { ArrowRight, Lock, Mail, User, AlertTriangle, Trash2, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { 
  auth, 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail,
  sendEmailVerification // IMPORTED
} from '../src/config/firebase';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setUser } = useApp();
  const insets = useSafeAreaInsets(); 
  
  const onboardingDataString = params.onboardingData as string;
  const onboardingData = onboardingDataString ? JSON.parse(onboardingDataString) : null;
  
  const isDeleteMode = params.mode === 'delete_reauth';
  const prefillEmail = params.email as string || '';

  const [isLogin, setIsLogin] = useState(params.mode === 'login' || isDeleteMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- ERROR STATES ---
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // --- GOOGLE CONFIG ---
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: "204716304779-266i58dfvid6mg70reivvtdqqrpv2v9p.apps.googleusercontent.com",
    webClientId: "204716304779-uuamf2qm95cj38oa4dif2jc91tu0hp3k.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
  }, [response]);

  const executeAccountDeletion = async (firebaseUser: any) => {
    try {
      if (firebaseUser.email) {
        await apiService.deleteUser(firebaseUser.email);
      }
      await deleteUser(firebaseUser);
      setUser(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Account Deleted", "Your account has been permanently removed.");
      router.replace('/welcome');
    } catch (error: any) {
      console.error("Deletion Error:", error);
      Alert.alert("Deletion Failed", error.message || "Could not delete account.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    setLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      
      if (isDeleteMode) {
        await executeAccountDeletion(userCredential.user);
        return;
      }

      const firebaseUser = userCredential.user;
      // Google users are verified by default
      await syncUserWithBackend(firebaseUser, 'google', firebaseUser.displayName || 'Google User', firebaseUser.email || '');
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Login Failed", error.message);
    }
  };

  const handleAppleLogin = async () => {
    try {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });
        setLoading(true);
        if (isDeleteMode) {
            Alert.alert("Not Supported", "Please use Email/Password to delete account for now.");
            setLoading(false);
            return;
        }
        
        const displayName = credential.fullName?.givenName ? `${credential.fullName.givenName} ${credential.fullName.familyName || ''}` : "Apple User";
        const appleUserMock = { uid: credential.user, email: credential.email, displayName };
        // Apple users are verified by default
        await syncUserWithBackend(appleUserMock, 'apple', displayName, credential.email || '');
    } catch(e) { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setEmailError("Enter your email first.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    
    setEmailError('');
    setPasswordError('');
    
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, targetEmail);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Reset Link Sent", `Check ${targetEmail} for a link.`);
    } catch (error: any) {
      if (error.code === 'auth/invalid-email') {
        setEmailError("Invalid email address.");
      } else if (error.code === 'auth/user-not-found') {
        setEmailError("No account found with this email.");
      } else {
        setEmailError("Failed to send reset link. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
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

    if (hasError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    Haptics.selectionAsync();

    try {
      let userCredential;
      if (isLogin) {
        // LOGIN FLOW
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (isDeleteMode) {
          await executeAccountDeletion(userCredential.user);
        } else {
          // If logging in, check verification status
          if (!userCredential.user.emailVerified) {
            setLoading(false);
            // Redirect to verification screen instead of logging in
            router.push({
              pathname: '/verify-email',
              params: { email, name, onboardingData: JSON.stringify(onboardingData) }
            });
            return;
          }
          await syncUserWithBackend(userCredential.user, 'email');
        }
      } else {
        // SIGN UP FLOW
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: name });
          // SEND VERIFICATION EMAIL
          await sendEmailVerification(auth.currentUser);
        }

        setLoading(false);
        // Navigate to Verification Screen
        router.push({
          pathname: '/verify-email',
          params: { email, name, onboardingData: JSON.stringify(onboardingData) }
        });
      }
    } catch (error: any) {
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      if (error.code === 'auth/invalid-email') {
        setEmailError('Invalid email format.');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setPasswordError('Incorrect email or password.');
      } else if (error.code === 'auth/wrong-password') {
        setPasswordError('Incorrect password.');
      } else if (error.code === 'auth/email-already-in-use') {
        setEmailError('This email is already registered.');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('Password is too weak.');
      } else {
        setPasswordError('Authentication failed. Please try again.');
      }
    }
  };

  const syncUserWithBackend = async (firebaseUser: any, provider: string, nameOverride?: string, emailOverride?: string) => {
    try {
        const backendUser = await apiService.syncUser({
            email: emailOverride || firebaseUser.email,
            socialId: firebaseUser.uid || firebaseUser.socialId,
            name: nameOverride || firebaseUser.displayName || name || 'Operative',
            provider: provider,
            onboardingData: onboardingData
        });
        setUser(backendUser);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (backendUser.onboardingData || onboardingData) {
            router.replace('/home');
        } else {
            router.replace('/ghost-hours');
        }
    } catch (error) {
        console.error("Backend Sync Error:", error);
        Alert.alert("Sync Error", "Logged in, but failed to connect to the backend.");
    } finally {
        setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    if (router.canGoBack()) {
      router.back(); 
    } else {
      router.replace('/edit-profile'); 
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { 
              paddingTop: Math.max(insets.top + 40, 80),
              paddingBottom: Math.max(insets.bottom + 20, 40)
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerSection}>
            {isDeleteMode ? (
              <View style={{ alignItems: 'center' }}>
                <AlertTriangle size={48} color={colors.error} style={{ marginBottom: 16 }} />
                <Text style={[styles.title, { color: colors.error }]}>Confirm Deletion</Text>
                <Text style={[styles.subtitle, { textAlign: 'center', color: colors.text }]}>
                  Please log in again to permanently delete your account. This action cannot be undone.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Save Your Profile'}</Text>
                <Text style={styles.subtitle}>
                  {isLogin ? 'Sign in to access your dashboard.' : 'Create an account to save your productivity plan.'}
                </Text>
              </>
            )}
          </View>

          <View style={styles.form}>
            {!isLogin && !isDeleteMode && (
              <View style={styles.inputWrapper}>
                <View style={styles.inputContainer}>
                  <User size={20} color={colors.textSecondary} style={styles.icon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Full Name" 
                    value={name} 
                    onChangeText={setName} 
                    placeholderTextColor={colors.textLight} 
                  />
                </View>
              </View>
            )}
            
            <View style={styles.inputWrapper}>
              <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
                <Mail size={20} color={emailError ? colors.error : colors.textSecondary} style={styles.icon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Email Address" 
                  value={email} 
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }} 
                  autoCapitalize="none" 
                  keyboardType="email-address" 
                  placeholderTextColor={colors.textLight}
                />
              </View>
              {emailError ? (
                <View style={styles.errorHighlightBox}>
                  <AlertCircle size={14} color={colors.error} />
                  <Text style={styles.errorText}>{emailError}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.inputWrapper}>
              <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
                <Lock size={20} color={passwordError ? colors.error : colors.textSecondary} style={styles.icon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Password" 
                  value={password} 
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                  }} 
                  secureTextEntry 
                  placeholderTextColor={colors.textLight} 
                />
              </View>
              {passwordError ? (
                <View style={styles.errorHighlightBox}>
                  <AlertCircle size={14} color={colors.error} />
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              ) : null}
            </View>

            {isLogin && !isDeleteMode && (
              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <TouchableOpacity 
              style={[
                styles.button, 
                isDeleteMode ? { backgroundColor: colors.error, shadowColor: colors.error } : {}
              ]} 
              onPress={handleSubmit} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.buttonText}>
                    {isDeleteMode ? 'Delete Permanently' : (isLogin ? 'Log In' : 'Complete Setup')}
                  </Text>
                  {!isDeleteMode && <ArrowRight size={20} color="#FFFFFF" />}
                  {isDeleteMode && <Trash2 size={20} color="#FFFFFF" />}
                </>
              )}
            </TouchableOpacity>
          </View>

          {!isDeleteMode && (
            <View style={styles.footer}>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>
              
              <View style={styles.socialButtonsContainer}>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity style={styles.appleCustomButton} onPress={handleAppleLogin}>
                    <View style={styles.iconContainer}>
                      <Svg width={22} height={22} viewBox="0 0 384 512" fill="#FFFFFF">
                        <Path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-54.5-91.9-54.1-91.9zM245.2 75c22.3-24.6 16.2-59.5 16-59.5-26.3-.1-56.6 16.8-71.1 37.8-13 18.2-16.2 47.9-14.7 58.9 29.8 1.9 55.3-19.8 69.8-37.2z" />
                      </Svg>
                    </View>
                    <Text style={styles.appleButtonText}>Continue with Apple</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.googleButton, !request && { opacity: 0.5 }]} 
                  onPress={() => promptAsync()} 
                  disabled={!request}
                >
                  <View style={styles.iconContainer}>
                    <Svg width={24} height={24} viewBox="0 0 48 48">
                      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </Svg>
                  </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.switchButton} onPress={() => {
                setIsLogin(!isLogin);
                setEmailError('');
                setPasswordError('');
              }}>
                <Text style={styles.switchText}>
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {isDeleteMode && (
            <TouchableOpacity style={styles.switchButton} onPress={handleCancelDelete}>
              <Text style={styles.switchText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 30,
  },
  headerSection: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary },
  
  form: { gap: 16 },
  inputWrapper: { gap: 4 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.backgroundLight, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: colors.border, 
    height: 56, 
    paddingHorizontal: 16 
  },
  inputError: {
    borderColor: colors.error,
  },
  errorHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
    flex: 1,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: colors.text, height: '100%' },
  
  forgotPasswordContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
    marginBottom: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    padding: 4,
  },

  button: { 
    backgroundColor: colors.primary, 
    height: 56, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 8, 
    shadowColor: colors.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 5 
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginRight: 8 },
  footer: { marginTop: 16 },
  switchButton: { alignItems: 'center', marginTop: 16 },
  switchText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: 12, color: colors.textLight, fontSize: 14, fontWeight: '500' },
  socialButtonsContainer: { gap: 12 },
  appleCustomButton: { width: '100%', height: 56, backgroundColor: '#000000', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  appleButtonText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  googleButton: { width: '100%', height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconContainer: { marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  googleButtonText: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
});