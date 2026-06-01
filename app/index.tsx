import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Sparkles, Users } from 'lucide-react-native';
import { lightColors as colors } from '../src/constants/colors';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';
import { storage } from '../src/utils/storage';

export default function WelcomeHubScreen() {
  const router = useRouter();
  const { user, isLoading } = useApp();
  const [roomCode, setRoomCode] = useState('');
  const [joinMode, setJoinMode] = useState(false);
  const [busy, setBusy] = useState(false);

  const hostId = user?.id ?? 'guest';

  const goToOnboardingOrHome = async () => {
    const done = await storage.isSwipeTutorialComplete();
    if (done) {
      router.replace('/home');
    } else {
      router.replace('/onboarding');
    }
  };

  const handleCreateRoom = async () => {
    setBusy(true);
    try {
      const session = await apiService.createSession(hostId);
      await storage.saveGameSession(session.id, session.roomCode);
      await goToOnboardingOrHome();
    } catch (e: any) {
      Alert.alert('Could not create room', e.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoinRoom = async () => {
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 4) {
      Alert.alert('Invalid code', 'Enter the 4-character room code.');
      return;
    }
    setBusy(true);
    try {
      const session = await apiService.joinSession(code);
      await storage.saveGameSession(session.id, session.roomCode);
      await goToOnboardingOrHome();
    } catch (e: any) {
      Alert.alert('Room not found', e.message || 'Double-check the code and try again.');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Sparkles size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Hezi</Text>
          <Text style={styles.subtitle}>
            AI-powered cards for deep group conversations. Swipe the vibe, shape the room.
          </Text>
        </View>

        {!joinMode ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreateRoom}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Room</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setJoinMode(true)}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>Join Room</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.joinBlock}>
            <Text style={styles.joinLabel}>Room code</Text>
            <TextInput
              style={styles.codeInput}
              value={roomCode}
              onChangeText={(t) => setRoomCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
              placeholder="ABCD"
              placeholderTextColor={colors.textLight}
              autoCapitalize="characters"
              maxLength={4}
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleJoinRoom}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Enter Room</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setJoinMode(false)} style={styles.backLink}>
              <Text style={styles.backLinkText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          {user ? (
            <TouchableOpacity
              style={styles.footerButton}
              onPress={() => router.push('/social')}
              activeOpacity={0.7}
            >
              <Users size={18} color={colors.textSecondary} />
              <Text style={styles.footerButtonText}>Friends</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.push('/auth')} activeOpacity={0.7}>
              <Text style={styles.loginText}>
                Have an account? <Text style={styles.loginAccent}>Log in</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  inner: { flex: 1, paddingHorizontal: 32, justifyContent: 'space-between', paddingBottom: 24 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: { gap: 14, marginBottom: 16 },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: colors.backgroundLight,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { color: colors.text, fontSize: 17, fontWeight: '700' },
  joinBlock: { gap: 12, marginBottom: 16 },
  joinLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  codeInput: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    color: colors.text,
  },
  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  footer: { alignItems: 'center', paddingBottom: 8 },
  footerButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerButtonText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  loginText: { color: colors.textSecondary, fontSize: 14 },
  loginAccent: { color: colors.primary, fontWeight: '700' },
});
