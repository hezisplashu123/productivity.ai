import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { X, Pause, Play, CheckCircle2 } from 'lucide-react-native';
import { Task } from '../types';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { useAnimatedProps } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CIRCLE_SIZE = 200;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface FocusModeModalProps {
  visible: boolean;
  task: Task | null;
  onComplete: (taskId: string) => void;
  onClose: () => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  visible,
  task,
  onComplete,
  onClose,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const progress = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible && task) {
      const duration = task.duration || task.timeBudget || 0;
      setTimeRemaining(duration * 60); // Convert minutes to seconds
      setIsPaused(false);
      setIsCompleted(false);
      progress.value = 0;
    }
  }, [visible, task]);

  useEffect(() => {
    if (visible && task && !isPaused && !isCompleted && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [visible, task, isPaused, isCompleted, timeRemaining]);

  useEffect(() => {
    if (task && timeRemaining >= 0) {
      const duration = task.duration || task.timeBudget || 0;
      const totalSeconds = duration * 60;
      const elapsed = totalSeconds - timeRemaining;
      progress.value = withTiming(elapsed / totalSeconds, { duration: 1000 });
    }
  }, [timeRemaining, task]);

  useEffect(() => {
    if (isPaused) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isPaused]);

  const handleComplete = () => {
    setIsCompleted(true);
    setIsPaused(true);
    if (task) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        onComplete(task.id);
        onClose();
      }, 2000);
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
    };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!task) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Task Info */}
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {task.title}
          </Text>
          {task.description && (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {task.description}
            </Text>
          )}
        </View>

        {/* Circular Progress Timer */}
        <Animated.View style={[styles.timerContainer, pulseStyle]}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            {/* Background Circle */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={colors.border}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
            {/* Progress Circle */}
            <AnimatedCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={isCompleted ? colors.success : colors.primary}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={animatedCircleProps}
              strokeLinecap="round"
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            />
          </Svg>
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerText}>
              {isCompleted ? 'Done!' : formatTime(timeRemaining)}
            </Text>
            {!isCompleted && (
              <Text style={styles.timerLabel}>
                {isPaused ? 'Paused' : 'Focusing'}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Control Button */}
        {!isCompleted && (
          <TouchableOpacity
            style={[
              styles.controlButton,
              isPaused && styles.controlButtonPaused,
            ]}
            onPress={handlePause}
            activeOpacity={0.8}
          >
            {isPaused ? (
              <>
                <Play size={24} color={colors.background} fill={colors.background} />
                <Text style={styles.controlButtonText}>Resume</Text>
              </>
            ) : (
              <>
                <Pause size={24} color={colors.background} fill={colors.background} />
                <Text style={styles.controlButtonText}>Pause</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isCompleted && (
          <View style={styles.completedContainer}>
            <CheckCircle2 size={48} color={colors.success} fill={colors.success} />
            <Text style={styles.completedText}>Great work!</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  timerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: -2,
  },
  timerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  controlButtonPaused: {
    backgroundColor: colors.textSecondary,
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.background,
  },
  completedContainer: {
    alignItems: 'center',
    gap: 16,
  },
  completedText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.success,
  },
});

