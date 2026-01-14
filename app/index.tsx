import React from 'react';
import { Redirect } from 'expo-router';

export default function IndexScreen() {
  // SECURITY UPDATE: Redirect to lock screen first
  return <Redirect href="/lock-screen" />;
}