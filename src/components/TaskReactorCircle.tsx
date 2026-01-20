import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface TaskGoal {
  id: string;
  title: string;
  color: string;
  totalTime: number;
  subTasks: {
    id: string;
    title: string;
    duration: number;
    isCompleted: boolean;
  }[];
  isFullyComplete?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

const CIRCLE_SIZE = 160; 
const STROKE_WIDTH = 14;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ARC_ANGLE = 270;
const ARC_LENGTH = (ARC_ANGLE / 360) * CIRCUMFERENCE;
const ROTATION = 135;

const TaskReactorCircle = ({ taskGoal, onPress }: { taskGoal: TaskGoal, onPress: (g: TaskGoal) => void }) => {
  const animatedProgress = useSharedValue(0);
  const scale = useSharedValue(1);
  
  // Single master value for the breathing glow animation (0 to 1)
  const glowPhase = useSharedValue(0);

  const completedCount = taskGoal.subTasks ? taskGoal.subTasks.filter((st) => st.isCompleted).length : 0;
  const totalCount = taskGoal.subTasks ? taskGoal.subTasks.length : 1;
  const percentage = totalCount > 0 ? completedCount / totalCount : 0;
  const isComplete = percentage === 1;

  useEffect(() => {
    animatedProgress.value = withTiming(percentage, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });

    if (isComplete) {
      // Continuous smooth breathing animation
      glowPhase.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true // Reverse direction to make it breathe in and out
      );
    } else {
        glowPhase.value = 0;
    }
  }, [percentage, isComplete]);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
    Haptics.selectionAsync();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const animatedCircleProps = useAnimatedProps(() => {
    const targetOffset = CIRCUMFERENCE - (ARC_LENGTH * animatedProgress.value);
    return {
      strokeDashoffset: targetOffset,
    };
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: isComplete ? '#F59E0B' : '#F1F5F9',
  }));

  // Layer 1: Wide expanding ring (Radiates outward)
  const glowLayer1Style = useAnimatedStyle(() => ({
    opacity: interpolate(glowPhase.value, [0, 1], [0.4, 0.0]), // Fades out as it expands
    transform: [{ scale: interpolate(glowPhase.value, [0, 1], [1.0, 1.15]) }], // Expands outward
  }));

  // Layer 2: Intense backing glow (Pulses intensity)
  const glowLayer2Style = useAnimatedStyle(() => ({
    opacity: interpolate(glowPhase.value, [0, 1], [0.2, 0.5]),
    transform: [{ scale: interpolate(glowPhase.value, [0, 1], [0.98, 1.02]) }],
  }));

  // Text Pulse: Makes the "TAP TO CLAIM" text breathe
  const textPulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPhase.value, [0, 1], [0.7, 1]),
    transform: [{ scale: interpolate(glowPhase.value, [0, 1], [0.95, 1.05]) }],
  }));

  const gradientId = `neon-${isComplete ? 'gold' : 'blue'}-${taskGoal.id}`;

  return (
    <Animated.View style={[styles.container, cardStyle]}>
      {isComplete && (
        <>
          {/* Layer 1: Wide expanding ring */}
          <AnimatedView style={[styles.glowRing, glowLayer1Style]} />
          {/* Layer 2: Intense backing glow */}
          <AnimatedView style={[styles.glowBackground, glowLayer2Style]} />
        </>
      )}
      
      <Pressable 
        onPress={() => onPress(taskGoal)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, isComplete && styles.completedCard]}
      >
        <View style={styles.gaugeContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            <Defs>
              <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={isComplete ? "#F59E0B" : "#00F0FF"} />
                <Stop offset="100%" stopColor={isComplete ? "#FBBF24" : "#2563EB"} />
              </LinearGradient>
            </Defs>

            {/* Track */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={isComplete ? "rgba(245, 158, 11, 0.1)" : "#F1F5F9"}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              rotation={ROTATION}
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />

            {/* Progress Fill */}
            <AnimatedCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              rotation={ROTATION}
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
              animatedProps={animatedCircleProps}
            />
          </Svg>
          
          <View style={styles.centerContent}>
            {isComplete ? (
                <>
                    <Text style={[styles.percentText, { color: '#D97706' }]}>100%</Text>
                    <Text style={styles.completedLabel}>COMPLETE</Text>
                    <AnimatedText style={[styles.tapToClaimLabel, textPulseStyle]}>
                        TAP TO CLAIM
                    </AnimatedText>
                </>
            ) : (
                <Text style={styles.percentText}>{Math.round(percentage * 100)}%</Text>
            )}
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.title, isComplete && { color: '#B45309' }]} numberOfLines={1}>
            {taskGoal.title}
          </Text>
          <Text style={[styles.description, isComplete && { color: '#D97706' }]}>
            {completedCount} / {totalCount} Steps
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { width: '48%', marginBottom: 16 },
  glowBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F59E0B',
    borderRadius: 24,
    zIndex: -1,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F59E0B',
    zIndex: -2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  completedCard: {
    backgroundColor: '#FFFBEB', // Light gold bg
    borderColor: '#FCD34D',
  },
  gaugeContainer: {
    position: 'relative',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE - 25,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  centerContent: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10,
  },
  percentText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: -1,
  },
  completedLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F59E0B',
    marginTop: 4,
    letterSpacing: 1,
  },
  tapToClaimLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309', // Darker gold/brown for contrast
    marginTop: 4,
    letterSpacing: 0.5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  infoContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
});

export default TaskReactorCircle;