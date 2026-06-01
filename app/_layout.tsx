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
    if (isLoading) return;

    const currentScreen = segments[0];

    const isAllowedGuestScreen =
      currentScreen === 'index' ||
      currentScreen === 'welcome' ||
      currentScreen === 'auth' ||
      currentScreen === 'verify-email' ||
      currentScreen === 'onboarding' ||
      currentScreen === 'home' ||
      currentScreen === 'demo';

    const isPaywall = currentScreen === 'paywall';

    if (!user && !isAllowedGuestScreen) {
      router.replace('/');
      return;
    }

    if (user && !isPro && !isPaywall && currentScreen !== 'verify-email' && currentScreen !== 'demo') {
      router.replace('/paywall');
      return;
    }

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
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="demo" />
      <Stack.Screen name="home" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="social" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="edit-profile" />
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
