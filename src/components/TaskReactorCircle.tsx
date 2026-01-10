import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedView = Animated.createAnimatedComponent(View);

const CIRCLE_SIZE = 120;
const STROKE_WIDTH = 10;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// A 260-degree arc (open at the bottom)
const ARC_ANGLE = 260;
const ARC_LENGTH = (ARC_ANGLE / 360) * CIRCUMFERENCE;
// Rotate to center the opening at the bottom
const ROTATION = 90 + (360 - ARC_ANGLE) / 2; 

export const TaskReactorCircle = ({ taskGoal, onPress }: any) => {
  const animatedProgress = useSharedValue(0);
  const scale = useSharedValue(1);
  
  const completedCount = taskGoal.subTasks.filter((st: any) => st.isCompleted).length;
  const totalCount = taskGoal.subTasks.length || 1;
  const percentage = completedCount / totalCount;

  useEffect(() => {
    animatedProgress.value = withTiming(percentage, { duration: 1000 });
  }, [percentage]);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
    Haptics.selectionAsync();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const animatedCircleProps = useAnimatedProps(() => {
    // Map 0-1 to the full arc length
    const strokeDashoffset = CIRCUMFERENCE - (ARC_LENGTH * animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Unique Gradient ID based on task ID to prevent caching issues
  const gradientId = `grad-${taskGoal.id}`;

  return (
    <AnimatedView style={[styles.container, cardStyle]}>
      <Pressable 
        onPress={() => onPress(taskGoal)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{taskGoal.title}</Text>
          <Text style={styles.subtitle}>{totalCount} Steps</Text>
        </View>

        <View style={styles.gaugeContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            <Defs>
              <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#00F0FF" /> {/* Neon Cyan */}
                <Stop offset="100%" stopColor="#007AFF" /> {/* Electric Blue */}
              </LinearGradient>
            </Defs>

            {/* Background Track (Subtle Grey) */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke="#F3F4F6"
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
              rotation={ROTATION}
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
            />

            {/* Active Progress Gradient Bar */}
            <AnimatedCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              strokeLinecap="round"
              rotation={ROTATION}
              origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
              animatedProps={animatedCircleProps}
            />
          </Svg>

          {/* Centered Percentage */}
          <View style={styles.centerContent}>
            <Text style={styles.percentText}>{Math.round(percentage * 100)}%</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: percentage === 1 ? '#E6FFFA' : '#F0F9FF' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: percentage === 1 ? '#059669' : '#0284C7' }
            ]}>
              {percentage === 1 ? 'Complete' : percentage === 0 ? 'Not Started' : 'In Progress'}
            </Text>
          </View>
        </View>
      </Pressable>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  container: { 
    width: '48%', 
    marginBottom: 16 
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    // Soft, luxurious shadow
    shadowColor: '#0047FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    height: 230, // Fixed height for uniformity
    justifyContent: 'space-between',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  gaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: -1,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});