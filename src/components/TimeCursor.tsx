import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { lightColors as colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMELINE_LEFT_MARGIN = 40;
const PIXELS_PER_MINUTE = 1.5;
const MINUTES_PER_DAY = 24 * 60;

interface TimeCursorProps {
  currentTimeMinutes: number;
  totalDayMinutes: number;
}

export const TimeCursor: React.FC<TimeCursorProps> = ({
  currentTimeMinutes,
  totalDayMinutes,
}) => {
  const position = useSharedValue(currentTimeMinutes * PIXELS_PER_MINUTE);

  useEffect(() => {
    // Smoothly animate to new position
    position.value = withTiming(currentTimeMinutes * PIXELS_PER_MINUTE, {
      duration: 60000, // 1 minute animation
    });
  }, [currentTimeMinutes]);

  const cursorStyle = useAnimatedStyle(() => {
    return {
      top: position.value,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        position.value,
        [0, totalDayMinutes * PIXELS_PER_MINUTE],
        [0.8, 0.8]
      ),
    };
  });

  return (
    <Animated.View style={[styles.cursorContainer, cursorStyle]}>
      {/* Glowing Dot */}
      <Animated.View style={[styles.glowDot, glowStyle]}>
        <View style={styles.innerDot} />
      </Animated.View>

      {/* Horizontal Red Line */}
      <View style={styles.redLine} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cursorContainer: {
    position: 'absolute',
    left: TIMELINE_LEFT_MARGIN - 6,
    width: SCREEN_WIDTH - TIMELINE_LEFT_MARGIN - 20,
    height: 2,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  glowDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.error,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  redLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.error,
    marginLeft: 6,
  },
});

