import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { lightColors as colors } from '../constants/colors';

const { width } = Dimensions.get('window');
const REACTOR_SIZE = width * 0.5; // 50% of screen width
const REACTOR_CENTER = REACTOR_SIZE / 2;

interface ReactorCoreProps {
  streak: number;
  isActive: boolean;
  onPress?: () => void;
}

export const ReactorCore: React.FC<ReactorCoreProps> = ({
  streak,
  isActive,
  onPress,
}) => {
  // Pulsing animation
  const pulseScale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    // Continuous pulsing animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );

    // Continuous opacity animation for breathing effect
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1500 }),
        withTiming(0.7, { duration: 1500 })
      ),
      -1,
      false
    );
  }, []);

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Spike animation - temporarily increase scale and opacity
    pulseScale.value = withSequence(
      withTiming(1.15, { duration: 100 }),
      withTiming(1.05, { duration: 200 })
    );
    
    opacity.value = withSequence(
      withTiming(1.2, { duration: 100 }),
      withTiming(0.9, { duration: 200 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: opacity.value,
    };
  });

  // Determine colors based on active state
  const primaryColor = isActive ? colors.primary : '#6B6B6B'; // Amber or dim grey
  const secondaryColor = isActive ? colors.primaryLight : '#8B8B8B';
  const accentColor = isActive ? colors.accent : '#8B8B8B';
  const hotCoreColor = isActive ? '#FFA500' : '#8B8B8B';
  const glowColor = isActive ? colors.glow : 'rgba(107, 107, 107, 0.2)';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={styles.container}
    >
      <Animated.View style={[styles.reactorWrapper, animatedStyle]}>
        <View style={styles.svgContainer}>
          <Svg width={REACTOR_SIZE} height={REACTOR_SIZE} style={styles.svg}>
            <Defs>
              {/* Outer glow gradient */}
              <RadialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={glowColor} stopOpacity="0.6" />
                <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
              </RadialGradient>
              
              {/* Main reactor gradient */}
              <RadialGradient id="reactorGradient" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
                <Stop offset="40%" stopColor={secondaryColor} stopOpacity="0.9" />
                <Stop offset="70%" stopColor={accentColor} stopOpacity="0.5" />
                <Stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
              </RadialGradient>
              
              {/* Inner hot core gradient */}
              <RadialGradient id="coreGradient" cx="50%" cy="50%" r="40%">
                <Stop offset="0%" stopColor={hotCoreColor} stopOpacity="1" />
                <Stop offset="60%" stopColor={primaryColor} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Outer glow ring */}
            <Circle
              cx={REACTOR_CENTER}
              cy={REACTOR_CENTER}
              r={REACTOR_CENTER * 0.95}
              fill="url(#glowGradient)"
            />

            {/* Main reactor core */}
            <Circle
              cx={REACTOR_CENTER}
              cy={REACTOR_CENTER}
              r={REACTOR_CENTER * 0.8}
              fill="url(#reactorGradient)"
            />

            {/* Inner hot core */}
            <Circle
              cx={REACTOR_CENTER}
              cy={REACTOR_CENTER}
              r={REACTOR_CENTER * 0.5}
              fill="url(#coreGradient)"
            />
          </Svg>
        </View>

        {/* Streak count overlay */}
        <View style={styles.streakOverlay}>
          <Text style={[styles.streakNumber, { color: colors.text }]}>
            {streak}
          </Text>
          <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
            DAYS
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactorWrapper: {
    width: REACTOR_SIZE,
    height: REACTOR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    position: 'absolute',
    width: REACTOR_SIZE,
    height: REACTOR_SIZE,
  },
  svg: {
    width: REACTOR_SIZE,
    height: REACTOR_SIZE,
  },
  streakOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: -1,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginTop: 4,
  },
});
