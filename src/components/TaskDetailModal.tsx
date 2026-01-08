import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { X, Play, CheckCircle2, Circle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { TaskGoal } from './TaskReactorCircle';
import { lightColors as colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface TaskDetailModalProps {
  visible: boolean;
  taskGoal: TaskGoal | null;
  onClose: () => void;
  onStartTask?: (subTaskId: string, duration: number) => void;
  onToggleSubTask?: (goalId: string, subTaskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  taskGoal,
  onClose,
  onStartTask,
  onToggleSubTask,
}) => {
  const [localGoal, setLocalGoal] = useState<TaskGoal | null>(taskGoal);

  // Sync local state when taskGoal prop changes
  useEffect(() => {
    setLocalGoal(taskGoal);
  }, [taskGoal]);
  const [showContent, setShowContent] = useState(false);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && taskGoal) {
      setShowContent(true);
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0, { duration: 200 }, () => {
        'worklet';
        if (!visible) {
          setShowContent(false);
        }
      });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, taskGoal]);

  const modalStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value * 0.8,
    };
  });

  const handlePlay = (subTaskId: string, duration: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStartTask?.(subTaskId, duration);
    onClose();
  };

  const handleToggleSubTask = (subTaskId: string) => {
    if (!localGoal) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Update local state immediately for UI responsiveness
    setLocalGoal({
      ...localGoal,
      subTasks: localGoal.subTasks.map((st) =>
        st.id === subTaskId ? { ...st, isCompleted: !st.isCompleted } : st
      ),
    });

    // Notify parent to update global state
    onToggleSubTask?.(localGoal.id, subTaskId);
  };

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const totalDuration = localGoal?.subTasks.reduce((sum, st) => sum + st.duration, 0) || 0;
  const completedCount = localGoal?.subTasks.filter((st) => st.isCompleted).length || 0;
  const totalCount = localGoal?.subTasks.length || 0;

  if (!localGoal || !showContent) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View style={[styles.modalContainer, modalStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View
                style={[
                  styles.colorIndicator,
                  { backgroundColor: localGoal.color },
                ]}
              />
              <View style={styles.headerText}>
                <Text style={styles.goalTitle}>{localGoal.title}</Text>
                <Text style={styles.goalMeta}>
                  {completedCount}/{totalCount} tasks • {formatTime(totalDuration)} total
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Sub-tasks list */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {localGoal.subTasks.map((subTask, index) => (
              <TouchableOpacity
                key={subTask.id}
                style={styles.subTaskRow}
                onPress={() => handleToggleSubTask(subTask.id)}
                activeOpacity={0.7}
              >
                <View style={styles.subTaskContent}>
                  <View style={styles.checkboxContainer}>
                    {subTask.isCompleted ? (
                      <CheckCircle2
                        size={20}
                        color={localGoal.color}
                        fill={localGoal.color}
                      />
                    ) : (
                      <Circle size={20} color={colors.textSecondary} strokeWidth={2} />
                    )}
                  </View>
                  <View style={styles.subTaskText}>
                    <Text
                      style={[
                        styles.subTaskTitle,
                        subTask.isCompleted && styles.subTaskCompleted,
                      ]}
                    >
                      {subTask.title}
                    </Text>
                    <Text style={styles.subTaskDuration}>
                      {formatTime(subTask.duration)}
                    </Text>
                  </View>
                </View>

                {!subTask.isCompleted && (
                  <TouchableOpacity
                    style={[styles.playButton, { backgroundColor: localGoal.color }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handlePlay(subTask.id, subTask.duration);
                    }}
                  >
                    <Play size={16} color="#000000" fill="#000000" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.75,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  colorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  goalMeta: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 12,
  },
  subTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subTaskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  subTaskText: {
    flex: 1,
  },
  subTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  subTaskCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  subTaskDuration: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

