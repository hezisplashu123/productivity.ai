import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { colors } from '../src/constants/colors';
import { useApp } from '../src/context/AppContext';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/home');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Sparkles size={44} color={colors.background} />
        </View>
        <Text style={styles.title}>Hezi</Text>
        <Text style={styles.subtitle}>
          Pass one phone around the room. Swipe into deeper conversations—powered by AI that reads the vibe.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/auth')}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 32,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
  },
  buttonText: { color: colors.background, fontSize: 17, fontWeight: '700' },
});
