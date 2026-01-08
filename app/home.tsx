import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Menu, Home, Brain, User } from 'lucide-react-native';
import { AnimatedStreakFlame } from '../src/components/AnimatedStreakFlame';
import { TaskReactorCircle, TaskGoal } from '../src/components/TaskReactorCircle';
import { TaskDetailModal } from '../src/components/TaskDetailModal';
import { useTaskGenerator } from '../src/hooks/useTaskGenerator';
import { lightColors as colors } from '../src/constants/colors';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Home');
  const [taskGoals, setTaskGoals] = useState<TaskGoal[]>([]);
  const [selectedTaskGoal, setSelectedTaskGoal] = useState<TaskGoal | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGoalIds, setNewGoalIds] = useState<Set<string>>(new Set());
  
  const { createGoal } = useTaskGenerator();

  const handleFlamePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleMenuPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Open menu/drawer
  }, []);

  const handleAITasksPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/goal-input');
  }, [router]);

  const handleTaskReactorPress = useCallback((taskGoal: TaskGoal) => {
    setSelectedTaskGoal(taskGoal);
    setModalVisible(true);
  }, []);

  const handleToggleSubTask = useCallback((goalId: string, subTaskId: string) => {
    setTaskGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === goalId) {
          return {
            ...goal,
            subTasks: goal.subTasks.map((st) =>
              st.id === subTaskId ? { ...st, isCompleted: !st.isCompleted } : st
            ),
          };
        }
        return goal;
      })
    );
  }, []);

  // Format date
  const formatDate = () => {
    const today = new Date();
    const day = today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const month = today.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const date = today.getDate();
    return `${day}, ${month} ${date}`;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: '#FFFFFF' }]}
      edges={['top', 'bottom']}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        {/* Left Side: Menu Icon + Date */}
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleMenuPress} style={styles.headerButton}>
            <Menu size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerDate}>{formatDate()}</Text>
        </View>
        
        {/* Right Side: Flame */}
        <View style={styles.headerButton}>
          <AnimatedStreakFlame onPress={handleFlamePress} />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Task Reactors</Text>
          
          {/* Task Reactor Grid */}
          {taskGoals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No tasks yet. Tap the AI button to create one!
              </Text>
            </View>
          ) : (
            <View style={styles.taskGrid}>
              {taskGoals.map((goal) => (
                <TaskReactorCircle
                  key={goal.id}
                  taskGoal={goal}
                  onPress={handleTaskReactorPress}
                  isNew={newGoalIds.has(goal.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navButton, activeTab === 'Home' && styles.navButtonActive]}
          onPress={() => {
            setActiveTab('Home');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Home
            size={24}
            color={activeTab === 'Home' ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButtonCenter}
          onPress={handleAITasksPress}
        >
          <Brain size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === 'Placeholder' && styles.navButtonActive]}
          onPress={() => {
            setActiveTab('Placeholder');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <User
            size={24}
            color={activeTab === 'Placeholder' ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Task Detail Modal */}
      {selectedTaskGoal && (
        <TaskDetailModal
          visible={modalVisible}
          taskGoal={selectedTaskGoal}
          onClose={() => setModalVisible(false)}
          onToggleSubTask={handleToggleSubTask}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // Space between menu icon and date
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  contentContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: -0.5,
  },
  taskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  navButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  navButtonActive: {
    backgroundColor: colors.backgroundCard,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  navButtonCenter: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});