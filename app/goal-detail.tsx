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
  ActivityIndicator,
  Linking
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Sparkles, 
  Award,
  ArrowRight,
  ExternalLink
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeIn, FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';
import { TaskEditModal } from '../src/components/TaskEditModal';
import { MissionAccomplishedModal } from '../src/components/MissionAccomplishedModal';
import { NotificationService } from '../src/services/notificationService'; 

const { width } = Dimensions.get('window');

export default function GoalDetailScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const goalId = typeof params.goalId === 'string' ? params.goalId : '';

  const router = useRouter();
  const { user, goals, tasks, updateTask, deleteGoal, archiveGoal, generateDailyPlan, addTasks } = useApp();
  
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // --- STATE ---
  const [viewingDay, setViewingDay] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const goal = useMemo(() => goals.find(g => g.id === goalId), [goals, goalId]);

  // HELPER: Normalize dates to local midnight to ensure calendar-day calculation
  const getCalendarDayDiff = (startDateStr: Date | string) => {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0); // Reset to local midnight
    
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to local midnight

    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Day 1 is the start day, so we add 1. 
    return Math.max(1, diffDays + 1);
  };

  // 1. Calculate "Current Progress Day" based on Calendar Midnight
  const currentProgressDay = useMemo(() => {
    if (!goal || !goal.startDate) return 1;
    return getCalendarDayDiff(goal.startDate);
  }, [goal]);

  const totalDays = useMemo(() => {
    if (!goal || !goal.targetDate || !goal.startDate) return 30;
    
    const start = new Date(goal.startDate);
    start.setHours(0, 0, 0, 0);
    
    const target = new Date(goal.targetDate);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - start.getTime();
    // +1 to include the target day itself
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
  }, [goal]);

  useEffect(() => {
    setViewingDay(currentProgressDay);
  }, [currentProgressDay]);

  // 2. Filter tasks
  const tasksForViewingDay = useMemo(() => {
    return tasks
      .filter(t => t.goalId === goalId)
      .filter(t => goal?.type === 'journey' ? (t.dayNumber || 1) === viewingDay : true)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [tasks, goalId, viewingDay, goal?.type]);

  const allGoalTasks = useMemo(() => {
    return tasks.filter(t => t.goalId === goalId);
  }, [tasks, goalId]);

  const totalGoalTime = useMemo(() => {
    return allGoalTasks.reduce((acc, t) => acc + (t.duration || 0), 0);
  }, [allGoalTasks]);

  const progress = useMemo(() => {
    const completed = tasksForViewingDay.filter(t => t.status === 'completed').length;
    return tasksForViewingDay.length > 0 ? (completed / tasksForViewingDay.length) * 100 : 0;
  }, [tasksForViewingDay]);

  // --- LOGIC UPDATES ---
  
  // 1. Is the current day's list finished?
  const isDayComplete = useMemo(() => {
    return tasksForViewingDay.length > 0 && tasksForViewingDay.every(t => t.status === 'completed');
  }, [tasksForViewingDay]);

  // 2. Is the ENTIRE journey finished (Last Day + All Tasks Done)?
  const isJourneyFullyComplete = useMemo(() => {
    if (!goal) return false;
    if (goal.type !== 'journey') return false; 
    
    const isLastDay = currentProgressDay >= totalDays;
    return isLastDay && isDayComplete;
  }, [goal, currentProgressDay, totalDays, isDayComplete]);

  // 3. NOTIFICATION SCHEDULING
  // Check if today's tasks are done to trigger notification for TOMORROW
  useEffect(() => {
    if (goal?.type === 'journey' && viewingDay === currentProgressDay && isDayComplete) {
        // Schedule notification for the NEXT day (currentProgressDay + 1)
        // NotificationService handles the "Tomorrow at 7 AM" logic internally
        const archetype = user?.onboardingData?.focusWindow || 'default';
        NotificationService.scheduleNextDayDirective(currentProgressDay + 1, archetype);
    }
  }, [isDayComplete, goal, viewingDay, currentProgressDay, user]);

  // 4. AUTO-GENERATE EFFECT (Triggers when clock hits midnight and tasksForViewingDay is empty)
  useEffect(() => {
    const checkAndGenerate = async () => {
      if (!goal) return;
      if (goal.type !== 'journey') return;
      if (isGenerating) return;
      if (viewingDay !== currentProgressDay) return;
      
      // CRITICAL: Only generate if NO tasks exist for this new day
      if (tasksForViewingDay.length > 0) return;

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
            order: idx,
            link: t.link // Ensure link is passed
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
  }, [currentProgressDay, viewingDay, goalId, tasksForViewingDay.length, goal]); 

  if (!goal) return null;

  // --- ACTIONS ---

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

  const initiateCompletion = () => {
    setMenuVisible(false);
    setShowCelebration(true);
  };

  const handleFinalizeArchive = () => {
    archiveGoal(goal.id);
    setShowCelebration(false);
    router.back();
  };

  const handleCompleteEarly = () => {
    setMenuVisible(false);
    Alert.alert(
      "Complete Journey Early?",
      "This will mark the entire mission as successful and archive it to your profile.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Complete Now", 
          style: "default", 
          onPress: initiateCompletion 
        }
      ]
    );
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

  const handleOpenLink = (url: string) => {
    Haptics.selectionAsync();
    Linking.openURL(url).catch(err => {
      console.error("Failed to open link:", err);
      Alert.alert("Error", "Could not open this resource.");
    });
  };

  // --- UI RENDERERS ---

  const renderJourneyHeader = () => {
    const daysToShow = Array.from({ length: currentProgressDay }).map((_, i) => i + 1);

    // Determine Status Text
    let statusText = "";
    if (isGenerating) {
        statusText = "Analyzing trajectory...";
    } else if (viewingDay !== currentProgressDay) {
        statusText = `Viewing history: Day ${viewingDay}`;
    } else if (isDayComplete) {
        statusText = "Come back tomorrow for a new directive.";
    } else {
        statusText = "Your daily directive is ready.";
    }

    return (
      <View style={styles.journeyHeader}>
        <View style={[styles.refreshNote, isDayComplete && styles.refreshNoteComplete]}>
          <RefreshCw size={12} color={isDayComplete ? "#059669" : "#059669"} />
          <Text style={[styles.refreshNoteText, isDayComplete && styles.refreshNoteTextComplete]}>
            {statusText}
          </Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.calendarStrip}
        >
          {daysToShow.map((d) => {
            const isSelected = d === viewingDay;
            const isToday = d === currentProgressDay;
            
            return (
              <TouchableOpacity 
                key={d} 
                style={[
                  styles.dayPill, 
                  isSelected && styles.dayPillActive,
                  !isSelected && isToday && styles.dayPillToday 
                ]}
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

          {/* NEW: FINISHED EARLY PROMPT */}
          {goal.type === 'journey' && isDayComplete && !isJourneyFullyComplete && (
            <Animated.View entering={FadeInDown} style={styles.finishedEarlyContainer}>
              <TouchableOpacity 
                style={styles.finishedEarlyButton}
                onPress={handleCompleteEarly}
                activeOpacity={0.8}
              >
                <Award size={20} color="#059669" />
                <Text style={styles.finishedEarlyText}>Finished the whole mission early?</Text>
                <ArrowRight size={16} color="#059669" style={{ opacity: 0.6 }} />
              </TouchableOpacity>
            </Animated.View>
          )}

          {goal.type === 'journey' && renderJourneyHeader()}

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
                            
                            {/* --- ADDED LINK BUTTON IN LIST ITEM --- */}
                            {task.link && (
                              <TouchableOpacity 
                                style={styles.listLinkButton} 
                                onPress={() => handleOpenLink(task.link!.url)}
                                activeOpacity={0.7}
                              >
                                <ExternalLink size={12} color="#0056D2" />
                                <Text style={styles.listLinkText} numberOfLines={1}>
                                  {task.link.label || "Open Resource"}
                                </Text>
                              </TouchableOpacity>
                            )}

                            <View style={styles.taskMeta}>
                                <Clock size={12} color={colors.textSecondary} />
                                <Text style={styles.taskDuration}>{task.duration} min</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            ))}
          </Animated.View>
        </ScrollView>

        {/* --- STICKY FOOTER with SAFE AREA --- */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {isJourneyFullyComplete ? (
            // GOLD BUTTON: Only if Journey is truly complete (Last Day + All Tasks)
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: '#F59E0B', shadowColor: '#F59E0B' }]} 
              onPress={initiateCompletion}
            >
              <Award size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>MISSION ACCOMPLISHED</Text>
            </TouchableOpacity>
          ) : isDayComplete && goal.type === 'journey' ? (
            // GREY BUTTON: Daily tasks done, but not final day
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: '#F3F4F6', shadowOpacity: 0 }]} 
              activeOpacity={1}
            >
              <CheckCircle2 size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
              <Text style={[styles.primaryBtnText, { color: '#9CA3AF' }]}>DAY COMPLETE</Text>
            </TouchableOpacity>
          ) : (
            // STANDARD BUTTON
            <TouchableOpacity style={styles.primaryBtn} onPress={handleStartSession}>
              <Text style={styles.primaryBtnText}>START SESSION</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* --- MODALS --- */}
        <TaskEditModal 
          visible={!!selectedTask}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(id: string, updates: any) => {
            updateTask(id, updates);
            setSelectedTask((prev: any) => ({ ...prev, ...updates }));
          }}
        />

        <MissionAccomplishedModal
          visible={showCelebration}
          goalTitle={goal.title}
          totalTime={totalGoalTime}
          taskCount={allGoalTasks.length}
          onArchive={handleFinalizeArchive}
          onClose={() => setShowCelebration(false)}
        />

        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.menuOverlay}>
              <View style={styles.menuContainer}>
                {goal.type === 'journey' && (
                  <>
                    <TouchableOpacity style={styles.menuItem} onPress={handleCompleteEarly}>
                      <Award size={18} color="#10B981" />
                      <Text style={[styles.menuText, { color: '#10B981' }]}>Mark Complete Early</Text>
                    </TouchableOpacity>
                    <View style={styles.menuDivider} />
                  </>
                )}
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
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 }, 
  
  titleSection: { marginVertical: 20 },
  tagContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, backgroundColor: 'rgba(245, 158, 11, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginBottom: 8, lineHeight: 34 },
  
  progressCard: { backgroundColor: '#F9FAFB', borderRadius: 20, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: '#F3F4F6' },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  progressPercent: { fontSize: 14, fontWeight: '800', color: colors.primary },
  progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  taskList: { gap: 16 },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  
  // Task Card & List Link Button Styles
  taskCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, marginBottom: 12 },
  taskCardDone: { opacity: 0.6, backgroundColor: '#FAFAFA' },
  checkContainer: { marginRight: 16, marginTop: 2 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  taskTextDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  taskDuration: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  
  listLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF', // Light Blue background for link
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  listLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0056D2', // Strong Blue
    maxWidth: 200,
  },

  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 24, 
    backgroundColor: 'rgba(255,255,255,0.95)', 
    borderTopWidth: 1, 
    borderTopColor: '#F3F4F6' 
  },
  primaryBtn: { backgroundColor: '#1A1A1A', paddingVertical: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  
  // Journey Styles
  journeyHeader: { marginBottom: 24 },
  calendarStrip: { flexDirection: 'row', gap: 10, paddingBottom: 16 },
  dayPill: { width: 50, height: 60, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  dayPillActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  dayPillToday: { borderColor: colors.primary, borderWidth: 2 },
  dayPillBlur: { width: 50, height: 60, justifyContent: 'center', alignItems: 'center', opacity: 0.5 },
  dayLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginBottom: 2 },
  dayNumber: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  dayLabelActive: { color: '#FFFFFF' },
  journeyProgress: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  journeyProgressText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, width: 80 },
  journeyProgressBarBg: { flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3 },
  journeyProgressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  
  refreshNote: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', gap: 6 },
  refreshNoteComplete: { backgroundColor: '#F0FDF4' }, 
  refreshNoteText: { fontSize: 11, color: '#059669', fontWeight: '600' },
  refreshNoteTextComplete: { color: '#15803D' }, 
  
  menuOverlay: { flex: 1, backgroundColor: 'transparent' },
  menuContainer: { position: 'absolute', top: 110, right: 24, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 8, width: 220, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  menuText: { fontSize: 15, fontWeight: '600', color: colors.text },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },
  
  generatingState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  generatingText: { marginTop: 16, color: colors.textSecondary, fontWeight: '600' },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16 },
  emptyText: { marginTop: 8, color: colors.textSecondary },

  finishedEarlyContainer: { marginBottom: 16 },
  finishedEarlyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 12, borderRadius: 12, gap: 10, borderWidth: 1, borderColor: '#D1FAE5' },
  finishedEarlyText: { color: '#059669', fontSize: 13, fontWeight: '700', flex: 1 }
});