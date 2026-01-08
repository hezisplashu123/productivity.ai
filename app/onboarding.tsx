import React from 'react';
import { OnboardingWizard, OnboardingData } from '../src/components/OnboardingWizard';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleComplete = async (data: OnboardingData) => {
    try {
      // TESTING MODE: Don't save onboarding data, just log it
      console.log('Onboarding data (not saved):', data);
      
      // Small delay to ensure UI finishes rendering before navigation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Navigate to home after onboarding
      router.replace('/home');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Fallback navigation
      router.replace('/home');
    }
  };

  return <OnboardingWizard onComplete={handleComplete} />;
}


