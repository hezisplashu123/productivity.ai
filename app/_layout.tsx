import { Stack, useRouter, useSegments } from 'expo-router';
import { AppProvider, useApp } from '../src/context/AppContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { colors } from '../src/constants/colors';
import { storage } from '../src/utils/storage';

function RootStack() {
  const { user, isLoading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const screen = segments[0];
    const isAuthScreen = screen === 'auth' || screen === 'verify-email';
    const isGuestAllowedScreen =
      screen === 'index' || screen === 'onboarding' || screen === 'home' || screen === 'deck';

    if (!user && !isAuthScreen && !isGuestAllowedScreen) {
      router.replace('/');
      return;
    }

    if (user) {
      const route = async () => {
        const tutorialDone = await storage.isSwipeTutorialComplete();
        if (!tutorialDone && screen !== 'onboarding') {
          router.replace('/onboarding');
          return;
        }
        if (tutorialDone && (screen === 'index' || screen === 'auth' || screen === 'onboarding')) {
          router.replace('/home');
        }
      };
      route();
    }
  }, [user, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="home" />
      <Stack.Screen name="deck" options={{ animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <AppProvider>
          <RootStack />
        </AppProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
