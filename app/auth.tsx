import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { apiService } from '../src/services/api';
import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';
import { ArrowRight, Lock, Mail, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg'; 

// --- AUTH IMPORTS ---
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import { auth, GoogleAuthProvider, signInWithCredential } from '../src/config/firebase'; 

// Ensure the browser closes on redirect
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setUser } = useApp();
  
  const onboardingDataString = params.onboardingData as string;
  const onboardingData = onboardingDataString ? JSON.parse(onboardingDataString) : null;

  const [isLogin, setIsLogin] = useState(params.mode === 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- FIREBASE GOOGLE AUTH SETUP ---
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "204716304779-uuamf2qm95cj38oa4dif2jc91tu0hp3k.apps.googleusercontent.com",
    // This points to the Expo Proxy, which redirects to your unique scheme
    redirectUri: "https://auth.expo.io/@goathezisplash123/productivity-ai",
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleFirebaseSignIn(id_token);
    } else if (response?.type === 'error') {
      console.error("Google Auth Error:", response.error);
      Alert.alert("Auth Failed", "Could not connect to Google.");
    }
  }, [response]);

  const handleFirebaseSignIn = async (idToken: string) => {
    setLoading(true);
    try {
      // 1. Sign in to Firebase
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      // 2. Sync with YOUR Backend
      const backendUser = await apiService.socialLogin({
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        socialId: firebaseUser.uid, 
        provider: 'google',
        onboardingData: onboardingData
      });

      handleAuthSuccess(backendUser);

    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      Alert.alert("Login Failed", error.message);
      setLoading(false);
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
      
      let fullName = null;
      if (credential.fullName?.givenName) {
        fullName = `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim();
      }

      const backendUser = await apiService.socialLogin({
        email: credential.email, 
        socialId: credential.user, 
        name: fullName,
        provider: 'apple',
        onboardingData: onboardingData
      });

      handleAuthSuccess(backendUser);

    } catch (e: any) {
      if (e.code !== 'ERR_CANCELED') {
        Alert.alert('Apple Login Failed', e.message);
      }
      setLoading(false);
    }
  };

  const handleAuthSuccess = (responseUser: any) => {
    setUser(responseUser);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (responseUser.onboardingData) {
      router.replace('/home');
    } else {
      Alert.alert(
        "Setup Required",
        "We need to calibrate your profile before we begin.",
        [
          { 
            text: "Start Assessment", 
            onPress: () => router.replace('/ghost-hours') 
          }
        ]
      );
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (!isLogin && !onboardingData) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Assessment Required",
        "You cannot create an account without a personalized plan.",
        [
          { text: "Go to Onboarding", onPress: () => router.replace('/ghost-hours') },
          { text: "Cancel", style: 'cancel' }
        ]
      );
      return;
    }

    setLoading(true);
    Haptics.selectionAsync();

    try {
      let responseUser;
      if (isLogin) {
        responseUser = await apiService.login({ email, password });
      } else {
        responseUser = await apiService.register({
          email,
          name,
          password,
          onboardingData 
        });
      }
      handleAuthSuccess(responseUser);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Authentication Failed', error.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Save Your Profile'}</Text>
        <Text style={styles.subtitle}>
          {isLogin 
            ? 'Sign in to access your dashboard.' 
            : 'Create an account to save your productivity plan.'}
        </Text>

        <View style={styles.form}>
          {!isLogin && (
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
          )}

          <View style={styles.inputContainer}>
            <Mail size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.textLight}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={colors.textLight}
            />
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.buttonText}>
                  {isLogin ? 'Log In' : 'Complete Setup'}
                </Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            {Platform.OS === 'ios' && (
              <TouchableOpacity 
                style={styles.appleCustomButton} 
                onPress={handleAppleLogin}
              >
                <View style={styles.iconContainer}>
                  <Svg width={22} height={22} viewBox="0 0 384 512" fill="#FFFFFF">
                    <Path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-54.5-91.9-54.1-91.9zM245.2 75c22.3-24.6 16.2-59.5 16-59.5-26.3-.1-56.6 16.8-71.1 37.8-13 18.2-16.2 47.9-14.7 58.9 29.8 1.9 55.3-19.8 69.8-37.2z" />
                  </Svg>
                </View>
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            )}

            {/* Google Login with Firebase */}
            <TouchableOpacity 
              style={styles.googleButton} 
              onPress={() => {
                if (request) promptAsync();
                else Alert.alert("Setup Required", "Google ID not configured in auth.tsx");
              }}
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

          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={() => {
              setIsLogin(!isLogin);
            }}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    height: 56,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
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
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  switchText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '500',
  },
  socialButtonsContainer: {
    gap: 12,
  },
  appleCustomButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#000000', 
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  appleButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  googleButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});