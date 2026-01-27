import React, { useMemo, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Modal, 
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator
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
  RefreshCw,
  FastForward,
  Sparkles
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeIn, Layout, FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';
import { TaskEditModal } from '../src/components/TaskEditModal';

const { width } = Dimensions.get('window');

export default function GoalDetailScreen() {
  const params = useLocalSearchParams();
  const goalId = typeof params.goalId === 'string' ? params.goalId : '';

  const router = useRouter();
  const { goals, tasks, updateTask, deleteGoal, generateDailyPlan, addTasks } = useApp();
  
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // --- STATE ---
  const [devDayOffset, setDevDayOffset] = useState(0); // Dev: Force move forward
  const [viewingDay, setViewingDay] = useState<number>(1); // Currently selected day in UI
  const [isGenerating, setIsGenerating] = useState(false);
  
  const goal = useMemo(() => goals.find(g => g.id === goalId), [goals, goalId]);

  // 1. Calculate "Current Progress Day" (Time + Dev Offset)
  const currentProgressDay = useMemo(() => {
    if (!goal || !goal.startDate) return 1;
    const start = new Date(goal.startDate).getTime();
    const now = Date.now();
    const diffTime = Math.max(0, now - start);
    // Add 1 because if 0ms passed, we are on Day 1
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    return Math.max(1, diffDays) + devDayOffset; 
  }, [goal, devDayOffset]);

  const totalDays = useMemo(() => {
    if (!goal || !goal.targetDate || !goal.startDate) return 30;
    const start = new Date(goal.startDate).getTime();
    const target = new Date(goal.targetDate).getTime();
    const diffTime = Math.abs(target - start);
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [goal]);

  // Sync viewingDay to currentProgressDay on load (or when day advances)
  useEffect(() => {
    setViewingDay(currentProgressDay);
  }, [currentProgressDay]);

  // 2. Filter tasks for the VIEWING DAY
  const tasksForViewingDay = useMemo(() => {
    return tasks
      .filter(t => t.goalId === goalId)
      // For Journey: strict match. For Project: show all (default day 1)
      .filter(t => goal?.type === 'journey' ? (t.dayNumber || 1) === viewingDay : true)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [tasks, goalId, viewingDay, goal?.type]);

  const progress = useMemo(() => {
    const completed = tasksForViewingDay.filter(t => t.status === 'completed').length;
    return tasksForViewingDay.length > 0 ? (completed / tasksForViewingDay.length) * 100 : 0;
  }, [tasksForViewingDay]);

  const totalTime = useMemo(() => {
    return tasksForViewingDay.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [tasksForViewingDay]);

  // 3. AUTO-GENERATE EFFECT (Only for Current Day)
  useEffect(() => {
    const checkAndGenerate = async () => {
      // Logic guards
      if (goal?.type !== 'journey') return;
      if (isGenerating) return;
      if (viewingDay !== currentProgressDay) return; // Only generate if looking at today
      if (tasksForViewingDay.length > 0) return; // Don't regen if tasks exist

      // START GENERATION
      setIsGenerating(true);
      try {
        const result = await generateDailyPlan(
          goal.title,
          currentProgressDay,
          totalDays,
          goal.dailyMinutes || 45
        );

        if (result && result.tasks) {
          const newTasks = result.tasks.map((t: any, idx: number) => ({
            title: t.title,
            description: t.description,
            duration: t.duration,
            dayNumber: currentProgressDay,
            order: idx
          }));

          await addTasks(goal.id, newTasks);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (e) {
        console.error("Auto-generation failed", e);
      } finally {
        setIsGenerating(false);
      }
    };

    checkAndGenerate();
  }, [currentProgressDay, viewingDay, goalId, tasksForViewingDay.length]); 

  if (!goal) return null;

  // --- ACTIONS ---

  const handleDevSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDevDayOffset(prev => prev + 1);
  };

  const handleStartSession = () => {
    if (tasksForViewingDay.length > 0) {
      const nextTask = tasksForViewingDay.find(t => t.status !== 'completed') || tasksForViewingDay[0];
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: '/focus-session',
        params: { taskId: nextTask.id, duration: nextTask.duration.toString() }
      });
    } else {
      Alert.alert("All Clear", "No actionable tasks right now.");
    }
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

  // --- UI RENDERERS ---

  const renderJourneyHeader = () => {
    // Logic: Show all past days up to current day.
    // Limit to showing ~5 past days + current day to keep it cleaner, or scrollable.
    const daysToShow = Array.from({ length: currentProgressDay }).map((_, i) => i + 1);

    return (
      <View style={styles.journeyHeader}>
        <View style={styles.refreshNote}>
          <RefreshCw size={12} color="#059669" />
          <Text style={styles.refreshNoteText}>
            {isGenerating 
              ? "Analyzing trajectory..." 
              : viewingDay === currentProgressDay 
                ? "Come back tomorrow for your next directive." 
                : `Viewing history: Day ${viewingDay}`}
          </Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.calendarStrip}
          // Simple auto-scroll to end effect via content offset could go here
        >
          {daysToShow.map((d) => {
            const isSelected = d === viewingDay;
            
            return (
              <TouchableOpacity 
                key={d} 
                style={[styles.dayPill, isSelected && styles.dayPillActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setViewingDay(d);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>DAY</Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayLabelActive]}>{d}</Text>
              </TouchableOpacity>
            );
          })}
          
          {/* Classic "..." Blur Pill for future */}
          <View style={styles.dayPillBlur}>
            <Text style={styles.dayLabel}>...</Text>
          </View>
        </ScrollView>
        
        <View style={styles.journeyProgress}>
          <Text style={styles.journeyProgressText}>Day {currentProgressDay} of {totalDays}</Text>
          <View style={styles.journeyProgressBarBg}>
              <View style={[styles.journeyProgressBarFill, { width: `${Math.min(100, (currentProgressDay/totalDays)*100)}%` }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
            <MoreHorizontal size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Info */}
          <View style={styles.titleSection}>
            {goal.type === 'journey' ? (
                <View style={[styles.tagContainer, { backgroundColor: '#E0F2FE' }]}>
                    <CalendarIcon size={12} color="#0284C7" />
                    <Text style={[styles.tagText, { color: '#0284C7' }]}>LONG-TERM JOURNEY</Text>
                </View>
            ) : (
                <View style={styles.tagContainer}>
                    <Target size={12} color={colors.primary} />
                    <Text style={styles.tagText}>MISSION PARAMETERS</Text>
                </View>
            )}
            <Text style={styles.pageTitle}>{goal.title}</Text>
          </View>

          {/* Type Specific Header */}
          {goal.type === 'journey' && renderJourneyHeader()}

          {/* Progress (For projects) */}
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

          {/* Tasks Container */}
          <Animated.View 
            key={`day-${viewingDay}`}
            entering={FadeInRight.springify()} 
            exiting={FadeOutLeft.duration(100)}
            style={styles.taskList}
          >
            <Text style={styles.sectionHeader}>
                {goal.type === 'journey' ? `Directives: Day ${viewingDay}` : "Execution Steps"}
            </Text>

            {/* Loading State */}
            {isGenerating && (
                <Animated.View entering={FadeIn} style={styles.generatingState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.generatingText}>Downloading Daily Protocol...</Text>
                </Animated.View>
            )}

            {/* Empty State */}
            {!isGenerating && tasksForViewingDay.length === 0 && (
                <View style={styles.emptyState}>
                    <Sparkles size={24} color={colors.textSecondary} />
                    <Text style={styles.emptyText}>No data for Day {viewingDay}.</Text>
                </View>
            )}

            {/* Task List */}
            {!isGenerating && tasksForViewingDay.map((task, index) => (
                <Animated.View 
                    key={task.id} 
                    entering={FadeInDown.delay(index * 50).springify()}
                >
                    <TouchableOpacity 
                        style={[
                            styles.taskCard, 
                            task.status === 'completed' && styles.taskCardDone
                        ]}
                        onPress={() => setSelectedTask(task)}
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
                            <Text style={[styles.taskTitle, task.status === 'completed' && styles.taskTextDone]}>
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

            {/* DEV BUTTON: Skip Day (Only shown if viewing current day) */}
            {goal.type === 'journey' && !isGenerating && viewingDay === currentProgressDay && (
                <TouchableOpacity 
                    style={styles.devSkipButton} 
                    onPress={handleDevSkip}
                    activeOpacity={0.8}
                >
                    <FastForward size={16} color="#FFF" />
                    <Text style={styles.devSkipText}>DEV: FORCE NEXT DAY</Text>
                </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleStartSession}>
            <Text style={styles.primaryBtnText}>START SESSION</Text>
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

        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.menuOverlay}>
              <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={handleRefine}>
                  <Edit3 size={18} color={colors.text} />
                  <Text style={styles.menuText}>Refine Goal</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                  <Trash2 size={18} color={colors.error} />
                  <Text style={[styles.menuText, { color: colors.error }]}>Abort</Text>
                </TouchableOpacity>
              </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120 },
  
  titleSection: { marginVertical: 20 },
  tagContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, backgroundColor: 'rgba(245, 158, 11, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginBottom: 8, lineHeight: 34 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  progressCard: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: '#F3F4F6' },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  progressPercent: { fontSize: 14, fontWeight: '800', color: colors.primary },
  progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  taskList: { gap: 16 },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  taskCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, marginBottom: 12 },
  taskCardDone: { opacity: 0.6, backgroundColor: '#FAFAFA' },
  checkContainer: { marginRight: 16 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  taskTextDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskDuration: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: 'rgba(255,255,255,0.9)', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  primaryBtn: { backgroundColor: '#1A1A1A', paddingVertical: 18, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  
  // --- Journey Styles (Reverted to Old Style) ---
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
  journeyProgress: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  journeyProgressText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, width: 80 },
  journeyProgressBarBg: { flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3 },
  journeyProgressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  refreshNote: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', gap: 6 },
  refreshNoteText: { fontSize: 11, color: '#059669', fontWeight: '600' },
  
  menuOverlay: { flex: 1, backgroundColor: 'transparent' },
  menuContainer: { position: 'absolute', top: 110, right: 24, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 8, width: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  menuText: { fontSize: 15, fontWeight: '600', color: colors.text },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
  
  // States
  generatingState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  generatingText: { marginTop: 16, color: colors.textSecondary, fontWeight: '600' },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16 },
  emptyText: { marginTop: 8, color: colors.textSecondary },
  
  devSkipButton: { marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: '#EF4444', borderRadius: 12 },
  devSkipText: { color: '#FFF', fontWeight: '800', fontSize: 12 }
});