import React from 'react';
import { OnboardingWizard, OnboardingData } from '../src/components/OnboardingWizard';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, saveOnboarding } = useApp();

  const handleComplete = async (data: OnboardingData) => {
    if (user) {
      // User is already logged in (came from auth screen but had incomplete profile)
      await saveOnboarding(data);
      router.replace('/home');
    } else {
      // User is new, redirect to the immersive DEMO screen before account creation
      router.push({
        pathname: '/demo',
        params: { onboardingData: JSON.stringify(data) }
      });
    }
  };

  return <OnboardingWizard onComplete={handleComplete} />;
}