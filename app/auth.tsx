import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '../src/context/AppContext';
import { useAuth } from '../src/hooks/useAuth';
import { SocialAuthButtons } from '../src/components/SocialAuthButtons';
import { Theme } from '../src/constants/colors';
import { ArrowRight, Lock, Mail, User, AlertTriangle, Trash2, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { theme } = useApp();
  const styles = getStyles(theme);

  const isDeleteMode = params.mode === 'delete_reauth';
  const prefillEmail = (params.email as string) || '';

  const {
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
    handleAppleLogin,
    handleForgotPassword,
    handleSubmit,
    toggleLoginMode,
  } = useAuth({
    isDeleteMode,
    prefillEmail,
    initialIsLogin: params.mode === 'login' || isDeleteMode,
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + 40, 80), paddingBottom: Math.max(insets.bottom + 20, 40) }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.headerSection}>
            {isDeleteMode ? (
              <View style={{ alignItems: 'center' }}><AlertTriangle size={48} color={theme.error} style={{ marginBottom: 16 }} /><Text style={[styles.title, { color: theme.error }]}>Confirm Deletion</Text><Text style={[styles.subtitle, { textAlign: 'center' }]}>Please log in again to permanently delete your account. This action cannot be undone.</Text></View>
            ) : (
              <><Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Save Your Profile'}</Text><Text style={styles.subtitle}>{isLogin ? 'Sign in to access your dashboard.' : 'Create an account to save your productivity plan.'}</Text></>
            )}
          </View>

          <View style={styles.form}>
            {!isLogin && !isDeleteMode && (
              <View style={styles.inputWrapper}><View style={styles.inputContainer}><User size={20} color={theme.textSecondary} style={styles.icon} /><TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} placeholderTextColor={theme.textLight} /></View></View>
            )}
            <View style={styles.inputWrapper}>
              <View style={[styles.inputContainer, emailError ? styles.inputError : null]}><Mail size={20} color={emailError ? theme.error : theme.textSecondary} style={styles.icon} /><TextInput style={styles.input} placeholder="Email Address" value={email} onChangeText={(text) => { setEmail(text); if (emailError) setEmailError(''); }} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={theme.textLight} /></View>
              {emailError ? <View style={styles.errorHighlightBox}><AlertCircle size={14} color={theme.error} /><Text style={styles.errorText}>{emailError}</Text></View> : null}
            </View>
            <View style={styles.inputWrapper}>
              <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}><Lock size={20} color={passwordError ? theme.error : theme.textSecondary} style={styles.icon} /><TextInput style={styles.input} placeholder="Password" value={password} onChangeText={(text) => { setPassword(text); if (passwordError) setPasswordError(''); }} secureTextEntry placeholderTextColor={theme.textLight} /></View>
              {passwordError ? <View style={styles.errorHighlightBox}><AlertCircle size={14} color={theme.error} /><Text style={styles.errorText}>{passwordError}</Text></View> : null}
            </View>

            {isLogin && !isDeleteMode && <View style={styles.forgotPasswordContainer}><TouchableOpacity onPress={handleForgotPassword}><Text style={styles.forgotPasswordText}>Forgot Password?</Text></TouchableOpacity></View>}

            <TouchableOpacity style={[styles.button, isDeleteMode ? { backgroundColor: theme.error, shadowColor: theme.error } : {}]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.buttonText}>{isDeleteMode ? 'Delete Permanently' : (isLogin ? 'Log In' : 'Complete Setup')}</Text>{!isDeleteMode && <ArrowRight size={20} color="#FFFFFF" />}{isDeleteMode && <Trash2 size={20} color="#FFFFFF" />}</>}
            </TouchableOpacity>
          </View>

          {!isDeleteMode && (
            <View style={styles.footer}>
              <View style={styles.dividerContainer}><View style={styles.dividerLine} /><Text style={styles.dividerText}>or continue with</Text><View style={styles.dividerLine} /></View>
              <SocialAuthButtons
                theme={theme}
                googleRequestReady={!!request}
                onApplePress={handleAppleLogin}
                onGooglePress={() => promptAsync()}
              />
              <TouchableOpacity style={styles.switchButton} onPress={toggleLoginMode}><Text style={styles.switchText}>{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}</Text></TouchableOpacity>
            </View>
          )}

          {isDeleteMode && <TouchableOpacity style={styles.switchButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Text style={styles.switchText}>Cancel</Text></TouchableOpacity>}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30 },
  headerSection: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '700', color: theme.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: theme.textSecondary },
  form: { gap: 16 },
  inputWrapper: { gap: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.backgroundLight, borderRadius: 16, borderWidth: 1, borderColor: theme.border, height: 56, paddingHorizontal: 16 },
  inputError: { borderColor: theme.error },
  errorHighlightBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FEE2E2', marginTop: 4 },
  errorText: { fontSize: 13, color: theme.error, fontWeight: '600', flex: 1 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: theme.text, height: '100%' },
  forgotPasswordContainer: { alignItems: 'center', justifyContent: 'center', marginTop: -4, marginBottom: 4 },
  forgotPasswordText: { fontSize: 14, color: theme.primary, fontWeight: '700', padding: 4 },
  button: { backgroundColor: theme.primary, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginRight: 8 },
  footer: { marginTop: 16 },
  switchButton: { alignItems: 'center', marginTop: 16 },
  switchText: { color: theme.textSecondary, fontSize: 14, fontWeight: '500' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText: { marginHorizontal: 12, color: theme.textLight, fontSize: 14, fontWeight: '500' },
});
