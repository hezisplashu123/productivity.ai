import React, { useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedStreakFlameProps {
  onPress: () => void;
}

const FLAME_SIZE = 40;

const AnimatedStreakFlame: React.FC<AnimatedStreakFlameProps> = ({ onPress }) => {
  const animationRef = useRef<LottieView>(null);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View style={styles.animationContainer}>
        <LottieView
          ref={animationRef}
          source={require('../../assets/animations/streak-flame.json')}
          autoPlay
          loop
          style={styles.animation}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: FLAME_SIZE + 8,
    height: FLAME_SIZE + 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  animationContainer: {
    width: FLAME_SIZE,
    height: FLAME_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  animation: {
    width: FLAME_SIZE,
    height: FLAME_SIZE,
  },
});

export default AnimatedStreakFlame;