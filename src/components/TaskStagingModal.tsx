import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Dimensions, 
  ActivityIndicator, 
  KeyboardAvoidingView,
  Platform,
  Linking
} from 'react-native';
import Animated, { ZoomIn, FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Play, X, ChevronLeft, Minus, Plus, Info, Edit3, Sparkles, Send, Map, Target, ArrowRight, Check, Zap, Link as LinkIcon } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';

const { height, width } = Dimensions.get('window');

export interface StagingTask {
  id: string;
  title: string;
  duration: number;
  description?: string;
  link?: { url: string; label: string }; // Added link support
}

interface TaskStagingModalProps {
  visible: boolean;
  goalTitle: string;
  generatedTasks: StagingTask[];
  goalType: 'project' | 'journey';
  onConfirm: (tasks: StagingTask[], title: string) => void;
  onRefine: (feedback: string) => Promise<void>;
  onToggleMode: () => void;
  onClose: () => void;
}

export const TaskStagingModal = ({ 
  visible, 
  goalTitle, 
  generatedTasks, 
  goalType,
  onConfirm, 
  onRefine, 
  onToggleMode,
  onClose 
}: TaskStagingModalProps) => {
  const { user } = useApp();
  
  const [tasks, setTasks] = useState<StagingTask[]>([]);
  const [editableTitle, setEditableTitle] = useState(goalTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTask, setEditingTask] = useState<StagingTask | null>(null);
  const [refineFeedback, setRefineFeedback] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);

  useEffect(() => {
    if (visible) {
      setEditableTitle(goalTitle);
      setTasks(generatedTasks || []);
      setEditingTask(null);
      setRefineFeedback('');
      setIsRefining(false);
      setShowSwitchConfirm(false);
    }
  }, [visible, goalTitle, generatedTasks]);

  // ... (switchContext logic remains the same) ...
  const switchContext = useMemo(() => {
    const identity = user?.onboardingData?.identity || 'professional';
    const isSwitchingToJourney = goalType === 'project'; 

    // Analogies based on persona
    const analogies: Record<string, { project: string, journey: string }> = {
      student: {
        project: "Like finishing one homework assignment.",
        journey: "Like passing an entire semester class."
      },
      professional: {
        project: "Like prepping for one meeting.",
        journey: "Like managing a Q4 project roadmap."
      },
      entrepreneur: {
        project: "Like closing one sale.",
        journey: "Like scaling to $10k MRR."
      },
      maker: {
        project: "Like coding one feature.",
        journey: "Like building and shipping the MVP."
      },
      personal: {
        project: "Like cleaning the kitchen.",
        journey: "Like training for a marathon."
      }
    };

    const analogy = analogies[identity] || analogies['professional'];

    if (isSwitchingToJourney) {
      return {
        title: "Switch to Journey Mode?",
        subtitle: "Multi-Day Commitment",
        bestFor: "Goals that take days or weeks to achieve.",
        features: [
          "Plan adapts dynamically every morning.",
          "Tracks long-term progress & streaks.",
          "Manages daily time limits."
        ],
        analogy: analogy.journey,
        btnText: "Confirm: Switch to Journey",
        icon: Map,
        color: '#059669', // Green
        bgColor: '#ECFDF5'
      };
    } else {
      return {
        title: "Switch to Project Mode?",
        subtitle: "Single Session Sprint",
        bestFor: "Tasks you want to finish right now.",
        features: [
          "One-off execution list.",
          "Optimized for deep work sessions.",
          "Disappears once marked complete."
        ],
        analogy: analogy.project,
        btnText: "Confirm: Switch to Project",
        icon: Target,
        color: colors.primary, // Orange
        bgColor: '#FFF7ED'
      };
    }
  }, [user, goalType]);

  const handleUpdateDuration = (id: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, duration: Math.max(5, t.duration + delta) } : t));
  };

  const handleInitialize = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(tasks, editableTitle);
  };

  const handleAiRefine = async () => {
    if (!refineFeedback.trim()) return;
    setIsRefining(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onRefine(`Regarding task "${editingTask?.title}": ${refineFeedback}`);
      setEditingTask(null);
      setRefineFeedback('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleModeSwitchPress = () => {
    Haptics.selectionAsync();
    setShowSwitchConfirm(true);
  };

  const confirmModeSwitch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowSwitchConfirm(false);
    onToggleMode();
  };

  const openLink = async (url: string) => {
    Haptics.selectionAsync();
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error("Failed to open URL:", url);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(400)} style={styles.container}>
          
          {/* --- DETAILED POPUP OVERLAY --- */}
          {showSwitchConfirm && (
            <View style={styles.popupOverlay}>
              <Animated.View entering={ZoomIn.duration(200)} style={styles.popupCard}>
                <TouchableOpacity style={styles.popupClose} onPress={() => setShowSwitchConfirm(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                
                {/* Header Icon */}
                <View style={[styles.popupIconCircle, { backgroundColor: switchContext.bgColor }]}>
                  <switchContext.icon size={32} color={switchContext.color} />
                </View>
                
                <Text style={styles.popupTitle}>{switchContext.title}</Text>
                <Text style={[styles.popupSubtitle, { color: switchContext.color }]}>{switchContext.subtitle}</Text>
                
                {/* Details Box */}
                <View style={styles.detailsBox}>
                  <Text style={styles.detailHeader}>WHAT THIS CHANGES:</Text>
                  
                  {switchContext.features.map((feat, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Check size={14} color={switchContext.color} style={{ marginTop: 2 }} />
                      <Text style={styles.featureText}>{feat}</Text>
                    </View>
                  ))}

                  <View style={styles.divider} />
                  
                  <View style={styles.analogyRow}>
                    <Info size={14} color={colors.textSecondary} />
                    <Text style={styles.analogyText}>{switchContext.analogy}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.confirmSwitchBtn, { backgroundColor: switchContext.color }]} 
                  onPress={confirmModeSwitch}
                >
                  <Text style={styles.confirmSwitchText}>{switchContext.btnText}</Text>
                  <ArrowRight size={18} color="#FFF" />
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}

          {editingTask ? (
            // --- EDIT TASK VIEW ---
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => setEditingTask(null)} style={styles.backBtn}>
                <ChevronLeft size={20} color={colors.primary} />
                <Text style={styles.backText}>Back to mission</Text>
              </TouchableOpacity>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.editTitle}>{editingTask.title}</Text>
                <View style={styles.descBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                    <Info size={14} color={colors.primary} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>STRATEGY BRIEF</Text>
                  </View>
                  <Text style={styles.descText}>{editingTask.description}</Text>
                  
                  {/* --- NEW LINK RENDERER --- */}
                  {editingTask.link && (
                    <TouchableOpacity 
                      style={styles.linkButton} 
                      onPress={() => openLink(editingTask.link!.url)}
                      activeOpacity={0.8}
                    >
                      <LinkIcon size={14} color={colors.primary} />
                      <Text style={styles.linkText} numberOfLines={1}>
                        {editingTask.link.label}
                      </Text>
                      <ArrowRight size={14} color={colors.primary} style={{ opacity: 0.6 }} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.refineSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                    <Sparkles size={14} color={colors.primary} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>CAN'T DO THIS?</Text>
                  </View>
                  <View style={styles.refineInputRow}>
                    <TextInput
                      style={styles.refineInput}
                      placeholder="Explain the constraint (e.g., 'No budget')"
                      placeholderTextColor={colors.textLight}
                      value={refineFeedback}
                      onChangeText={setRefineFeedback}
                      multiline
                    />
                    <TouchableOpacity 
                      style={[styles.refineBtn, !refineFeedback.trim() && styles.refineBtnDisabled]}
                      onPress={handleAiRefine}
                      disabled={!refineFeedback.trim() || isRefining}
                    >
                      {isRefining ? <ActivityIndicator color="#FFF" size="small" /> : <Send size={16} color="#FFF" />}
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.editorSection}>
                  <Text style={styles.sectionLabel}>FOCUS DURATION</Text>
                  <View style={styles.stepper}>
                    <TouchableOpacity onPress={() => handleUpdateDuration(editingTask.id, -5)} style={styles.stepBtn}>
                      <Minus color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.timeValueBox}>
                      <Text style={styles.durVal}>{tasks.find(t => t.id === editingTask.id)?.duration}</Text>
                      <Text style={styles.minLab}>MINS</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleUpdateDuration(editingTask.id, 5)} style={styles.stepBtn}>
                      <Plus color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
              <TouchableOpacity style={styles.saveBtn} onPress={() => setEditingTask(null)}>
                <Text style={styles.saveText}>Save Parameters</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            // --- MAIN LIST VIEW ---
            <View style={{ flex: 1 }}>
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topLab}>MISSION STAGING</Text>
                  <TouchableOpacity onPress={() => setIsEditingTitle(true)} style={styles.titleRow}>
                    {isEditingTitle ? (
                      <TextInput 
                        value={editableTitle} 
                        onChangeText={setEditableTitle} 
                        autoFocus 
                        onBlur={() => setIsEditingTitle(false)} 
                        style={styles.titleInput} 
                      />
                    ) : (
                      <>
                        <Text style={styles.goalTitle} numberOfLines={2}>{editableTitle}</Text>
                        <Edit3 size={16} color={colors.textLight} style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}><X size={20} color={colors.textSecondary} /></TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {tasks.map((task, i) => (
                  <TouchableOpacity key={task.id} style={styles.taskRow} onPress={() => setEditingTask(task)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{task.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.tapToEdit}>Tap to edit details</Text>
                        {task.link && <LinkIcon size={12} color={colors.primary} style={{ opacity: 0.8 }} />}
                      </View>
                    </View>
                    <View style={styles.timeBadge}><Text style={styles.timeText}>{task.duration}m</Text></View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* MODE SWITCHER TRIGGER */}
              <TouchableOpacity style={styles.modeSwitchContainer} onPress={handleModeSwitchPress} activeOpacity={0.8}>
                <View style={[styles.modeIcon, { borderColor: goalType === 'journey' ? '#059669' : colors.primary }]}>
                  {goalType === 'journey' ? <Map size={18} color="#059669" /> : <Target size={18} color={colors.primary} />}
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.modeTitle}>
                    {goalType === 'journey' ? "LONG-TERM JOURNEY" : "SINGLE SESSION PROJECT"}
                  </Text>
                  <Text style={styles.modeSubtitle}>
                    Tap to view details & switch mode
                  </Text>
                </View>
                <View style={styles.switchIcon}>
                  <Zap size={14} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleInitialize}>
                <Text style={styles.btnText}>INITIALIZE SEQUENCE</Text>
                <Play size={18} color="#FFF" fill="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  container: { backgroundColor: '#FFF', borderRadius: 32, padding: 24, height: height * 0.8, position: 'relative', overflow: 'hidden' },
  
  // Link Button Styles
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },

  // Detailed Popup Styles
  popupOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.98)', 
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  popupCard: { width: '100%', alignItems: 'center' },
  popupClose: { position: 'absolute', top: -60, right: 0, padding: 12 },
  popupIconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  popupTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4, textAlign: 'center' },
  popupSubtitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 24, textTransform: 'uppercase' },
  
  detailsBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  detailHeader: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  featureText: { fontSize: 15, color: colors.text, flex: 1, lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  analogyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', padding: 12, borderRadius: 12 },
  analogyText: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', flex: 1 },

  confirmSwitchBtn: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6
  },
  confirmSwitchText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Header & List Styles
  header: { flexDirection: 'row', marginBottom: 24, gap: 12 },
  topLab: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 1.5, marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  goalTitle: { fontSize: 22, fontWeight: '700', color: colors.text, maxWidth: '90%' },
  titleInput: { fontSize: 22, fontWeight: '700', borderBottomWidth: 2, borderBottomColor: colors.primary, color: colors.text, padding: 0 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 2 },
  tapToEdit: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  timeBadge: { backgroundColor: colors.glow, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.primary },
  timeText: { color: colors.primary, fontWeight: '800' },
  
  primaryBtn: { backgroundColor: colors.primary, padding: 20, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  btnText: { color: '#FFF', fontWeight: '800', letterSpacing: 1 },
  
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 4 },
  backText: { color: colors.primary, fontWeight: '700' },
  editTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: colors.text },
  descBox: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  descText: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
  
  refineSection: { marginBottom: 30, backgroundColor: '#F9FAFB', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  refineInputRow: { flexDirection: 'row', gap: 10 },
  refineInput: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', minHeight: 45, fontSize: 14 },
  refineBtn: { width: 45, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  refineBtnDisabled: { backgroundColor: '#D1D5DB' },

  editorSection: { alignItems: 'center', marginBottom: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 20 },
  stepper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 },
  stepBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  timeValueBox: { alignItems: 'center', minWidth: 80 },
  durVal: { fontSize: 48, fontWeight: '800', color: colors.text },
  minLab: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: -4 },
  saveBtn: { backgroundColor: colors.text, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 'auto' },
  saveText: { color: '#FFF', fontWeight: '800' },

  // Mode Switcher Styles (List View)
  modeSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 10,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2
  },
  modeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5
  },
  modeSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500'
  },
  switchIcon: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8
  }
});