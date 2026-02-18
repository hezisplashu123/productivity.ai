import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';
import { Brain } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

export default function IndexScreen() {
  const { user, isLoading } = useApp();
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Continuous slow rotation (3 seconds per full turn)
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1 // Infinite loop
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  // 1. Show Animated Brain while loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Animated.View style={animatedStyle}>
          <Brain size={48} color={colors.primary} />
        </Animated.View>
      </View>
    );
  }

  // 2. If user exists, go straight to Home
  if (user) {
    return <Redirect href="/home" />;
  }

  // 3. Otherwise, go to Welcome screen
  return <Redirect href="/welcome" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});