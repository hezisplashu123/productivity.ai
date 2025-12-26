import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { MotiView } from 'moti';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { lightColors as colors } from '../constants/colors';

interface SunBackgroundProps {
  textLength?: number;
  isInputFocused?: boolean;
}

const Cloud: React.FC<{ x: number; y: number; size: number; delay: number }> = ({ 
  x, 
  y, 
  size, 
  delay 
}) => {
  return (
    <MotiView
      style={[
        styles.cloud,
        {
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size * 0.6,
        },
      ]}
      from={{ opacity: 0.7, translateX: 0 }}
      animate={{
        opacity: [0.7, 0.9, 0.7],
        translateX: [0, 5, 0],
      }}
      transition={{
        type: 'timing',
        duration: 4000 + Math.random() * 2000,
        delay,
        loop: true,
      }}
    >
      <View style={styles.cloudCircle1} />
      <View style={styles.cloudCircle2} />
      <View style={styles.cloudCircle3} />
      <View style={styles.cloudCircle4} />
    </MotiView>
  );
};

const Sun: React.FC<{ isInputFocused?: boolean }> = ({ isInputFocused = false }) => {
  const { width } = useWindowDimensions();
  const eyeOffsetX = useSharedValue(0);
  const eyeOffsetY = useSharedValue(0);
  const sunPositionX = useSharedValue(0); // 0 = right side (start), 1 = left side (when focused)

  React.useEffect(() => {
    if (isInputFocused) {
      // Sun moves to left side
      sunPositionX.value = withSpring(1, { 
        damping: 15, 
        stiffness: 80,
        mass: 1.2,
      });
      // Eyes look toward the textbox (down and to the right from top-left)
      eyeOffsetX.value = withSpring(6, { damping: 12, stiffness: 150 });
      eyeOffsetY.value = withSpring(4, { damping: 12, stiffness: 150 });
    } else {
      // Sun returns to right side
      sunPositionX.value = withSpring(0, { 
        damping: 15, 
        stiffness: 80,
        mass: 1.2,
      });
      // Eyes return to center
      eyeOffsetX.value = withSpring(0, { damping: 12, stiffness: 150 });
      eyeOffsetY.value = withSpring(0, { damping: 12, stiffness: 150 });
    }
  }, [isInputFocused]);

  const leftEyeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: eyeOffsetX.value },
        { translateY: eyeOffsetY.value },
      ],
    };
  });

  const rightEyeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: eyeOffsetX.value },
        { translateY: eyeOffsetY.value },
      ],
    };
  });

  const sunContainerStyle = useAnimatedStyle(() => {
    // Calculate position: from right side (8% from right) to left side (5% from left)
    // When sunPositionX = 0: stay at right (translateX = 0)
    // When sunPositionX = 1: move to left
    // Distance to move: from right edge (8% from right) to left edge (5% from left)
    // Total distance = width - (width * 0.08) - (width * 0.05) - 120
    const rightEdge = width - (width * 0.08);
    const leftEdge = width * 0.05;
    const distance = rightEdge - leftEdge - 120; // Subtract sun width
    
    const translateX = interpolate(
      sunPositionX.value,
      [0, 1],
      [0, -distance] // Start at 0 (right side), move negative (left)
    );
    
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <Animated.View style={[styles.sunContainer, sunContainerStyle]}>
      <MotiView
        style={styles.sunInner}
        from={{ scale: 1, rotate: '0deg' }}
        animate={{
          scale: [1, 1.05, 1],
          rotate: ['-8deg', '8deg', '-8deg'],
        }}
        transition={{
          type: 'timing',
          duration: 4000,
          loop: true,
        }}
      >
        <View style={styles.sun}>
          {/* Sun face with animated eyes - LEFT EYE */}
          <Animated.View style={[styles.sunEye, styles.leftEye, leftEyeStyle]} />
          {/* Sun face with animated eyes - RIGHT EYE */}
          <Animated.View style={[styles.sunEye, styles.rightEye, rightEyeStyle]} />
          <View style={styles.sunMouth} />
        </View>
      </MotiView>
    </Animated.View>
  );
};

export const SunBackground: React.FC<SunBackgroundProps> = ({ 
  textLength = 0, 
  isInputFocused = false 
}) => {
  const clouds = [
    // Scattered throughout
    { id: 1, x: 10, y: 15, size: 90, delay: 0 },
    { id: 2, x: 70, y: 20, size: 100, delay: 500 },
    { id: 3, x: 35, y: 30, size: 85, delay: 1000 },
    { id: 4, x: 80, y: 35, size: 95, delay: 1500 },
    { id: 5, x: 15, y: 45, size: 110, delay: 2000 },
    { id: 6, x: 60, y: 50, size: 105, delay: 2500 },
    { id: 7, x: 25, y: 60, size: 120, delay: 3000 },
    { id: 8, x: 75, y: 65, size: 115, delay: 3500 },
    { id: 9, x: 5, y: 75, size: 130, delay: 4000 },
    { id: 10, x: 50, y: 80, size: 125, delay: 4500 },
    { id: 11, x: 85, y: 85, size: 140, delay: 5000 },
    { id: 12, x: 20, y: 90, size: 135, delay: 5500 },
  ];

  return (
    <View style={styles.container}>
      {/* Clouds scattered throughout */}
      {clouds.map((cloud) => (
        <Cloud
          key={cloud.id}
          x={cloud.x}
          y={cloud.y}
          size={cloud.size}
          delay={cloud.delay}
        />
      ))}
      
      {/* Sun - positioned in top-left */}
      <Sun isInputFocused={isInputFocused} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
    backgroundColor: '#FFE5CC', // Single color - soft light orange
  },
  sunContainer: {
    position: 'absolute',
    top: '8%',
    right: '8%',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  sunInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sun: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFEB3B', // Brighter yellow
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#FFEB3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 2,
  },
  sunEye: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D2D2D',
  },
  leftEye: {
    top: 32,
    left: 28,
  },
  rightEye: {
    top: 32,
    right: 28,
  },
  sunMouth: {
    position: 'absolute',
    top: 55,
    width: 30,
    height: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#2D2D2D',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  cloud: {
    position: 'absolute',
    borderRadius: 50,
  },
  cloudCircle1: {
    position: 'absolute',
    width: '40%',
    height: '60%',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    top: '20%',
    left: '10%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cloudCircle2: {
    position: 'absolute',
    width: '50%',
    height: '70%',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    top: '10%',
    left: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cloudCircle3: {
    position: 'absolute',
    width: '45%',
    height: '65%',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    top: '15%',
    left: '55%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cloudCircle4: {
    position: 'absolute',
    width: '35%',
    height: '55%',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    top: '25%',
    left: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
