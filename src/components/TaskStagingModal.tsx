import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Dimensions } from 'react-native';
import Animated, { ZoomIn, FadeInRight, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { Play, X, ChevronLeft, Minus, Plus, Info, Edit3 } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';

const { height } = Dimensions.get('window');

export const TaskStagingModal = ({ visible, goalTitle, generatedTasks, onConfirm, onClose }: any) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [editableTitle, setEditableTitle] = useState(goalTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      setEditableTitle(goalTitle);
      setTasks(generatedTasks || []);
      setEditingTask(null);
    }
  }, [visible, goalTitle, generatedTasks]);

  const handleUpdateDuration = (id: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, duration: Math.max(5, t.duration + delta) } : t));
  };

  const handleInitialize = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(tasks, editableTitle);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(400)} style={styles.container}>
          {editingTask ? (
            <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => setEditingTask(null)} style={styles.backBtn}>
                <ChevronLeft size={20} color={colors.primary} />
                <Text style={styles.backText}>Back to mission</Text>
              </TouchableOpacity>
              
              <Text style={styles.editTitle}>{editingTask.title}</Text>
              
              <View style={styles.descBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                  <Info size={14} color={colors.primary} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>AI STRATEGY</Text>
                </View>
                <Text style={styles.descText}>{editingTask.description}</Text>
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
              
              <TouchableOpacity style={styles.saveBtn} onPress={() => setEditingTask(null)}>
                <Text style={styles.saveText}>Save Parameters</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
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
                      <Text style={styles.tapToEdit}>Tap to edit details</Text>
                    </View>
                    <View style={styles.timeBadge}><Text style={styles.timeText}>{task.duration}m</Text></View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

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
  container: { backgroundColor: '#FFF', borderRadius: 32, padding: 24, height: height * 0.8 },
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
  primaryBtn: { backgroundColor: colors.primary, padding: 20, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  btnText: { color: '#FFF', fontWeight: '800', letterSpacing: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 4 },
  backText: { color: colors.primary, fontWeight: '700' },
  editTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16, color: colors.text },
  descBox: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 20, marginBottom: 30, borderWidth: 1, borderColor: '#F3F4F6' },
  descText: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
  editorSection: { alignItems: 'center', marginBottom: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 20 },
  stepper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 },
  stepBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  timeValueBox: { alignItems: 'center', minWidth: 80 },
  durVal: { fontSize: 48, fontWeight: '800', color: colors.text },
  minLab: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: -4 },
  saveBtn: { backgroundColor: colors.text, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 'auto' },
  saveText: { color: '#FFF', fontWeight: '800' }
});