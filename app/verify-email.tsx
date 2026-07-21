import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { auth, signOut } from '../src/config/firebase'; 
import { sendEmailVerification, reload } from 'firebase/auth';
import { apiService } from '../src/services/api';
import { useApp } from '../src/context/AppContext';
import { Theme } from '../src/constants/colors';
import { typography } from '../src/constants/typography';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useApp();
  const styles = getStyles(theme);

  const [loading, setLoading] = useState(false);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [timer, setTimer] = useState(0);

  const email = params.email as string;
  const name = params.name as string;

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (isResendDisabled && timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000);
    else if (timer === 0) setIsResendDisabled(false);
    return () => clearInterval(interval);
  }, [isResendDisabled, timer]);

  const handleCheckVerification = async () => {
    setLoading(true); Haptics.selectionAsync();
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return router.replace('/auth');
      await reload(currentUser);
      if (currentUser.emailVerified) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await apiService.syncUser({ email: currentUser.email, socialId: currentUser.uid, name: name || currentUser.displayName || 'Player', provider: 'email' });
        router.replace('/onboarding');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert("Not Verified Yet", "Please click the link in your email and try again.");
      }
    } catch (error) { Alert.alert("Error", "Could not verify status."); } finally { setLoading(false); }
  };

  const handleResendEmail = async () => {
    if (isResendDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        Alert.alert("Sent", `Verification link sent to ${email}`);
        setIsResendDisabled(true); setTimer(60); 
      }
    } catch (error: any) { Alert.alert("Error", error.message); }
  };

  const handleChangeEmail = async () => { try { await signOut(auth); router.back(); } catch { router.back(); } };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.content}>
        <TouchableOpacity onPress={handleChangeEmail} style={styles.backButton}><ArrowLeft size={24} color={theme.text} /></TouchableOpacity>
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.iconContainer}>
          <View style={styles.iconCircle}><Mail size={48} color={theme.primary} /></View>
          <View style={styles.badge}><Text style={styles.badgeText}>ACTION REQUIRED</Text></View>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.textContainer}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>We've sent a verification link to:</Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.instructionText}>Tap the link in that email, then come back here and tap "I've Verified It".</Text>
          <Text style={styles.spamText}>(Don't see it? Check your spam folder.)</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.actionContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleCheckVerification} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.primaryButtonText}>I've Verified It</Text><CheckCircle2 size={20} color="#FFFFFF" /></>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryButton, isResendDisabled && styles.disabledButton]} onPress={handleResendEmail} disabled={isResendDisabled}>
            <RefreshCw size={18} color={isResendDisabled ? theme.textLight : theme.text} />
            <Text style={[styles.secondaryButtonText, isResendDisabled && { color: theme.textLight }]}>{isResendDisabled ? `Resend in ${timer}s` : "Resend Email"}</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  backButton: { position: 'absolute', top: 60, left: 24, padding: 8, zIndex: 10 },
  iconContainer: { alignItems: 'center', marginBottom: 32, position: 'relative' },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.glow, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  badge: { position: 'absolute', bottom: -10, backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 2, borderColor: '#FFFFFF' },
  badgeText: { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: 10, letterSpacing: 1 },
  textContainer: { alignItems: 'center', marginBottom: 48, width: '100%' },
  title: { fontFamily: typography.heading, fontSize: 28, color: theme.text, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontFamily: typography.body, fontSize: 16, color: theme.textSecondary, marginBottom: 8, textAlign: 'center' },
  emailText: { fontFamily: typography.bodyBold, fontSize: 18, color: theme.text, marginBottom: 24, textAlign: 'center' },
  instructionText: { fontFamily: typography.body, fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  spamText: { fontFamily: typography.body, fontSize: 13, color: theme.textLight, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  actionContainer: { width: '100%', gap: 16 },
  primaryButton: { backgroundColor: theme.primary, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  primaryButtonText: { fontFamily: typography.bodyBold, color: '#FFFFFF', fontSize: 18 },
  secondaryButton: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  disabledButton: { backgroundColor: '#F3F4F6', borderColor: '#F3F4F6' },
  secondaryButtonText: { fontFamily: typography.bodyBold, color: '#1A1A1A', fontSize: 16 },
});