import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { storage } from '../src/utils/storage';

export default function IndexScreen() {
  const router = useRouter();
  const { isLoading } = useApp();
  const [isNavigating, setIsNavigating] = useState(true); // Default true while we check

  useEffect(() => {
    if (isLoading) return;

    const checkOnboarding = async () => {
      const tutorialDone = await storage.isSwipeTutorialComplete();
      if (tutorialDone) {
        router.replace('/home');
      } else {
        setIsNavigating(false); // Show Get Started button
      }
    };
    
    checkOnboarding();
  }, [isLoading, router]);

  if (isLoading || isNavigating) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LoadingScreen showGetStarted onGetStarted={() => router.replace('/onboarding')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});