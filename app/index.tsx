import React from 'react';
import { Redirect } from 'expo-router';

export default function IndexScreen() {
  // Show welcome screen first, then redirect to onboarding
  return <Redirect href="/welcome" />;
}
