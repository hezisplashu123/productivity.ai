import React from 'react';
import { GhostHoursCalculator } from '../src/components/GhostHoursCalculator';
import { useRouter } from 'expo-router';

export default function GhostHoursScreen() {
  const router = useRouter();

  const handleComplete = (ghostHours: number, workHours: number) => {
    console.log('Ghost Hours:', ghostHours, 'Work Hours:', workHours);
    // Navigate to onboarding after Ghost Hours calculation
    router.replace('/onboarding');
  };

  const handleSkip = () => {
    // Navigate to onboarding if user skips
    router.replace('/onboarding');
  };

  return <GhostHoursCalculator onComplete={handleComplete} onSkip={handleSkip} />;
}

