import { Stack, useRouter, useSegments } from 'expo-router';
import { AppProvider, useApp } from '../src/context/AppContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

function RootStack() {
  const { user, isLoading, isPro } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to initialize
    if (isLoading) return;

    const currentScreen = segments[0];

    // Screens accessible without being logged in
    const isAllowedGuestScreen = 
      currentScreen === 'welcome' || 
      currentScreen === 'auth' || 
      currentScreen === 'verify-email' || 
      currentScreen === 'ghost-hours' || 
      currentScreen === 'onboarding' || 
      currentScreen === 'habit-profiler';

    const isPaywall = currentScreen === 'paywall';

    // 1. Redirect to Welcome if not logged in and on a protected screen
    if (!user && !isAllowedGuestScreen) {
      router.replace('/welcome');
      return;
    }

    // 2. Redirect to Paywall if logged in but not Pro
    if (user && !isPro && !isPaywall && currentScreen !== 'verify-email') {
      router.replace('/paywall');
      return;
    }

    // 3. Redirect to Home if Pro user tries to see Welcome or Paywall
    if (user && isPro && (currentScreen === 'welcome' || isPaywall)) {
      router.replace('/home');
    }
  }, [user, isLoading, isPro, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' }, 
        animation: 'slide_from_right', 
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="ghost-hours" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      
      {/* PAYWALL CONFIGURATION: Native Modal Presentation */}
      <Stack.Screen 
        name="paywall" 
        options={{ 
          presentation: 'modal', 
          animation: 'slide_from_bottom',
          gestureEnabled: false, // Prevents swiping down to close
        }} 
      /> 
      
      <Stack.Screen name="home" />
      <Stack.Screen name="goal-detail" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="goal-input" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen 
        name="focus-session" 
        options={{ 
          animation: 'fade',
          gestureEnabled: false 
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <RootStack />
        </AppProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}