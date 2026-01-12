import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, CheckCircle2, Circle, Clock, Target, MoreHorizontal } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';
import { TaskEditModal } from '../src/components/TaskEditModal';

const { width } = Dimensions.get('window');

export default function GoalDetailScreen() {
  const { goalId } = useLocalSearchParams();
  const router = useRouter();
  const { goals, tasks, updateTask } = useApp();
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Safe data retrieval
  const goal = useMemo(() => goals.find(g => g.id === goalId), [goals, goalId]);
  const goalTasks = useMemo(() => tasks.filter(t => t.goalId === goalId), [tasks, goalId]);

  const progress = useMemo(() => {
    const completed = goalTasks.filter(t => t.status === 'completed').length;
    return goalTasks.length > 0 ? (completed / goalTasks.length) * 100 : 0;
  }, [goalTasks]);

  const totalTime = useMemo(() => {
    return goalTasks.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [goalTasks]);

  if (!goal) return null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={28} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
                <MoreHorizontal size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
        >
            {/* Title Section */}
            <View style={styles.titleSection}>
                <View style={styles.tagContainer}>
                    <Target size={12} color={colors.primary} />
                    <Text style={styles.tagText}>MISSION PARAMETERS</Text>
                </View>
                <Text style={styles.pageTitle}>{goal.title}</Text>
                
                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{goalTasks.length} Steps</Text>
                    <View style={styles.dot} />
                    <Text style={styles.metaText}>{Math.round(totalTime / 60)}h {(totalTime % 60)}m Total Focus</Text>
                </View>
            </View>

            {/* Progress Card */}
            <View style={styles.progressCard}>
                <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>Completion Status</Text>
                    <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                </View>
            </View>

            {/* Task List */}
            <View style={styles.taskList}>
                <Text style={styles.sectionHeader}>Execution Steps</Text>
                
                {goalTasks.map((task, index) => (
                    <Animated.View 
                        key={task.id} 
                        entering={FadeInDown.delay(index * 100).springify()}
                        layout={Layout.springify()}
                    >
                        <TouchableOpacity 
                            style={[
                                styles.taskCard, 
                                task.status === 'completed' && styles.taskCardDone
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setSelectedTask(task);
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={styles.checkContainer}>
                                {task.status === 'completed' ? (
                                    <CheckCircle2 size={24} color={colors.primary} fill={colors.primary} />
                                ) : (
                                    <Circle size={24} color="#E5E7EB" strokeWidth={2} />
                                )}
                            </View>

                            <View style={styles.taskContent}>
                                <Text 
                                    style={[
                                        styles.taskTitle, 
                                        task.status === 'completed' && styles.taskTextDone
                                    ]}
                                >
                                    {task.title}
                                </Text>
                                <View style={styles.taskMeta}>
                                    <Clock size={12} color={colors.textSecondary} />
                                    <Text style={styles.taskDuration}>{task.duration} min</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
        </ScrollView>

        {/* Floating Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9}>
            <Text style={styles.primaryBtnText}>START SESSION</Text>
          </TouchableOpacity>
        </View>

        {/* Task Edit Modal (Existing Component) */}
        <TaskEditModal 
          visible={!!selectedTask}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(id: string, updates: any) => {
            updateTask(id, updates);
            setSelectedTask((prev: any) => ({ ...prev, ...updates }));
          }}
        />
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
    paddingHorizontal: 20, 
    paddingVertical: 12 
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  
  titleSection: { marginVertical: 20 },
  tagContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  tagText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: colors.primary, 
    letterSpacing: 1 
  },
  pageTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#1A1A1A', 
    marginBottom: 8,
    lineHeight: 34
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },

  progressCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  progressPercent: { fontSize: 14, fontWeight: '800', color: colors.primary },
  progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },

  taskList: { gap: 16 },
  sectionHeader: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: '#9CA3AF', 
    textTransform: 'uppercase', 
    letterSpacing: 1,
    marginBottom: 8 
  },
  taskCard: { 
    flexDirection: 'row', 
    alignItems: 'center',
    padding: 16, 
    borderRadius: 16, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#F3F4F6', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.03, 
    shadowRadius: 8, 
    elevation: 2 
  },
  taskCardDone: { opacity: 0.6, backgroundColor: '#FAFAFA' },
  checkContainer: { marginRight: 16 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  taskTextDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskDuration: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },

  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 24, 
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  primaryBtn: { 
    backgroundColor: '#1A1A1A', 
    paddingVertical: 18, 
    borderRadius: 24, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  primaryBtnText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '700', 
    letterSpacing: 1 
  },
});