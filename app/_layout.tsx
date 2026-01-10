import { Stack } from 'expo-router';
import { AppProvider } from '../src/context/AppContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { lightColors } from '../src/constants/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              // Force background to white across the app
              contentStyle: { backgroundColor: '#FFFFFF' }, 
            }}
          >
            <Stack.Screen name="home" />
            <Stack.Screen name="goal-detail" options={{ presentation: 'modal' }} />
          </Stack>
        </AppProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}