import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { CheckCircle2, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react-native';
import { Task } from '../types';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onPress?: () => void;
  index: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onPress,
  index,
}) => {
  const [expanded, setExpanded] = useState(false);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationX > 0) {
        translateX.value = Math.min(e.translationX, 100);
      }
    })
    .onEnd((e) => {
      if (e.translationX > 50) {
        translateX.value = withSpring(100, {}, () => {
          runOnJS(onComplete)();
        });
        opacity.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0.8, { duration: 200 });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const checkmarkStyle = useAnimatedStyle(() => {
    return {
      opacity: translateX.value / 100,
      transform: [{ scale: translateX.value / 100 }],
    };
  });

  const handleOpenLink = () => {
    if (task.link?.url) {
      Haptics.selectionAsync();
      Linking.openURL(task.link.url);
    }
  };

  if (task.completed) {
    return null;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: index * 50 }}
        >
          <TouchableOpacity
            style={[styles.card, { 
              backgroundColor: colors.backgroundCard,
              borderColor: colors.border,
              shadowColor: colors.primary,
            }]}
            onPress={() => {
              setExpanded(!expanded);
              onPress?.();
            }}
            activeOpacity={0.8}
          >
            <View style={styles.content}>
              <View style={styles.mainContent}>
                <View style={styles.textContainer}>
                  <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>
                  
                  {/* Task Description */}
                  {task.description && (
                    <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={expanded ? undefined : 2}>
                      {task.description}
                    </Text>
                  )}

                  {/* LINK BUTTON */}
                  {task.link && (
                    <TouchableOpacity 
                      style={styles.linkButton} 
                      onPress={handleOpenLink}
                      activeOpacity={0.7}
                    >
                      <ExternalLink size={14} color="#0056D2" />
                      <Text style={styles.linkText} numberOfLines={1}>
                        {task.link.label || "Open Resource"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.badges}>
                  <View style={[styles.timeBadge, { backgroundColor: colors.glow }]}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={[styles.timeText, { color: colors.textSecondary }]}>{task.duration || task.timeBudget} mins</Text>
                  </View>
                </View>
              </View>

              {expanded && task.subTasks && task.subTasks.length > 0 && (
                <View style={[styles.subTasksContainer, { borderTopColor: colors.border }]}>
                  {task.subTasks.map((subTask) => (
                    <View key={subTask.id} style={styles.subTask}>
                      <View
                        style={[
                          styles.subTaskCheckbox,
                          { borderColor: colors.borderLight },
                          subTask.completed && [styles.subTaskCheckboxCompleted, { 
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          }],
                        ]}
                      />
                      <Text
                        style={[
                          styles.subTaskText,
                          { color: colors.textSecondary },
                          subTask.completed && [styles.subTaskTextCompleted, { color: colors.primary }],
                        ]}
                      >
                        {subTask.title}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={() => setExpanded(!expanded)}
                  style={styles.expandButton}
                >
                  {expanded ? (
                    <ChevronUp size={20} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <Animated.View style={[styles.checkmarkContainer, checkmarkStyle]}>
              <CheckCircle2 size={32} color={colors.primary} />
              <Text style={[styles.swipeText, { color: colors.primary }]}>Swipe to complete</Text>
            </Animated.View>
          </TouchableOpacity>
        </MotiView>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 6,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF', // Light Blue
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0056D2', // Strong Blue
    maxWidth: 150,
  },
  badges: {
    alignItems: 'flex-end',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  subTasksContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  subTask: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subTaskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
  },
  subTaskCheckboxCompleted: {
  },
  subTaskText: {
    fontSize: 14,
    flex: 1,
  },
  subTaskTextCompleted: {
    textDecorationLine: 'line-through',
  },
  footer: {
    marginTop: 12,
    alignItems: 'center',
  },
  expandButton: {
    padding: 4,
  },
  checkmarkContainer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -16 }],
    alignItems: 'center',
    zIndex: 0,
  },
  swipeText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
});