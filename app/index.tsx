import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { colors } from '../src/constants/colors';
import { useApp } from '../src/context/AppContext';
import { storage } from '../src/utils/storage';

export default function IndexScreen() {
  const router = useRouter();
  const { isLoading } = useApp();

  useEffect(() => {
    if (isLoading) return;

    const route = async () => {
      const tutorialDone = await storage.isSwipeTutorialComplete();
      router.replace(tutorialDone ? '/home' : '/onboarding');
    };

    route();
  }, [isLoading, router]);

  return (
    <View style={styles.loading}>
      <StatusBar style="light" />
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
