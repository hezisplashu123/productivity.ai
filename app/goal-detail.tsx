import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, CheckCircle2, Circle, Clock } from 'lucide-react-native';
import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';
import { TaskEditModal } from '../src/components/TaskEditModal';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';

export default function GoalDetailScreen() {
  const { goalId } = useLocalSearchParams();
  const router = useRouter();
  const { goals, tasks, updateTask } = useApp();
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const goal = useMemo(() => goals.find(g => g.id === goalId), [goals, goalId]);
  const goalTasks = useMemo(() => tasks.filter(t => t.goalId === goalId), [tasks, goalId]);

  const progress = useMemo(() => {
    const completed = goalTasks.filter(t => t.status === 'completed').length;
    return goalTasks.length > 0 ? (completed / goalTasks.length) * 100 : 0;
  }, [goalTasks]);

  if (!goal) return null;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerLabel}>MISSION PARAMETERS</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{goal.title}</Text>
          </View>
        </View>

        {/* Progress Summary */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
             <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
             <Text style={styles.progressLabel}>OBJECTIVE PROGRESS</Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Task Sequence</Text>
          
          {goalTasks.map((task, index) => (
            <Animated.View key={task.id} entering={FadeInDown.delay(index * 100)}>
              <TouchableOpacity 
                style={[styles.taskCard, task.status === 'completed' && styles.taskCardDone]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSelectedTask(task);
                }}
              >
                <View style={styles.checkIcon}>
                  {task.status === 'completed' ? (
                    <CheckCircle2 size={24} color={colors.success} fill={`${colors.success}15`} />
                  ) : (
                    <Circle size={24} color="#E5E7EB" strokeWidth={2} />
                  )}
                </View>

                <View style={styles.taskBody}>
                  <Text style={[styles.taskTitle, task.status === 'completed' && styles.taskTextDone]}>
                    {task.title}
                  </Text>
                  <View style={styles.taskMeta}>
                    <Clock size={12} color="#9CA3AF" />
                    <Text style={styles.taskMetaText}>{task.duration}m Focus</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9}>
            <Text style={styles.primaryBtnText}>START FOCUS SESSION</Text>
          </TouchableOpacity>
        </View>

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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitleBox: { flex: 1, marginLeft: 4 },
  headerLabel: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1.5 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  progressSection: { padding: 24, backgroundColor: '#F9FAFB', margin: 24, borderRadius: 28, borderWidth: 1, borderColor: '#F3F4F6' },
  progressHeader: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  progressValue: { fontSize: 48, fontWeight: '800', color: '#1A1A1A', marginRight: 8 },
  progressLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 },
  progressTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 150 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 20 },
  taskCard: { flexDirection: 'row', padding: 20, borderRadius: 24, backgroundColor: '#FFFFFF', marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  taskCardDone: { opacity: 0.5, backgroundColor: '#F9FAFB' },
  checkIcon: { marginRight: 16, paddingTop: 2 },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  taskTextDone: { textDecorationLine: 'line-through' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskMetaText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: 'rgba(255,255,255,0.9)' },
  primaryBtn: { backgroundColor: '#1A1A1A', paddingVertical: 20, borderRadius: 24, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
});