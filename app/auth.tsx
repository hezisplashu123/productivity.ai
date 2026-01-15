import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { apiService } from '../src/services/api';
import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';
import { ArrowRight, Lock, Mail, User, HelpCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

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
  
  // Track failed attempts
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleForgotPassword = () => {
    // In a real app, this would call an API to send a reset email
    Alert.alert(
      "Reset Password",
      "We've sent a temporary password to your email.\n(Dev Note: Check your database manually or create a new account)",
      [{ text: "OK" }]
    );
  };

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
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

      // Success! Reset attempts
      setFailedAttempts(0);
      setUser(responseUser);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/home');
      
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Increment failed attempts
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      // INDUSTRY STANDARD: Trigger popup after 3rd failure
      if (isLogin && newAttempts >= 3) {
        Alert.alert(
          "Trouble Logging In?",
          "It looks like you're having trouble. Would you like to reset your password?",
          [
            { text: "Try Again", style: "cancel" },
            { text: "Reset Password", onPress: handleForgotPassword }
          ]
        );
      } else {
        // Show specific error message
        Alert.alert('Login Failed', error.message);
      }
    } finally {
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

          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={() => {
              setIsLogin(!isLogin);
              setFailedAttempts(0); // Reset attempts when switching modes
            }}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </Text>
          </TouchableOpacity>

          {/* Subtle UX: Show link after 1 fail, but Popup only after 3 fails */}
          {isLogin && failedAttempts > 0 && (
            <TouchableOpacity 
              style={styles.forgotButton}
              onPress={handleForgotPassword}
            >
              <HelpCircle size={14} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
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
    marginBottom: 40,
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
    marginTop: 16,
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
    marginTop: 20,
  },
  switchText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  forgotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 10,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  }
});