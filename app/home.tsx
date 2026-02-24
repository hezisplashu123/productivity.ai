import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Users } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

// Components
import AnimatedStreakFlame from '../src/components/AnimatedStreakFlame';
import TaskReactorCircle, { TaskGoal } from '../src/components/TaskReactorCircle';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { BottomNav } from '../src/components/BottomNav'; 
import { MissionAccomplishedModal } from '../src/components/MissionAccomplishedModal';

// Context & Constants
import { lightColors as colors } from '../src/constants/colors';
import { useApp } from '../src/context/AppContext';

export default function HomeScreen() {
  const router = useRouter();
  const { goals, tasks, archiveGoal, pendingRequestsCount } = useApp();
  
  const [celebrationGoal, setCelebrationGoal] = useState<TaskGoal | null>(null);

  // HELPER: Normalize dates to local midnight to ensure calendar-day calculation
  const getCalendarDayDiff = (startDateStr: Date | string) => {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0); // Reset to local midnight
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to local midnight

    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays + 1);
  };

  const reactorGoals = useMemo(() => {
    if (!Array.isArray(goals)) return [];
    const visibleGoals = goals.filter(g => g.status !== 'archived');

    return visibleGoals.map(goal => {
      const goalTasks = Array.isArray(tasks) ? tasks.filter(t => t.goalId === goal.id) : [];
      const totalTime = goalTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
      const displayTitle = (goal.title || 'Untitled Mission').split(' ').slice(0, 2).join(' ');

      let isFullyComplete = false;
      const tasksCompletedCount = goalTasks.filter(t => t.status === 'completed').length;
      const totalTasksCount = goalTasks.length;
      const allTasksDone = totalTasksCount > 0 && tasksCompletedCount === totalTasksCount;

      if (goal.type === 'journey') {
        if (goal.status === 'completed') {
            isFullyComplete = true;
        } else if (goal.startDate && goal.targetDate) {
            // UPDATED LOGIC HERE: Use calendar day calculation
            const currentDay = getCalendarDayDiff(goal.startDate);
            
            const start = new Date(goal.startDate);
            start.setHours(0, 0, 0, 0);
            
            const target = new Date(goal.targetDate);
            target.setHours(0, 0, 0, 0);
            
            const totalDurationTime = target.getTime() - start.getTime();
            const totalDays = Math.ceil(totalDurationTime / (1000 * 60 * 60 * 24)) + 1;
            
            const isLastDay = currentDay >= totalDays;
            isFullyComplete = isLastDay && allTasksDone;
        }
      } else {
        isFullyComplete = allTasksDone;
      }

      return {
        id: goal.id,
        title: displayTitle,
        color: '#FF4500', 
        totalTime,
        type: goal.type as 'project' | 'journey',
        isFullyComplete: isFullyComplete,
        subTasks: goalTasks.map(t => ({
          id: t.id,
          title: t.title || 'Untitled Task',
          duration: t.duration || 0,
          isCompleted: t?.status === 'completed'
        }))
      };
    });
  }, [goals, tasks]);

  const formatDate = () => {
    try {
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        const dateNum = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return { dayName, dateNum };
    } catch (e) {
        return { dayName: 'TODAY', dateNum: new Date().getDate().toString() };
    }
  };

  const { dayName, dateNum } = formatDate();

  const handleGoalPress = (goal: TaskGoal) => {
    if (goal.isFullyComplete) {
      setCelebrationGoal(goal);
    } else {
      router.push({ pathname: '/goal-detail', params: { goalId: goal.id }});
    }
  };

  const handleArchive = () => {
    if (celebrationGoal) {
      archiveGoal(celebrationGoal.id);
      setCelebrationGoal(null);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ErrorBoundary name="HomeScreen">
        <SafeAreaView style={styles.container} edges={['top']}>
          
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.dateBox}>
                <Text style={styles.dayLabel}>{dayName}</Text>
                <Text style={styles.dateLabel}>{dateNum}</Text>
              </View>
            </View>

            {/* HEADER RIGHT: FRIENDS + FLAME */}
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.socialButton} 
                onPress={() => router.push('/social')}
                activeOpacity={0.7}
              >
                <Users size={22} color={colors.text} />
                {pendingRequestsCount > 0 && (
                  <View style={styles.badge} />
                )}
              </TouchableOpacity>
              <AnimatedStreakFlame onPress={() => router.push('/leaderboard')} />
            </View>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionHeader}>Operational Goals</Text>
            
            {reactorGoals.length === 0 ? (
              <TouchableOpacity 
                style={styles.emptyPrompt}
                onPress={() => router.push('/goal-input')}
                activeOpacity={0.8}
              >
                <View style={styles.plusIcon}>
                  <Plus size={24} color={colors.primary} />
                </View>
                <Text style={styles.emptyText}>Start a new sequence</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.grid}>
                {reactorGoals.map((reactor) => (
                  <TaskReactorCircle
                    key={reactor.id}
                    taskGoal={reactor}
                    onPress={handleGoalPress}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          <BottomNav activeTab="Home" />
          
          {celebrationGoal && (
            <MissionAccomplishedModal
              visible={!!celebrationGoal}
              goalTitle={celebrationGoal.title}
              totalTime={celebrationGoal.totalTime}
              taskCount={celebrationGoal.subTasks.length}
              onArchive={handleArchive}
              onClose={() => setCelebrationGoal(null)}
            />
          )}
          
        </SafeAreaView>
      </ErrorBoundary>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  dateBox: { flexDirection: 'column' },
  dayLabel: { fontSize: 11, fontWeight: '800', color: '#BDBDBD', letterSpacing: 1.5 },
  dateLabel: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginTop: 2 },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFF'
  },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 150 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A1A1A',
    marginTop: 25,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  emptyPrompt: {
    width: '100%',
    height: 140,
    borderRadius: 35,
    backgroundColor: '#FBFBFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderStyle: 'dashed',
  },
  plusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#BDBDBD' },
});