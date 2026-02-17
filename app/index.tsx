import React from 'react';
import { Redirect } from 'expo-router';

export default function IndexScreen() {
  // Redirect to the Welcome screen for public release
  return <Redirect href="/welcome" />;
}