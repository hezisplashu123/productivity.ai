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
              animation: 'slide_from_right', // Default slide animation
            }}
          >
            <Stack.Screen name="home" />
            <Stack.Screen name="goal-detail" />
            <Stack.Screen name="leaderboard" />
            <Stack.Screen name="goal-input" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="verify-email" />
            
            {/* Focus Session - Uses Fade for "Mode Entry" feel */}
            <Stack.Screen 
              name="focus-session" 
              options={{ 
                animation: 'fade',
                gestureEnabled: false // Prevent swipe back to enforce the "lock"
              }} 
            />
          </Stack>
        </AppProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}