import React from 'react';
import { OnboardingWizard, OnboardingData } from '../src/components/OnboardingWizard';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleComplete = async (data: OnboardingData) => {
    // TESTING MODE: Don't save onboarding data, just log it
    console.log('Onboarding data (not saved):', data);
    
    // Navigate to home after onboarding
    router.replace('/home');
  };

  return <OnboardingWizard onComplete={handleComplete} />;
}


