import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { FlatList } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { CheckCircle2, Circle } from 'lucide-react-native';
import Svg, { Line } from 'react-native-svg';
import { TimelineTask } from './TimelineDashboard';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const THREAD_LEFT_POSITION = SCREEN_WIDTH * 0.2; // 20% from left
const THREAD_WIDTH = 2;
const DOT_SIZE = 8;
const ITEM_SPACING = 30;
const GHOST_GAP_THRESHOLD = 20; // minutes

interface MinimalistTimelineProps {
  tasks: TimelineTask[];
  currentTimeMinutes: number;
  onTaskComplete?: (taskId: string) => void;
  onTaskPress?: (task: TimelineTask) => void;
}

interface TimelineItem {
  type: 'task' | 'ghost';
  data: TimelineTask | { startTime: number; endTime: number; duration: number };
  index: number;
}

export const MinimalistTimeline: React.FC<MinimalistTimelineProps> = ({
  tasks,
  currentTimeMinutes,
  onTaskComplete,
  onTaskPress,
}) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Find active task (happening right now)
  const activeTask = useMemo(() => {
    return tasks.find(
      (task) =>
        !task.completed &&
        currentTimeMinutes >= task.startTime &&
        currentTimeMinutes < task.endTime
    );
  }, [tasks, currentTimeMinutes]);

  // Get future tasks (not started yet)
  const futureTasks = useMemo(() => {
    return tasks.filter(
      (task) => !task.completed && task.startTime > currentTimeMinutes
    );
  }, [tasks, currentTimeMinutes]);

  // Build timeline items with ghost gaps
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];
    let lastEndTime = activeTask ? activeTask.endTime : currentTimeMinutes;

    // Add ghost gap before first future task if needed
    if (futureTasks.length > 0) {
      const firstTask = futureTasks[0];
      const gap = firstTask.startTime - lastEndTime;
      if (gap > GHOST_GAP_THRESHOLD) {
        items.push({
          type: 'ghost',
          data: {
            startTime: lastEndTime,
            endTime: firstTask.startTime,
            duration: gap,
          },
          index: items.length,
        });
      }
    }

    // Add future tasks with gaps
    futureTasks.forEach((task, index) => {
      items.push({
        type: 'task',
        data: task,
        index: items.length,
      });

      // Check for gap before next task
      if (index < futureTasks.length - 1) {
        const nextTask = futureTasks[index + 1];
        const gap = nextTask.startTime - task.endTime;
        if (gap > GHOST_GAP_THRESHOLD) {
          items.push({
            type: 'ghost',
            data: {
              startTime: task.endTime,
              endTime: nextTask.startTime,
              duration: gap,
            },
            index: items.length,
          });
        }
      }
    });

    return items;
  }, [futureTasks, activeTask, currentTimeMinutes]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const handleTaskPress = useCallback(
    (task: TimelineTask) => {
      if (expandedTaskId === task.id) {
        setExpandedTaskId(null);
      } else {
        setExpandedTaskId(task.id);
        onTaskPress?.(task);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [expandedTaskId, onTaskPress]
  );

  const handleTaskComplete = useCallback(
    (taskId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onTaskComplete?.(taskId);
    },
    [onTaskComplete]
  );

  return (
    <View style={styles.container}>
      {/* Thread Line */}
      <View style={styles.threadContainer}>
        <View style={styles.threadLine} />
      </View>

        {/* Active Task Card (Floating) */}
      {activeTask && (
        <View style={styles.activeCardWrapper}>
          <ActiveTaskCard
            task={activeTask}
            currentTimeMinutes={currentTimeMinutes}
            onComplete={() => handleTaskComplete(activeTask.id)}
            threadPosition={THREAD_LEFT_POSITION}
          />
        </View>
      )}

      {/* Future Tasks List */}
      <FlatList
        data={timelineItems}
        keyExtractor={(item) =>
          item.type === 'task'
            ? `task-${item.data.id}`
            : `ghost-${item.index}`
        }
        renderItem={({ item }) => {
          if (item.type === 'ghost') {
            const ghostData = item.data as {
              startTime: number;
              endTime: number;
              duration: number;
            };
            return (
              <GhostGapItem
                startTime={ghostData.startTime}
                endTime={ghostData.endTime}
                duration={ghostData.duration}
                threadPosition={THREAD_LEFT_POSITION}
              />
            );
          }

          const task = item.data as TimelineTask;
          const isExpanded = expandedTaskId === task.id;

          return (
            <FutureTaskItem
              task={task}
              isExpanded={isExpanded}
              onPress={() => handleTaskPress(task)}
              threadPosition={THREAD_LEFT_POSITION}
              formatTime={formatTime}
            />
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          activeTask ? <View style={{ height: 200 }} /> : null
        }
      />
    </View>
  );
};

// Active Task Card Component
interface ActiveTaskCardProps {
  task: TimelineTask;
  currentTimeMinutes: number;
  onComplete: () => void;
  threadPosition: number;
}

const ActiveTaskCard: React.FC<ActiveTaskCardProps> = ({
  task,
  currentTimeMinutes,
  onComplete,
  threadPosition,
}) => {
  const timeRemaining = useMemo(() => {
    const elapsed = currentTimeMinutes - task.startTime;
    const total = task.endTime - task.startTime;
    return Math.max(0, total - elapsed);
  }, [currentTimeMinutes, task.startTime, task.endTime]);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const progress = useMemo(() => {
    const elapsed = currentTimeMinutes - task.startTime;
    const total = task.endTime - task.startTime;
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [currentTimeMinutes, task.startTime, task.endTime]);

  return (
    <View style={styles.activeCard}>
      <View style={styles.activeCardContent}>
        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          <Text style={styles.timerLabel}>remaining</Text>
        </View>

        {/* Task Title */}
        <Text style={styles.activeTaskTitle} numberOfLines={2}>
          {task.title}
        </Text>
        {task.description && (
          <Text style={styles.activeTaskDescription} numberOfLines={2}>
            {task.description}
          </Text>
        )}

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progress}%` },
              ]}
            />
          </View>
        </View>

        {/* Mark Done Button */}
        <TouchableOpacity
          style={styles.markDoneButton}
          onPress={onComplete}
          activeOpacity={0.8}
        >
          <Text style={styles.markDoneText}>Mark Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Future Task Item Component
interface FutureTaskItemProps {
  task: TimelineTask;
  isExpanded: boolean;
  onPress: () => void;
  threadPosition: number;
  formatTime: (minutes: number) => string;
}

const FutureTaskItem: React.FC<FutureTaskItemProps> = ({
  task,
  isExpanded,
  onPress,
  threadPosition,
  formatTime,
}) => {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (isExpanded) {
      height.value = withSpring(120, {
        damping: 15,
        stiffness: 200,
      });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      height.value = withSpring(0, {
        damping: 15,
        stiffness: 200,
      });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isExpanded, height, opacity]);

  const expandedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.futureTaskItem, { marginBottom: ITEM_SPACING }]}>
      <TouchableOpacity
        style={styles.futureTaskRow}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Time Label (Left of Line) */}
        <View style={[styles.timeLabel, { width: threadPosition - 12 }]}>
          <Text style={styles.timeLabelText}>
            {formatTime(task.startTime)}
          </Text>
        </View>

        {/* Dot on Line */}
        <View
          style={[
            styles.taskDot,
            { left: threadPosition - DOT_SIZE / 2 },
          ]}
        >
          <Circle size={DOT_SIZE} color={colors.primary} fill={colors.primary} />
        </View>

        {/* Task Title (Right of Line) */}
        <View style={styles.taskTitleContainer}>
          <Text style={styles.taskTitleText} numberOfLines={1}>
            {task.title}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      <Animated.View style={[styles.expandedContent, expandedStyle]}>
        {task.description && (
          <Text style={styles.expandedDescription}>{task.description}</Text>
        )}
        <Text style={styles.expandedTime}>
          {formatTime(task.startTime)} - {formatTime(task.endTime)}
        </Text>
      </Animated.View>
    </View>
  );
};

// Ghost Gap Item Component
interface GhostGapItemProps {
  startTime: number;
  endTime: number;
  duration: number;
  threadPosition: number;
}

const GhostGapItem: React.FC<GhostGapItemProps> = ({
  startTime,
  endTime,
  duration,
  threadPosition,
}) => {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Calculate height based on duration (approximate)
  const gapHeight = Math.max(ITEM_SPACING, Math.max(1, (duration / 60) * 20));

  // Ensure valid dimensions
  const svgHeight = Math.max(1, gapHeight);
  const svgWidth = Math.max(1, THREAD_WIDTH);

  return (
    <View style={[styles.ghostGapItem, { height: gapHeight, marginBottom: ITEM_SPACING }]}>
      {/* Dotted Line Section */}
      <View
        style={[
          styles.dottedLineContainer,
          { left: threadPosition - THREAD_WIDTH / 2 },
        ]}
      >
        <Svg height={svgHeight} width={svgWidth}>
          <Line
            x1={svgWidth / 2}
            y1={0}
            x2={svgWidth / 2}
            y2={svgHeight}
            stroke="#F0F0F0"
            strokeWidth={THREAD_WIDTH}
            strokeDasharray="4,4"
          />
        </Svg>
      </View>

      {/* Label */}
      <View style={[styles.ghostLabel, { left: threadPosition + 16 }]}>
        <Text style={styles.ghostLabelText}>
          Free Time ({formatDuration(duration)})
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    position: 'relative',
  },
  threadContainer: {
    position: 'absolute',
    left: THREAD_LEFT_POSITION,
    top: 0,
    bottom: 0,
    width: THREAD_WIDTH,
  },
  threadLine: {
    flex: 1,
    width: THREAD_WIDTH,
    backgroundColor: '#F0F0F0',
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  activeCardWrapper: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  activeCard: {
    width: '100%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  activeCardContent: {
    padding: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTaskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  activeTaskDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  markDoneButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  markDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  futureTaskItem: {
    position: 'relative',
    paddingLeft: 20,
    paddingRight: 20,
  },
  futureTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  timeLabel: {
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  timeLabelText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  taskDot: {
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  taskTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  taskTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  expandedContent: {
    marginTop: 12,
    marginLeft: THREAD_LEFT_POSITION + 16,
    padding: 12,
    backgroundColor: colors.backgroundCard,
    borderRadius: 8,
    overflow: 'hidden',
  },
  expandedDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  expandedTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  ghostGapItem: {
    position: 'relative',
    paddingLeft: 20,
    paddingRight: 20,
  },
  dottedLineContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: THREAD_WIDTH,
  },
  dottedLine: {
    flex: 1,
    width: THREAD_WIDTH,
  },
  ghostLabel: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  ghostLabelText: {
    fontSize: 11,
    color: colors.textSecondary,
    opacity: 0.6,
    fontStyle: 'italic',
  },
});

