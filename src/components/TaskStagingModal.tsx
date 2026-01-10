import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInRight,
  FadeOutLeft,
  ZoomIn,
  Layout
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { lightColors as colors } from '../constants/colors';
import { Clock, Play, X, ChevronLeft, Minus, Plus, Info } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// --- UPDATED TEST SCENARIOS WITH DESCRIPTIONS ---
export const TEST_SCENARIOS = {
  scenario_1: {
    goal: "Study for Physics Midterm",
    tasks: [
      { 
        id: '1', 
        title: "Review Kinematics Notes", 
        duration: 20,
        description: "Go through chapters 1-3 focusing specifically on projectile motion and relative velocity equations. Highlight key derivations for the exam cheat sheet."
      },
      { 
        id: '2', 
        title: "Practice Problem Set A", 
        duration: 45,
        description: "Solve the remaining 15 problems from last week's worksheet. Focus on energy conservation and work-power calculations."
      },
      { 
        id: '3', 
        title: "Quick Quiz", 
        duration: 15, 
        description: "Take a timed mock quiz on the student portal to test recall speed of common constants and units."
      },
    ]
  },
  scenario_2: {
    goal: "Launch Dropshipping Store",
    tasks: [
      { 
        id: 'a', 
        title: "Competitor Research", 
        duration: 60,
        description: "Analyze the top 5 competitors in the niche. Document their pricing strategy, shipping times, and most successful ad creative styles."
      },
      { 
        id: 'b', 
        title: "Setup Shopify Theme", 
        duration: 30,
        description: "Apply the 'Sense' theme. Upload the main logo, set the primary brand colors to amber, and configure the header navigation menu."
      },
      { 
        id: 'c', 
        title: "Write Product Descriptions", 
        duration: 45,
        description: "Craft high-converting copy for 3 hero products. Focus on problem-solution framing and include technical specifications in a bulleted list."
      },
    ]
  }
};

interface StagingTask {
  id: string;
  title: string;
  duration: number;
  description: string;
}

interface TaskStagingModalProps {
  visible: boolean;
  goalTitle: string;
  onConfirm: (finalTasks: StagingTask[]) => void;
  onClose: () => void;
}

export const TaskStagingModal: React.FC<TaskStagingModalProps> = ({
  visible,
  goalTitle,
  onConfirm,
  onClose,
}) => {
  const [tasks, setTasks] = useState<StagingTask[]>(TEST_SCENARIOS.scenario_1.tasks);
  const [editingTask, setEditingTask] = useState<StagingTask | null>(null);

  useEffect(() => {
    if (visible) {
      setTasks([...TEST_SCENARIOS.scenario_1.tasks]);
      setEditingTask(null);
    }
  }, [visible]);

  const handleUpdateDuration = (taskId: string, newDuration: number) => {
    const validDuration = Math.max(5, newDuration);
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, duration: validDuration } : t
    ));
    if (editingTask?.id === taskId) {
      setEditingTask(prev => prev ? { ...prev, duration: validDuration } : null);
    }
  };

  const handleInitialize = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(tasks);
  };

  // --- RENDER SUB-VIEWS ---

  const renderEditView = (task: StagingTask) => (
    <Animated.View 
      entering={FadeInRight.duration(300)} 
      exiting={FadeOutLeft.duration(300)}
      style={styles.editContainer}
    >
      <TouchableOpacity 
        onPress={() => setEditingTask(null)}
        style={styles.backButton}
      >
        <ChevronLeft size={24} color={colors.primary} />
        <Text style={styles.backText}>Back to List</Text>
      </TouchableOpacity>

      <Text style={styles.editHeader}>Task Parameters</Text>
      <Text style={styles.editTitle}>{task.title}</Text>
      
      <View style={styles.descriptionBox}>
        <View style={styles.descHeader}>
          <Info size={16} color={colors.primary} />
          <Text style={styles.descLabel}>AI ANALYSIS</Text>
        </View>
        <Text style={styles.descriptionText}>{task.description}</Text>
      </View>

      <View style={styles.durationEditor}>
        <Text style={styles.durationLabel}>ADJUST FOCUS TIME</Text>
        <View style={styles.stepper}>
          <TouchableOpacity 
            style={styles.stepBtn}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleUpdateDuration(task.id, task.duration - 5);
            }}
          >
            <Minus size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.durationValueContainer}>
            <Text style={styles.durationValue}>{task.duration}</Text>
            <Text style={styles.minLabel}>MINS</Text>
          </View>

          <TouchableOpacity 
            style={styles.stepBtn}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleUpdateDuration(task.id, task.duration + 5);
            }}
          >
            <Plus size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.saveButton}
        onPress={() => setEditingTask(null)}
      >
        <Text style={styles.saveButtonText}>SAVE PARAMETERS</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderListView = () => (
    <Animated.View 
      entering={FadeInRight.duration(300)} 
      exiting={FadeOutLeft.duration(300)}
      style={{ flex: 1 }}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.topLabel}>MISSION STAGING</Text>
          <Text style={styles.goalTitle} numberOfLines={2}>
            {goalTitle || TEST_SCENARIOS.scenario_1.goal}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.list} 
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {tasks.map((task, index) => (
          <Animated.View 
            key={task.id}
            entering={FadeInDown.delay(index * 100).duration(500)}
            layout={Layout.springify()}
          >
            <TouchableOpacity 
              style={styles.taskRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setEditingTask(task);
              }}
            >
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.tapToEdit}>Tap to view details</Text>
              </View>
              
              <View style={styles.timeBadge}>
                <Text style={styles.timeText}>{task.duration}m</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleInitialize}
          activeOpacity={0.9}
        >
          <Text style={styles.buttonText}>INITIALIZE SEQUENCE</Text>
          <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View 
          entering={ZoomIn.duration(400)} 
          style={styles.modalContainer}
        >
          {editingTask ? renderEditView(editingTask) : renderListView()}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    height: height * 0.8,
    backgroundColor: colors.backgroundCard,
    borderRadius: 32,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  topLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 30,
    maxWidth: '85%',
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 10,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  tapToEdit: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  timeBadge: {
    backgroundColor: colors.glow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  timeText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  footer: {
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Edit View Styles
  editContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginLeft: -4,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  editHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  editTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  descriptionBox: {
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 30,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  descLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  durationEditor: {
    marginBottom: 40,
  },
  durationLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 20,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  stepBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationValueContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  durationValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
  },
  minLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: -4,
  },
  saveButton: {
    backgroundColor: colors.text,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  }
});