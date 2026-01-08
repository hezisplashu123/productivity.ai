import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
// Using dark theme colors directly - will be passed as props or context in the future

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface TaskGoal {
  id: string;
  title: string; // e.g. "Launch Website"
  totalTime: number; // in minutes
  color: string; // Hex code for the glow (e.g., "#FF4500" or "#00F0FF")
  subTasks: {
    id: string;
    title: string; // e.g. "Fix Navbar"
    duration: number; // e.g. 20 (minutes)
    isCompleted: boolean;
  }[];
}

interface TaskReactorCircleProps {
  taskGoal: TaskGoal;
  onPress: (taskGoal: TaskGoal) => void;
  isNew?: boolean; // For entry animation
}

const CIRCLE_SIZE = 140;
const CIRCLE_CENTER = CIRCLE_SIZE / 2;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const TaskReactorCircle: React.FC<TaskReactorCircleProps> = ({
  taskGoal,
  onPress,
  isNew = false,
}) => {
  // Safety check
  if (!taskGoal || !taskGoal.id) {
    return null;
  }

  const scale = useSharedValue(isNew ? 0 : 1);
  const animatedProgress = useSharedValue(0);
  
  // Entry animation for new circles
  useEffect(() => {
    if (isNew) {
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });
    }
  }, [isNew, scale]);

  // Calculate completion percentage
  const subTasks = taskGoal?.subTasks || [];
  const completedTasks = subTasks.filter((st) => st.isCompleted).length;
  const totalTasks = subTasks.length || 1;
  const progressPercentage = totalTasks > 0 ? completedTasks / totalTasks : 0;

  // Animate progress
  useEffect(() => {
    animatedProgress.value = withTiming(progressPercentage, {
      duration: 500,
    });
  }, [progressPercentage]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });

    onPress(taskGoal);
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

  const percentage = Math.round(progressPercentage * 100);
  const gradientId = `gradient-${taskGoal.id}`;
  
  // Create glow effect colors
  const neonColor = taskGoal.color;
  const glowColor1 = neonColor;
  const glowColor2 = neonColor + 'CC'; // 80% opacity
  const glowColor3 = neonColor + '80'; // 50% opacity

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={handlePress} style={styles.container}>
        <View style={styles.circleWrapper}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svg}>
            <Defs>
              {/* Neon gradient for glow effect */}
              <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={glowColor1} stopOpacity="1" />
                <Stop offset="50%" stopColor={glowColor2} stopOpacity="0.9" />
                <Stop offset="100%" stopColor={glowColor3} stopOpacity="0.7" />
              </LinearGradient>
            </Defs>

            {/* Background track - thin, dark grey */}
            <Circle
              cx={CIRCLE_CENTER}
              cy={CIRCLE_CENTER}
              r={RADIUS}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />

            {/* Glow layers for neon effect */}
            {progressPercentage > 0 && (
              <>
                {/* Outer glow - subtle blur effect */}
                <AnimatedCircle
                  cx={CIRCLE_CENTER}
                  cy={CIRCLE_CENTER}
                  r={RADIUS}
                  stroke={neonColor}
                  strokeWidth={STROKE_WIDTH + 6}
                  fill="transparent"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${CIRCLE_CENTER} ${CIRCLE_CENTER})`}
                  opacity={0.25}
                  animatedProps={animatedCircleProps}
                />
                {/* Middle glow */}
                <AnimatedCircle
                  cx={CIRCLE_CENTER}
                  cy={CIRCLE_CENTER}
                  r={RADIUS}
                  stroke={neonColor}
                  strokeWidth={STROKE_WIDTH + 3}
                  fill="transparent"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${CIRCLE_CENTER} ${CIRCLE_CENTER})`}
                  opacity={0.4}
                  animatedProps={animatedCircleProps}
                />
              </>
            )}

            {/* Main progress circle - crisp neon stroke */}
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

          {/* Center percentage */}
          <View style={styles.centerContent}>
            <Text style={styles.percentageText}>{percentage}%</Text>
          </View>
        </View>

        {/* Goal name below circle */}
        <Text style={styles.goalName} numberOfLines={2}>
          {taskGoal.title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  percentageText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF', // White text for dark theme
    fontFamily: 'monospace',
    letterSpacing: -1,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF', // White text for dark theme
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
});

