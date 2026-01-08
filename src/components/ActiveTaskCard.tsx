import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle as SvgCircle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { TimelineTask } from './TimelineDashboard';
import { lightColors as colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const PROGRESS_RING_SIZE = 80;
const PROGRESS_RING_RADIUS = 35;
const PROGRESS_RING_STROKE = 4;

interface ActiveTaskCardProps {
  task: TimelineTask;
  currentTimeMinutes: number;
  onComplete: () => void;
}

export const ActiveTaskCard: React.FC<ActiveTaskCardProps> = ({
  task,
  currentTimeMinutes,
  onComplete,
}) => {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const progress = useSharedValue(0);

  // Calculate time remaining
  const timeRemaining = useMemo(() => {
    const elapsed = currentTimeMinutes - task.startTime;
    const total = task.endTime - task.startTime;
    return Math.max(0, total - elapsed);
  }, [currentTimeMinutes, task.startTime, task.endTime]);

  const progressPercentage = useMemo(() => {
    const elapsed = currentTimeMinutes - task.startTime;
    const total = task.endTime - task.startTime;
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [currentTimeMinutes, task.startTime, task.endTime]);

  // Update progress ring
  useEffect(() => {
    progress.value = withTiming(progressPercentage, { duration: 300 });
  }, [progressPercentage]);

  // Format time remaining
  const formatTimeRemaining = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Slide gesture
  const panGesture = Gesture.Pan()
    .onStart(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((e) => {
      if (e.translationX > 0) {
        translateX.value = e.translationX;
        // Scale down slightly as user slides
        scale.value = interpolate(
          e.translationX,
          [0, CARD_WIDTH * 0.5],
          [1, 0.9],
          Extrapolate.CLAMP
        );
      }
    })
    .onEnd((e) => {
      const threshold = CARD_WIDTH * 0.6; // 60% of card width to complete
      
      if (e.translationX > threshold) {
        // Complete the task
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        // Animate off screen
        translateX.value = withSpring(CARD_WIDTH * 1.5, {
          damping: 15,
          stiffness: 200,
        });
        scale.value = withTiming(0.5, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(onComplete)();
        });
      } else {
        // Spring back
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Calculate stroke dasharray for the ring
  const circumference = 2 * Math.PI * PROGRESS_RING_RADIUS;
  
  // Progress ring animation - use animated props for SVG
  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (progress.value / 100) * circumference;
    return {
      strokeDashoffset,
    };
  });
  
  const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, cardStyle]}>
        <View style={styles.card}>
          {/* Progress Ring */}
          <View style={styles.progressRingContainer}>
            <Svg width={PROGRESS_RING_SIZE} height={PROGRESS_RING_SIZE}>
              <G rotation="-90" origin={`${PROGRESS_RING_SIZE / 2}, ${PROGRESS_RING_SIZE / 2}`}>
                {/* Background circle */}
                <SvgCircle
                  cx={PROGRESS_RING_SIZE / 2}
                  cy={PROGRESS_RING_SIZE / 2}
                  r={PROGRESS_RING_RADIUS}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth={PROGRESS_RING_STROKE}
                  fill="transparent"
                />
                {/* Progress circle */}
                <AnimatedCircle
                  cx={PROGRESS_RING_SIZE / 2}
                  cy={PROGRESS_RING_SIZE / 2}
                  r={PROGRESS_RING_RADIUS}
                  stroke={colors.primary}
                  strokeWidth={PROGRESS_RING_STROKE}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeLinecap="round"
                  animatedProps={animatedCircleProps as any}
                />
              </G>
            </Svg>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressText}>
                {formatTimeRemaining(timeRemaining)}
              </Text>
            </View>
          </View>

          {/* Task Content */}
          <View style={styles.content}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            {task.description && (
              <Text style={styles.taskDescription}>{task.description}</Text>
            )}
          </View>

          {/* Slide Indicator */}
          <View style={styles.slideIndicator}>
            <Text style={styles.slideText}>← Slide to complete</Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  progressRingContainer: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: PROGRESS_RING_SIZE,
    height: PROGRESS_RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    width: PROGRESS_RING_SIZE,
    height: PROGRESS_RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    marginTop: 20,
    marginRight: PROGRESS_RING_SIZE + 16,
    marginBottom: 60,
  },
  taskTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 36,
  },
  taskDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 24,
  },
  slideIndicator: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  slideText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
});

