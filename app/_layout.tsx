import { Stack, useRouter, useSegments } from 'expo-router';
import { AppProvider, useApp } from '../src/context/AppContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { storage } from '../src/utils/storage';
import { colors } from '../src/constants/colors';

function RootStack() {
  const { user, isLoading, theme } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Safely get the current screen (defaults to 'index' for the root '/' route)
    const screen = segments[0] || 'index';
    
    const isAuthScreen = screen === 'auth' || screen === 'verify-email';
    const isGuestAllowedScreen = ['index', 'onboarding', 'home', 'deck'].includes(screen);

    // If completely unauthorized, kick to index
    if (!user && !isAuthScreen && !isGuestAllowedScreen) {
      router.replace('/');
      return;
    }

    // If user is logged in, ensure they do the tutorial before accessing the home/deck
    if (user) {
      const route = async () => {
        const tutorialDone = await storage.isSwipeTutorialComplete();
        
        if (!tutorialDone && (screen === 'home' || screen === 'deck')) {
          router.replace('/onboarding');
        }
      };
      route();
    }
  }, [user, isLoading, segments]);

  // Fallback to default colors if theme isn't hydrated yet
  const bgColor = theme?.background || colors.background;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: bgColor },
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