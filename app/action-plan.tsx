import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';
import { SunBackground } from '../src/components/SunBackground';
import { ProgressBar } from '../src/components/ProgressBar';
import { TaskCard } from '../src/components/TaskCard';
import { ReflectionModal } from '../src/components/ReflectionModal';
import { ArrowLeft } from 'lucide-react-native';

export default function ActionPlanScreen() {
  const { tasks, currentGoal, completeTask, rateProductivity } = useApp();
  const router = useRouter();
  const [showReflection, setShowReflection] = useState(false);
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);
  const [completedTaskTitle, setCompletedTaskTitle] = useState('');

  const goalTasks = tasks.filter((task) => task.goalId === currentGoal?.id);
  const activeTasks = goalTasks.filter((task) => !task.completed);
  const completedCount = goalTasks.filter((task) => task.completed).length;
  const totalTasks = goalTasks.length;
  const progress = totalTasks > 0 ? completedCount / totalTasks : 0;

  const handleTaskComplete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setCompletedTaskId(taskId);
      setCompletedTaskTitle(task.title);
      completeTask(taskId);
      setTimeout(() => {
        setShowReflection(true);
      }, 300);
    }
  };

  const handleRating = (rating: number) => {
    if (completedTaskId) {
      rateProductivity(completedTaskId, rating);
      setCompletedTaskId(null);
    }
  };

  const handleCloseReflection = () => {
    setShowReflection(false);
    setCompletedTaskId(null);
  };


  if (!currentGoal) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="dark" />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No goal set</Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/home')}
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>Create a Goal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />
      <SunBackground />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/home')}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Action Plan</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {currentGoal.title}
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={progress}
        total={totalTasks}
        completed={completedCount}
      />

      <FlatList
        data={activeTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TaskCard
            task={item}
            onComplete={() => handleTaskComplete(item.id)}
            index={index}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>🎉 All tasks completed!</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Great job staying productive!
            </Text>
          </View>
        }
      />

      <ReflectionModal
        visible={showReflection}
        taskTitle={completedTaskTitle}
        onRate={handleRating}
        onClose={handleCloseReflection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
  },
  button: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

