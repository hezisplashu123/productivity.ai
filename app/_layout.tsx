import { Stack, useRouter, useSegments } from 'expo-router';
import { AppProvider, useApp } from '../src/context/AppContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { storage } from '../src/utils/storage';
import { colors } from '../src/constants/colors';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { LoadingScreen } from '../src/components/LoadingScreen';

// Keep the native splash screen visible until fonts have loaded
SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { user, isLoading, theme } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Safely get the current screen (defaults to 'index' for the root '/' route)
    const screen = segments[0] || 'index';
    
    const isGuestAllowedScreen = ['index', 'onboarding', 'home', 'deck', 'account'].includes(screen);

    // If completely unauthorized, kick to index
    if (!user && !isGuestAllowedScreen) {
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

  if (isLoading) {
    return <LoadingScreen />;
  }

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
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="home" />
      <Stack.Screen name="deck" options={{ animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    SpaceGrotesk_700Bold,
    ArchivoBlack_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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