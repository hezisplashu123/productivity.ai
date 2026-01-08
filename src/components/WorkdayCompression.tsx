import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolateColor,
  interpolate,
  FadeIn,
} from 'react-native-reanimated';

interface WorkdayCompressionProps {
  height?: number;
}

// Theme colors
const DULL_GREY = '#333333'; // For "8 HOURS" bar
const NEON_ORANGE = '#FF4500'; // For "4 HOURS" bar (Neon Orange)
const BAR_HEIGHT = 65;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_CONTAINER_PADDING = 20; // Padding from parent chartContainer
const MAX_BAR_WIDTH = SCREEN_WIDTH - (CHART_CONTAINER_PADDING * 2);

export const WorkdayCompression: React.FC<WorkdayCompressionProps> = ({
  height = 200,
}) => {
  // Animation progress: 0 = full width grey, 1 = half width orange
  const animationProgress = useSharedValue(0);

  // Start animations 2 seconds after mount
  useEffect(() => {
    // Animate bar shrinking and color change
    animationProgress.value = withDelay(
      2000,
      withTiming(1, {
        duration: 2200,
      })
    );
  }, []);

  // Animated style for the bar
  const barStyle = useAnimatedStyle(() => {
    const width = MAX_BAR_WIDTH * (1 - animationProgress.value * 0.5); // Shrinks from 100% to 50%
    
    // Interpolate color from grey to orange
    const backgroundColor = interpolateColor(
      animationProgress.value,
      [0, 1],
      [DULL_GREY, NEON_ORANGE]
    );

    // Interpolate shadow opacity for glow effect (only on orange)
    const shadowOpacity = animationProgress.value * 0.8;

    return {
      width,
      backgroundColor,
      shadowColor: NEON_ORANGE,
      shadowOpacity,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
      elevation: animationProgress.value > 0.5 ? 8 : 0,
    };
  });

  // Animated style for label opacity - switches at 0.6 progress
  const label8HoursStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationProgress.value,
      [0, 0.6, 0.7],
      [1, 1, 0],
      'clamp'
    );
    return { opacity };
  });

  const label4HoursStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animationProgress.value,
      [0.6, 0.7, 1],
      [0, 0, 1],
      'clamp'
    );
    return { opacity };
  });

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.barWrapper}>
        <Animated.View style={[styles.bar, barStyle]}>
          {/* Label - "8 HOURS" fades out, "4 HOURS" fades in */}
          <Animated.Text
            entering={FadeIn.delay(500)}
            style={[styles.label, label8HoursStyle]}
          >
            8 HOURS
          </Animated.Text>
          <Animated.Text
            style={[styles.label, styles.labelOverlay, label4HoursStyle]}
          >
            4 HOURS
          </Animated.Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  barWrapper: {
    width: '100%',
    height: BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bar: {
    height: BAR_HEIGHT,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center', // Center the bar so it shrinks from both sides
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  labelOverlay: {
    position: 'absolute',
  },
});
