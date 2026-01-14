import React, { useEffect } from 'react';
import { OnboardingWizard, OnboardingData } from '../src/components/OnboardingWizard';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleComplete = async (data: OnboardingData) => {
    // Navigate to Auth screen and pass the onboarding data
    router.push({
      pathname: '/auth',
      params: { onboardingData: JSON.stringify(data) }
    });
  };

  return <OnboardingWizard onComplete={handleComplete} />;
}