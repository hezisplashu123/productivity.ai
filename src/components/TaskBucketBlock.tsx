import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = 120;
const CIRCLE_CENTER = CIRCLE_SIZE / 2;
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TaskBucketBlockProps {
  taskTypeName: string;
  totalTime: number; // in minutes
  timeCompleted: number; // in minutes
  progressPercentage: number; // 0-1
  themeColor?: string; // Optional theme color for glow
  taskId?: string; // Optional task ID for navigation
  onPress?: () => void; // Optional custom press handler
}

export const TaskBucketBlock: React.FC<TaskBucketBlockProps> = ({
  taskTypeName,
  totalTime,
  timeCompleted,
  progressPercentage,
  themeColor = '#FF6B35', // Safety Orange default
  taskId,
  onPress,
}) => {
  const router = useRouter();
  const scale = useSharedValue(1);
  const animatedProgress = useSharedValue(0);

  // Animate progress value
  useEffect(() => {
    animatedProgress.value = withTiming(progressPercentage, {
      duration: 500,
    });
  }, [progressPercentage]);

  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Scale animation
    scale.value = withSpring(0.97, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });

    if (onPress) {
      onPress();
    } else if (taskId) {
      // Navigate to focus mode with task ID
      router.push({
        pathname: '/goal-input',
        params: { taskId, taskType: taskTypeName },
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Animated props for progress circle
  const animatedCircleProps = useAnimatedProps(() => {
    const strokeDashoffset = CIRCUMFERENCE * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  // Format time
  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const timeRemaining = totalTime - timeCompleted;
  const percentage = Math.round(progressPercentage * 100);

  // Create gradient colors with opacity for glow effect
  const gradientId = `gradient-${taskId || 'default'}`;
  const glowColor = themeColor;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.content}>
          {/* Circular Progress Indicator */}
          <View style={styles.circleContainer}>
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svg}>
              <Defs>
                <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={glowColor} stopOpacity="1" />
                  <Stop offset="50%" stopColor={glowColor} stopOpacity="0.8" />
                  <Stop offset="100%" stopColor={glowColor} stopOpacity="0.4" />
                </RadialGradient>
              </Defs>

              {/* Background track */}
              <Circle
                cx={CIRCLE_CENTER}
                cy={CIRCLE_CENTER}
                r={RADIUS}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />

              {/* Glow layer - outer blur effect using multiple circles */}
              {progressPercentage > 0 && (
                <>
                  {/* Outer glow circle 1 */}
                  <AnimatedCircle
                    cx={CIRCLE_CENTER}
                    cy={CIRCLE_CENTER}
                    r={RADIUS}
                    stroke={glowColor}
                    strokeWidth={STROKE_WIDTH + 8}
                    fill="transparent"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${CIRCLE_CENTER} ${CIRCLE_CENTER})`}
                    opacity={0.2}
                    animatedProps={animatedCircleProps}
                  />
                  {/* Outer glow circle 2 */}
                  <AnimatedCircle
                    cx={CIRCLE_CENTER}
                    cy={CIRCLE_CENTER}
                    r={RADIUS}
                    stroke={glowColor}
                    strokeWidth={STROKE_WIDTH + 4}
                    fill="transparent"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${CIRCLE_CENTER} ${CIRCLE_CENTER})`}
                    opacity={0.3}
                    animatedProps={animatedCircleProps}
                  />
                </>
              )}

              {/* Main progress circle with gradient */}
              {progressPercentage > 0 && (
                <AnimatedCircle
                  cx={CIRCLE_CENTER}
                  cy={CIRCLE_CENTER}
                  r={RADIUS}
                  stroke={`url(#${gradientId})`}
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${CIRCLE_CENTER} ${CIRCLE_CENTER})`}
                  animatedProps={animatedCircleProps}
                />
              )}
            </Svg>

            {/* Center content */}
            <View style={styles.circleCenterContent}>
              <Text style={styles.percentageText}>{percentage}%</Text>
              <Text style={styles.centerLabel}>Daily Goal</Text>
            </View>
          </View>

          {/* Task Details */}
          <View style={styles.taskDetails}>
            <Text style={styles.taskTypeName}>{taskTypeName}</Text>
            <Text style={styles.timeAllocated}>
              {formatTime(totalTime)} allocated
            </Text>
            <Text style={styles.timeRemaining}>
              {timeRemaining > 0 ? `${formatTime(timeRemaining)} left` : 'Complete'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pressed: {
    opacity: 0.9,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  circleCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  percentageText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  centerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  taskDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  taskTypeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  timeAllocated: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  timeRemaining: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
