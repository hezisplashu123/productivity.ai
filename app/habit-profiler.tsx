import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { HabitProfiler, HabitProfileData } from '../src/components/HabitProfiler';
import { useRouter } from 'expo-router';
import { storage } from '../src/utils/storage';
import { lightColors as colors } from '../src/constants/colors';
import { StatusBar } from 'expo-status-bar';

export default function HabitProfilerScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkIfAlreadyCompleted();
  }, []);

  const checkIfAlreadyCompleted = async () => {
    try {
      // First check if onboarding is complete (onboarding comes first)
      const isOnboardingComplete = await storage.isOnboardingComplete();
      if (!isOnboardingComplete) {
        router.replace('/onboarding');
        return;
      }

      const isComplete = await storage.isHabitProfilerComplete();
      if (isComplete) {
        // Already completed, go to home
        router.replace('/home');
      } else {
        setIsChecking(false);
      }
    } catch (error) {
      console.error('Error checking habit profiler status:', error);
      setIsChecking(false);
    }
  };

  const handleComplete = async (data: HabitProfileData) => {
    try {
      // Save habit profile data
      await storage.saveHabitProfileData(data);
      
      // Mark habit profiler as complete
      await storage.setHabitProfilerComplete(true);
      
      // Navigate to home screen (onboarding already done)
      router.replace('/home');
    } catch (error) {
      console.error('Error completing habit profiler:', error);
      // Still navigate even if storage fails
      router.replace('/onboarding');
    }
  };

  if (isChecking) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <HabitProfiler onComplete={handleComplete} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

