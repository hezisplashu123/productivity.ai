import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator, 
  Alert,
  AppState
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, CheckCircle2, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { auth, sendPasswordResetEmail, signOut } from '../src/config/firebase'; 
import { sendEmailVerification, reload } from 'firebase/auth';
import { apiService } from '../src/services/api';
import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';

const { width } = Dimensions.get('window');

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setUser } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [timer, setTimer] = useState(0);

  const email = params.email as string;
  const password = params.password as string; 
  const name = params.name as string;
  const onboardingData = params.onboardingData ? JSON.parse(params.onboardingData as string) : null;

  useEffect(() => {
    // Start countdown if resend is disabled
    let interval: NodeJS.Timeout;
    if (isResendDisabled && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [isResendDisabled, timer]);

  const handleCheckVerification = async () => {
    setLoading(true);
    Haptics.selectionAsync();

    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert("Error", "Session expired. Please log in again.");
        router.replace('/auth');
        return;
      }

      // Reload user to get fresh emailVerified status from Firebase
      await reload(currentUser);
      
      if (currentUser.emailVerified) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // 1. Sync with Backend now that it's verified
        const backendUser = await apiService.syncUser({
          email: currentUser.email,
          socialId: currentUser.uid,
          name: name || currentUser.displayName || 'Operative',
          provider: 'email',
          onboardingData: onboardingData
        });

        // 2. Update Context
        setUser(backendUser);

        // 3. Navigate - FINISHED! GO TO PAYWALL
        if (backendUser.onboardingData || onboardingData) {
          router.replace('/paywall');
        } else {
          router.replace('/ghost-hours');
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          "Not Verified Yet", 
          "We haven't detected the verification yet. Please click the link in your email and try again."
        );
      }
    } catch (error: any) {
      console.error("Verification Check Error:", error);
      Alert.alert("Error", "Could not verify status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (isResendDisabled) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await sendEmailVerification(currentUser);
        Alert.alert("Sent", `Verification link sent to ${email}`);
        setIsResendDisabled(true);
        setTimer(60); 
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Could not send email.");
    }
  };

  const handleChangeEmail = async () => {
    try {
      await signOut(auth);
      router.back();
    } catch (e) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.content}>
        
        <TouchableOpacity onPress={handleChangeEmail} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Mail size={48} color={colors.primary} />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ACTION REQUIRED</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.textContainer}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to:
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.instructionText}>
            Tap the link in that email, then come back here and tap "I've Verified It".
          </Text>
          <Text style={styles.spamText}>
            (Don't see it? Check your spam folder.)
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleCheckVerification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>I've Verified It</Text>
                <CheckCircle2 size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, isResendDisabled && styles.disabledButton]} 
            onPress={handleResendEmail}
            disabled={isResendDisabled}
          >
            <RefreshCw size={18} color={isResendDisabled ? colors.textLight : colors.text} />
            <Text style={[styles.secondaryButtonText, isResendDisabled && { color: colors.textLight }]}>
              {isResendDisabled ? `Resend in ${timer}s` : "Resend Email"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    padding: 8,
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  badge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 48,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  spamText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  actionContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#F3F4F6',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});