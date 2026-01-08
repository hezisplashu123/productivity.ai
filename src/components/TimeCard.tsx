import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Play, CheckCircle2 } from 'lucide-react-native';
import { Task } from '../types';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';

interface TimeCardProps {
  task: Task;
  onPlay: (task: Task) => void;
  progress?: number; // 0-1 for in_progress tasks
}

export const TimeCard: React.FC<TimeCardProps> = ({
  task,
  onPlay,
  progress = 0,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlay(task);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => {
    const width = interpolate(progress, [0, 1], [0, 100]);
    return {
      width: `${width}%`,
    };
  });

  const formatDuration = (minutes: number): string => {
    const duration = minutes || 0;
    if (duration < 60) {
      return `${duration}m`;
    }
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const taskDuration = task.duration || task.timeBudget || 0;

  const isInProgress = task.status === 'in_progress';
  const isCompleted = task.status === 'completed';

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.card,
          isInProgress && styles.cardInProgress,
          isCompleted && styles.cardCompleted,
        ]}
        onPress={handlePlay}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={isCompleted}
      >
        {/* Progress Bar Background (for in_progress) */}
        {isInProgress && (
          <Animated.View style={[styles.progressBar, progressStyle]} />
        )}

        <View style={styles.cardContent}>
          {/* Left: Duration Display */}
          <View style={styles.durationContainer}>
            <Text style={styles.durationText}>{formatDuration(taskDuration)}</Text>
          </View>

          {/* Middle: Task Info */}
          <View style={styles.taskInfo}>
            <Text
              style={[
                styles.taskTitle,
                isCompleted && styles.taskTitleCompleted,
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            {task.description && (
              <Text
                style={[
                  styles.taskDescription,
                  isCompleted && styles.taskDescriptionCompleted,
                ]}
                numberOfLines={1}
              >
                {task.description}
              </Text>
            )}
          </View>

          {/* Right: Play Button or Checkmark */}
          <View style={styles.actionContainer}>
            {isCompleted ? (
              <CheckCircle2 size={32} color={colors.success} fill={colors.success} />
            ) : (
              <TouchableOpacity
                style={[
                  styles.playButton,
                  isInProgress && styles.playButtonActive,
                ]}
                onPress={handlePlay}
                activeOpacity={0.8}
              >
                <Play size={20} color={colors.background} fill={colors.background} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInProgress: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    opacity: 0.15,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 80,
  },
  durationContainer: {
    width: 80,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: -1,
  },
  taskInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  taskTitleCompleted: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  taskDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  taskDescriptionCompleted: {
    opacity: 0.6,
  },
  actionContainer: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playButtonActive: {
    backgroundColor: colors.success,
  },
});

