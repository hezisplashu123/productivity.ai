import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { X, Minus, Plus, CheckCircle2, Circle, Info } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  FadeIn, 
  FadeOut 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { height } = Dimensions.get('window');

export const TaskEditModal = ({ visible, task, onClose, onUpdate }: any) => {
  // Manual animation value for total control
  const translateY = useSharedValue(height);

  useEffect(() => {
    if (visible) {
      // Snappy spring with high damping = NO JUMP/BOUNCE
      translateY.value = withSpring(0, {
        damping: 40,
        stiffness: 300,
        mass: 0.8,
      });
    } else {
      translateY.value = height;
    }
  }, [visible]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!task) return null;

  const handleTimeChange = (diff: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate(task.id, { duration: Math.max(5, task.duration + diff) });
  };

  const toggleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const isNowCompleted = task.status !== 'completed';
    onUpdate(task.id, { 
      status: isNowCompleted ? 'completed' : 'queued',
      completed: isNowCompleted
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        {/* Rapid Background Fade */}
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
        
        {/* Manual Slide Container */}
        <Animated.View style={[styles.container, animatedContainerStyle]}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.headerLabel}>EDIT PARAMETERS</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{task.title}</Text>

          <View style={styles.descriptionCard}>
            <View style={styles.descTitleRow}>
                <Info size={12} color={colors.primary} />
                <Text style={styles.descTitle}>AI CONTEXT</Text>
            </View>
            <Text style={styles.descriptionText}>
              {task.description || "The AI suggested this step to optimize your focus session for this mission."}
            </Text>
          </View>

          <View style={styles.editorSection}>
            <Text style={styles.sectionLabel}>FOCUS DURATION</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => handleTimeChange(-5)}>
                <Minus size={22} color="#1A1A1A" />
              </TouchableOpacity>
              
              <View style={styles.timeValueBox}>
                <Text style={styles.timeValue}>{task.duration}</Text>
                <Text style={styles.minLabel}>MINS</Text>
              </View>

              <TouchableOpacity style={styles.stepBtn} onPress={() => handleTimeChange(5)}>
                <Plus size={22} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
          </View>

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
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
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
    // Add border to blend with bottom edge
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
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
    marginBottom: 16,
    lineHeight: 28 
  },
  descriptionCard: { 
    backgroundColor: '#F9FAFB', 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  descTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 6 
  },
  descTitle: { 
    fontSize: 9, 
    fontWeight: '900', 
    color: colors.primary, 
    letterSpacing: 1 
  },
  descriptionText: { 
    fontSize: 14, 
    color: '#6B7280', 
    lineHeight: 20,
    fontWeight: '500'
  },
  editorSection: { 
    alignItems: 'center', 
    marginBottom: 32 
  },
  sectionLabel: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#9CA3AF', 
    letterSpacing: 1.2, 
    marginBottom: 16 
  },
  stepper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 40 
  },
  stepBtn: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
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
    fontSize: 48, 
    fontWeight: '900', 
    color: '#1A1A1A' 
  },
  minLabel: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#9CA3AF', 
    marginTop: -8 
  },
  completeBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#1A1A1A', 
    paddingVertical: 18, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10,
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