import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  useAnimatedStyle,
  withSpring,
  Easing,
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
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

  const completedCount = taskGoal.subTasks ? taskGoal.subTasks.filter((st) => st.isCompleted).length : 0;
  const totalCount = taskGoal.subTasks ? taskGoal.subTasks.length : 1;
  const percentage = totalCount > 0 ? completedCount / totalCount : 0;

  useEffect(() => {
    animatedProgress.value = withTiming(percentage, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

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
  }));

  const gradientId = `neon-blue-${taskGoal.id}`;

  return (
    <Animated.View style={[styles.container, cardStyle]}>
      <Pressable 
        onPress={() => onPress(taskGoal)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <View style={styles.gaugeContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            <Defs>
              <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#00F0FF" />
                <Stop offset="100%" stopColor="#2563EB" />
              </LinearGradient>
            </Defs>

            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke="#F1F5F9"
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              rotation={ROTATION}
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />

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
            <Text style={styles.percentText}>{Math.round(percentage * 100)}%</Text>
            {percentage === 1 && (
               <Text style={styles.completedLabel}>DONE</Text>
            )}
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>{taskGoal.title}</Text>
          <Text style={styles.description}>
            {completedCount} / {totalCount} Steps
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { width: '48%', marginBottom: 16 },
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
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
    letterSpacing: 1,
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