import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Dimensions, 
  TextInput, 
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { X, Minus, Plus, Send, Sparkles, Info, CheckCircle2, Circle } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  FadeIn, 
  FadeOut 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';

const { height } = Dimensions.get('window');

interface TaskEditModalProps {
  visible: boolean;
  task: any;
  onClose: () => void;
  onUpdate: (id: string, updates: any) => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({ visible, task, onClose, onUpdate }) => {
  const { reportTaskIssue } = useApp();
  
  // Animation & State
  const translateY = useSharedValue(height);
  const [feedback, setFeedback] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    if (visible) {
      // Slide Up
      translateY.value = withSpring(0, {
        damping: 40,
        stiffness: 300,
        mass: 0.8,
      });
      setFeedback('');
    } else {
      // Slide Down
      translateY.value = height;
    }
  }, [visible]);

  if (!task) return null;

  const handleTimeChange = (diff: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate(task.id, { duration: Math.max(5, (task.duration || 15) + diff) });
  };

  const toggleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onUpdate(task.id, { 
      status: task.status === 'completed' ? 'queued' : 'completed' 
    });
  };

  const handleReportToHQ = async () => {
    if (!feedback.trim()) return;
    
    setIsRefining(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Calls the refinement logic in AppContext
      await reportTaskIssue(task.id, feedback);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose(); // Close to show the updated task
    } catch (error) {
      console.error("Refinement failed:", error);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.overlay}>
          {/* Background Fade */}
          <Animated.View 
            entering={FadeIn.duration(200)} 
            exiting={FadeOut.duration(200)}
            style={StyleSheet.absoluteFill}
          >
            <TouchableOpacity 
              style={styles.dismissArea} 
              activeOpacity={1} 
              onPress={onClose} 
            />
          </Animated.View>
          
          {/* Main Slide-up Container */}
          <Animated.View style={[styles.container, animatedContainerStyle]}>
            <View style={styles.handle} />
            
            <View style={styles.header}>
              <Text style={styles.headerLabel}>EDIT PARAMETERS</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>{task.title}</Text>

            {/* Context Card */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                  <Info size={12} color={colors.primary} />
                  <Text style={styles.sectionLabel}>TACTICAL BRIEF</Text>
              </View>
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>
                  {task.description || "No specific instructions provided."}
                </Text>
              </View>
            </View>

            {/* Refinement / Report Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                  <Sparkles size={12} color={colors.primary} />
                  <Text style={styles.sectionLabel}>REPORT OBSTACLE</Text>
              </View>
              <View style={styles.reportRow}>
                <TextInput
                  style={styles.reportInput}
                  placeholder="Explain why this isn't feasible..."
                  placeholderTextColor={colors.textLight}
                  value={feedback}
                  onChangeText={setFeedback}
                  multiline
                />
                <TouchableOpacity 
                  style={[styles.sendBtn, !feedback.trim() && styles.sendBtnDisabled]}
                  onPress={handleReportToHQ}
                  disabled={!feedback.trim() || isRefining}
                >
                  {isRefining ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Send size={18} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Duration Editor */}
            <View style={styles.editorSection}>
              <Text style={styles.sectionLabel}>ADJUST DURATION</Text>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => handleTimeChange(-5)}>
                  <Minus size={22} color="#1A1A1A" />
                </TouchableOpacity>
                
                <View style={styles.timeValueBox}>
                  <Text style={styles.timeValue}>{task.duration || 0}</Text>
                  <Text style={styles.minLabel}>MINS</Text>
                </View>

                <TouchableOpacity style={styles.stepBtn} onPress={() => handleTimeChange(5)}>
                  <Plus size={22} color="#1A1A1A" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity 
              style={[styles.completeBtn, task.status === 'completed' && styles.completeBtnActive]} 
              onPress={toggleComplete}
              activeOpacity={0.8}
            >
              {task.status === 'completed' ? (
                <CheckCircle2 size={20} color="#FFFFFF" fill="rgba(255,255,255,0.2)" />
              ) : (
                <Circle size={20} color="#FFFFFF" opacity={0.5} />
              )}
              <Text style={styles.completeBtnText}>
                {task.status === 'completed' ? 'MARK AS INCOMPLETE' : 'MARK AS FINISHED'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'flex-end' 
  },
  dismissArea: { 
    flex: 1,
    backgroundColor: 'transparent'
  },
  container: { 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24, 
    paddingBottom: Platform.OS === 'ios' ? 45 : 30,
    borderTopWidth: 1,
    borderColor: '#F0F0F0',
  },
  handle: { 
    width: 36, 
    height: 4, 
    backgroundColor: '#F3F4F6', 
    borderRadius: 2, 
    alignSelf: 'center', 
    marginBottom: 20 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  headerLabel: { 
    fontSize: 10, 
    fontWeight: '900', 
    color: colors.primary, 
    letterSpacing: 1.5 
  },
  closeBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#F9FAFB', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#1A1A1A', 
    marginBottom: 24,
    lineHeight: 28 
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#9CA3AF', 
    letterSpacing: 1 
  },
  descriptionCard: { 
    backgroundColor: '#F9FAFB', 
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#F3F4F6'
  },
  descriptionText: { 
    fontSize: 14, 
    color: '#4B5563', 
    lineHeight: 20,
    fontWeight: '500'
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: 8,
  },
  reportInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 45,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.textLight,
  },
  editorSection: { 
    alignItems: 'center', 
    marginBottom: 32,
    marginTop: 10
  },
  stepper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 40 
  },
  stepBtn: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  timeValueBox: { 
    alignItems: 'center',
    minWidth: 80
  },
  timeValue: { 
    fontSize: 42, 
    fontWeight: '900', 
    color: '#1A1A1A' 
  },
  minLabel: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#9CA3AF', 
    marginTop: -4 
  },
  completeBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#1A1A1A', 
    paddingVertical: 18, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completeBtnActive: { 
    backgroundColor: colors.success 
  },
  completeBtnText: { 
    color: '#FFFFFF', 
    fontSize: 14, 
    fontWeight: '800', 
    letterSpacing: 1 
  },
});