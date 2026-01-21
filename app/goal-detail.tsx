import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Modal, 
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Target, 
  MoreHorizontal, 
  Trash2, 
  Edit3,
  Calendar as CalendarIcon,
  ChevronRight,
  RefreshCw
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';
import { TaskEditModal } from '../src/components/TaskEditModal';
import { Task } from '../src/types'; 

const { width } = Dimensions.get('window');

export default function GoalDetailScreen() {
  // 1. Safe Parameter Handling
  const params = useLocalSearchParams();
  const goalId = typeof params.goalId === 'string' ? params.goalId : '';

  const router = useRouter();
  const { goals, tasks, updateTask, deleteGoal } = useApp();
  
  // State
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // 2. Safe Data Retrieval
  const goal = useMemo(() => goals.find(g => g.id === goalId), [goals, goalId]);
  const goalTasks = useMemo(() => tasks.filter(t => t.goalId === goalId), [tasks, goalId]);

  const progress = useMemo(() => {
    const completed = goalTasks.filter(t => t.status === 'completed').length;
    return goalTasks.length > 0 ? (completed / goalTasks.length) * 100 : 0;
  }, [goalTasks]);

  const totalTime = useMemo(() => {
    return goalTasks.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [goalTasks]);

  // 3. Derived Days Logic (Journey Mode)
  const currentDay = useMemo(() => {
    if (!goal || !goal.startDate) return 1;
    const start = new Date(goal.startDate).getTime();
    const now = Date.now();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return Math.max(1, diffDays);
  }, [goal]);

  const totalDays = useMemo(() => {
    if (!goal || !goal.targetDate || !goal.startDate) return 30;
    const start = new Date(goal.startDate).getTime();
    const target = new Date(goal.targetDate).getTime();
    const diffTime = Math.abs(target - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }, [goal]);

  if (!goal) {
    return (
        <View style={styles.loadingContainer}>
            <Text style={{color: colors.textSecondary}}>Loading Mission...</Text>
        </View>
    );
  }

  // --- Actions ---

  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleRefine = () => {
    setMenuVisible(false);
    router.push({
      pathname: '/goal-input',
      params: { 
        initialText: goal.title, 
        editingGoalId: goal.id 
      }
    });
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    Alert.alert(
      "Abort Mission?",
      "This will permanently delete the mission and all associated tasks.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Abort", 
          style: "destructive", 
          onPress: () => {
            deleteGoal(goal.id);
            router.back();
          }
        }
      ]
    );
  };

  const handleStartSession = () => {
    if (goalTasks.length > 0) {
      const nextTask = goalTasks.find(t => t.status !== 'completed') || goalTasks[0];
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      router.push({
        pathname: '/focus-session',
        params: { 
          taskId: nextTask.id,
          duration: nextTask.duration.toString()
        }
      });
    } else {
      Alert.alert("Mission Complete", "All tasks are already finished! Add more steps to continue.");
    }
  };

  // --- Render Helpers ---

  const renderJourneyHeader = () => (
    <View style={styles.journeyHeader}>
      {/* Daily Refresh Note */}
      <View style={styles.refreshNote}>
        <RefreshCw size={12} color="#059669" />
        <Text style={styles.refreshNoteText}>Tasks refresh daily. Check back tomorrow for your next directive.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarStrip}>
        {Array.from({ length: 7 }).map((_, i) => {
          const dayNum = currentDay + i;
          const isToday = i === 0;
          return (
            <TouchableOpacity 
              key={i} 
              style={[styles.dayPill, isToday && styles.dayPillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>DAY</Text>
              <Text style={[styles.dayNumber, isToday && styles.dayLabelActive]}>{dayNum}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={styles.dayPillBlur}>
            <Text style={styles.dayLabel}>...</Text>
        </View>
      </ScrollView>
      
      <View style={styles.journeyProgress}>
        <Text style={styles.journeyProgressText}>Day {currentDay} of {totalDays}</Text>
        <View style={styles.journeyProgressBarBg}>
            <View style={[styles.journeyProgressBarFill, { width: `${Math.min(100, (currentDay/totalDays)*100)}%` }]} />
        </View>
      </View>
    </View>
  );

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
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={handleMenuPress}
              activeOpacity={0.7}
            >
                <MoreHorizontal size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
        >
            {/* Conditional Rendering based on Goal Type */}
            {goal.type === 'journey' ? (
                <>
                    {/* Journey Title Block */}
                    <View style={styles.titleSection}>
                        <View style={[styles.tagContainer, { backgroundColor: '#E0F2FE' }]}>
                            <CalendarIcon size={12} color="#0284C7" />
                            <Text style={[styles.tagText, { color: '#0284C7' }]}>LONG-TERM JOURNEY</Text>
                        </View>
                        <Text style={styles.pageTitle}>{goal.title}</Text>
                    </View>
                    
                    {/* Calendar Strip */}
                    {renderJourneyHeader()}
                </>
            ) : (
                // Standard Project Title Block
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
            )}

            {/* Progress Card (Only for projects, Journey has day progress) */}
            {goal.type !== 'journey' && (
                <View style={styles.progressCard}>
                    <View style={styles.progressInfo}>
                        <Text style={styles.progressLabel}>Completion Status</Text>
                        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>
                </View>
            )}

            {/* Task List */}
            <View style={styles.taskList}>
                <Text style={styles.sectionHeader}>
                    {goal.type === 'journey' ? `Tasks for Day ${currentDay}` : "Execution Steps"}
                </Text>
                
                {goalTasks.length === 0 && (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{color: colors.textSecondary, textAlign: 'center'}}>
                            No tasks scheduled. Tap "Refine Directive" to generate more.
                        </Text>
                    </View>
                )}

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

                {/* Journey Mode: "Prepare Next Day" Button (Stub) */}
                {goal.type === 'journey' && goalTasks.length > 0 && goalTasks.every(t => t.status === 'completed') && (
                    <TouchableOpacity 
                        style={styles.nextDayBtn} 
                        onPress={() => Alert.alert("Coming Soon", "This would generate the plan for tomorrow based on your progress.")}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.nextDayText}>PREPARE DAY {currentDay + 1}</Text>
                        <ChevronRight size={20} color="#FFF" />
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>

        {/* Floating Action Button - START SESSION */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            activeOpacity={0.9}
            onPress={handleStartSession}
          >
            <Text style={styles.primaryBtnText}>START SESSION</Text>
          </TouchableOpacity>
        </View>

        {/* Task Edit Modal */}
        <TaskEditModal 
          visible={!!selectedTask}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(id: string, updates: any) => {
            updateTask(id, updates);
            setSelectedTask((prev: any) => ({ ...prev, ...updates }));
          }}
        />

        {/* Menu Modal */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={closeMenu}
        >
          <TouchableWithoutFeedback onPress={closeMenu}>
            <View style={styles.menuOverlay}>
              <Animated.View 
                entering={FadeIn.duration(200)}
                style={styles.menuContainer}
              >
                <TouchableOpacity style={styles.menuItem} onPress={handleRefine}>
                  <Edit3 size={18} color={colors.text} />
                  <Text style={styles.menuText}>Refine Directive</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                  <Trash2 size={18} color={colors.error} />
                  <Text style={[styles.menuText, { color: colors.error }]}>Abort Mission</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12,
    zIndex: 10,
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
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
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

  // --- Journey Styles ---
  journeyHeader: { marginBottom: 24 },
  calendarStrip: { flexDirection: 'row', gap: 10, paddingBottom: 16 },
  dayPill: { 
    width: 50, 
    height: 60, 
    borderRadius: 12, 
    backgroundColor: '#F9FAFB', 
    borderWidth: 1, 
    borderColor: '#F3F4F6', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  dayPillActive: { 
    backgroundColor: '#1A1A1A', 
    borderColor: '#1A1A1A' 
  },
  dayPillBlur: { 
    width: 50, 
    height: 60, 
    justifyContent: 'center', 
    alignItems: 'center', 
    opacity: 0.5 
  },
  dayLabel: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: '#9CA3AF', 
    marginBottom: 2 
  },
  dayNumber: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#1A1A1A' 
  },
  dayLabelActive: { 
    color: '#FFFFFF' 
  },
  
  journeyProgress: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  journeyProgressText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: colors.textSecondary, 
    width: 80 
  },
  journeyProgressBarBg: { 
    flex: 1, 
    height: 6, 
    backgroundColor: '#F3F4F6', 
    borderRadius: 3 
  },
  journeyProgressBarFill: { 
    height: '100%', 
    backgroundColor: colors.primary, 
    borderRadius: 3 
  },

  nextDayBtn: { 
    marginTop: 20, 
    backgroundColor: '#059669', 
    padding: 16, 
    borderRadius: 16, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8 
  },
  nextDayText: { 
    color: '#FFF', 
    fontWeight: '800', 
    fontSize: 14, 
    letterSpacing: 1 
  },
  
  refreshNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6
  },
  refreshNoteText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600'
  },

  // --- Menu Styles ---
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    top: 110,
    right: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
});