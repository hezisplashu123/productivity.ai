import { Stack } from 'expo-router';
import { AppProvider } from '../src/context/AppContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { lightColors } from '../src/constants/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <AppProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: lightColors.background },
            }}
          >
          <Stack.Screen 
            name="welcome"
            options={{
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="habit-profiler"
            options={{
              gestureEnabled: false, // Prevent back gesture during onboarding
            }}
          />
          <Stack.Screen 
            name="onboarding" 
            options={{
              gestureEnabled: false, // Prevent back gesture during onboarding
            }}
          />
          <Stack.Screen name="index" />
          <Stack.Screen name="home" />
          <Stack.Screen name="goal-input" />
          <Stack.Screen name="action-plan" />
          <Stack.Screen 
            name="ghost-hours"
            options={{
              gestureEnabled: false, // Prevent back gesture during Ghost Hours flow
            }}
          />
          </Stack>
        </AppProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
