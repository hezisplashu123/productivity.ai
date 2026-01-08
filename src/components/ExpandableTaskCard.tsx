import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Layout,
} from 'react-native-reanimated';
import { Task, SubTask } from '../types';
import { lightColors as colors } from '../constants/colors';
import { ProgressRing } from './ProgressRing';

interface ExpandableTaskCardProps {
  task: Task;
  onSubTaskToggle: (taskId: string, subTaskId: string) => void;
}

export const ExpandableTaskCard: React.FC<ExpandableTaskCardProps> = ({
  task,
  onSubTaskToggle,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const opacity = useSharedValue(0);

  const subTasks = task.subTasks || [];
  const completedSubTasks = subTasks.filter((st) => st.completed).length;
  const totalSubTasks = subTasks.length || 1;
  const progress = totalSubTasks > 0 ? completedSubTasks / totalSubTasks : 0;

  React.useEffect(() => {
    if (expanded) {
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [expanded]);

  const expandedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const formatSubTaskDuration = (minutes?: number) => {
    if (!minutes) return '';
    return ` (${formatDuration(minutes)})`;
  };

  return (
    <Animated.View
      layout={Layout.springify()}
      style={[
        styles.card,
        {
          backgroundColor: '#FFFFFF',
          shadowColor: '#000000',
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setExpanded(!expanded)}
        style={styles.cardContent}
      >
        {/* Collapsed State */}
        <View style={styles.collapsedContent}>
          <View style={styles.leftSection}>
            <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>
              {task.title}
            </Text>
          </View>
          <View style={styles.rightSection}>
            <Text style={[styles.duration, { color: colors.textSecondary }]}>
              {formatDuration(task.duration)}
            </Text>
            {totalSubTasks > 0 && (
              <View style={styles.progressContainer}>
                <ProgressRing
                  progress={progress}
                  size={28}
                  strokeWidth={2.5}
                  animated={true}
                  showText={false}
                />
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                  {completedSubTasks}/{totalSubTasks}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Expanded State */}
        {expanded && subTasks.length > 0 && (
          <Animated.View
            layout={Layout.springify().damping(15).stiffness(100)}
            style={[styles.expandedContent, expandedStyle]}
          >
            <View style={styles.subTasksList}>
              {subTasks.map((subTask: SubTask, index: number) => (
                <TouchableOpacity
                  key={subTask.id}
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation();
                    onSubTaskToggle(task.id, subTask.id);
                  }}
                  style={styles.subTaskRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: subTask.completed ? colors.primary : colors.border,
                        backgroundColor: subTask.completed ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {subTask.completed && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.subTaskText,
                      { color: colors.textSecondary },
                      subTask.completed && styles.subTaskTextCompleted,
                    ]}
                  >
                    {subTask.title}
                    {formatSubTaskDuration(subTask.duration)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 16,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    width: '100%',
  },
  collapsedContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
    marginRight: 16,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  duration: {
    fontSize: 14,
    fontWeight: '500',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subTasksList: {
    gap: 12,
  },
  subTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subTaskText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
  },
  subTaskTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

