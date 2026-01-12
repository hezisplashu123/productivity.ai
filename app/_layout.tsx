import { Stack } from 'expo-router';
import { AppProvider } from '../src/context/AppContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#FFFFFF' }, 
              animation: 'slide_from_right', // Standard page transition
            }}
          >
            <Stack.Screen name="home" />
            {/* Removed presentation: 'modal' to make it a full page */}
            <Stack.Screen name="goal-detail" />
            <Stack.Screen name="leaderboard" />
          </Stack>
        </AppProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}