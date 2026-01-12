import React, { useEffect } from 'react';
import { View } from 'react-native';
import { OnboardingWizard, OnboardingData } from '../src/components/OnboardingWizard';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const router = useRouter();

  useEffect(() => {
    console.log("OnboardingScreen: Mounted");
  }, []);

  const handleComplete = async (data: OnboardingData) => {
    console.log("OnboardingScreen: handleComplete triggered", data);
    
    // Safety delay
    setTimeout(() => {
        console.log("OnboardingScreen: Attempting navigation to /home");
        try {
            router.replace('/home');
        } catch (e) {
            console.error("OnboardingScreen: Navigation failed", e);
        }
    }, 500);
  };

  return <OnboardingWizard onComplete={handleComplete} />;
}