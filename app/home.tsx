import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

// Components
import AnimatedStreakFlame from '../src/components/AnimatedStreakFlame';
import TaskReactorCircle from '../src/components/TaskReactorCircle';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { BottomNav } from '../src/components/BottomNav'; // Import New Component

// Context & Constants
import { lightColors as colors } from '../src/constants/colors';
import { useApp } from '../src/context/AppContext';

export default function HomeScreen() {
  const router = useRouter();
  const context = useApp();
  
  const goals = context?.goals || [];
  const tasks = context?.tasks || [];

  const reactorGoals = useMemo(() => {
    if (!Array.isArray(goals)) return [];
    
    return goals.map(goal => {
      const goalTasks = Array.isArray(tasks) ? tasks.filter(t => t.goalId === goal.id) : [];
      
      const totalTime = goalTasks.reduce((sum, t) => {
        const duration = (t && typeof t.duration === 'number') ? t.duration : 0;
        return sum + duration;
      }, 0);

      return {
        id: goal.id,
        title: goal.title || 'Untitled Mission',
        color: '#FF4500', 
        totalTime,
        subTasks: goalTasks.map(t => ({
          id: t.id,
          title: t.title || 'Untitled Task',
          duration: (t && typeof t.duration === 'number') ? t.duration : 0,
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

  const handleFlamePress = () => {
    router.push('/leaderboard');
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

              <TouchableOpacity
                style={styles.devResetButton}
                onPress={() => router.replace('/welcome')}
                activeOpacity={0.6}
              >
                <Text style={styles.devResetText}>RESET</Text>
              </TouchableOpacity>
            </View>

            <AnimatedStreakFlame onPress={handleFlamePress} />
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
                    onPress={(g: any) => router.push({ pathname: '/goal-detail', params: { goalId: g.id }})}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          {/* Replaced Navigation */}
          <BottomNav activeTab="Home" />
          
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
  devResetButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  devResetText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  
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