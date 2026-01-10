import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Home as HomeIcon, Brain, User, Plus } from 'lucide-react-native';
import { AnimatedStreakFlame } from '../src/components/AnimatedStreakFlame';
import { TaskReactorCircle } from '../src/components/TaskReactorCircle';
import { lightColors as colors } from '../src/constants/colors';
import { useApp } from '../src/context/AppContext';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { goals, tasks } = useApp();
  const [activeTab, setActiveTab] = useState('Home');

  const reactorGoals = useMemo(() => {
    return goals.map(goal => {
      const goalTasks = tasks.filter(t => t.goalId === goal.id);
      return {
        id: goal.id,
        title: goal.title,
        subTasks: goalTasks.map(t => ({
          id: t.id,
          isCompleted: t.status === 'completed'
        }))
      };
    });
  }, [goals, tasks]);

  const formatDate = () => {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const dateNum = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { dayName, dateNum };
  };

  const { dayName, dateNum } = formatDate();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={['top']}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dateBox}>
            <Text style={styles.dayLabel}>{dayName}</Text>
            <Text style={styles.dateLabel}>{dateNum}</Text>
          </View>
          <AnimatedStreakFlame onPress={() => {}} />
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

        {/* Floating White Pill Navigation */}
        <View style={styles.navContainer}>
          <View style={styles.pill}>
            <TouchableOpacity style={styles.pillItem} onPress={() => setActiveTab('Home')}>
              <HomeIcon size={22} color={activeTab === 'Home' ? colors.primary : '#D1D1D1'} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.pillCenter} 
              onPress={() => router.push('/goal-input')}
            >
              <Brain size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.pillItem} onPress={() => setActiveTab('Profile')}>
              <User size={22} color={activeTab === 'Profile' ? colors.primary : '#D1D1D1'} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  dateBox: { flexDirection: 'column' },
  dayLabel: { fontSize: 11, fontWeight: '800', color: '#BDBDBD', letterSpacing: 1.5 },
  dateLabel: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginTop: 2 },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 150 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
  },
  
  emptyPrompt: {
    width: '100%',
    height: 140,
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
  emptyText: { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },

  navContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  pill: {
    width: width * 0.6,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  pillItem: { flex: 1, alignItems: 'center' },
  pillCenter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
});