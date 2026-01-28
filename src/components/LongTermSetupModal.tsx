import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { Calendar, ArrowRight, Clock, Minus, Plus } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

interface LongTermSetupModalProps {
  visible: boolean;
  goalTitle: string;
  aiReason: string;
  initialDays?: number; // Optional suggested duration
  initialDailyMinutes?: number; // Optional suggested daily minutes
  onConfirm: (date: Date, dailyMinutes: number) => void;
  onCancel: () => void;
}

export const LongTermSetupModal = ({ 
  visible, 
  goalTitle, 
  aiReason, 
  initialDays = 30,
  initialDailyMinutes = 45,
  onConfirm, 
  onCancel 
}: LongTermSetupModalProps) => {
  const [date, setDate] = useState(new Date(Date.now() + 86400000 * 30));
  const [dailyMinutes, setDailyMinutes] = useState(45); 
  const [showPicker, setShowPicker] = useState(false);

  // Sync state with recommendations when visibility changes
  useEffect(() => {
    if (visible) {
      const target = new Date();
      target.setDate(target.getDate() + initialDays);
      setDate(target);
      setDailyMinutes(initialDailyMinutes);
    }
  }, [visible, initialDays, initialDailyMinutes]);

  if (!visible) return null;

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(date, dailyMinutes);
  };

  const handleTimeChange = (delta: number) => {
    const newVal = Math.max(15, Math.min(240, dailyMinutes + delta)); // Min 15m, Max 4h
    if (newVal !== dailyMinutes) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDailyMinutes(newVal);
    }
  };

  const daysUntil = Math.max(1, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View entering={FadeInUp.springify()} exiting={FadeOutDown} style={styles.card}>
          
          <View style={styles.headerRow}>
            <View style={styles.iconContainer}>
              <Calendar size={28} color={colors.primary} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.title}>Journey Detected</Text>
              <Text style={styles.subtitle} numberOfLines={2}>Analyst suggests: {initialDays} days @ {initialDailyMinutes}m/day</Text>
            </View>
          </View>

          {/* SECTION 1: DEADLINE */}
          <View style={styles.section}>
            <Text style={styles.label}>TARGET DEADLINE</Text>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => setShowPicker(!showPicker)}
            >
              <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{daysUntil} DAYS</Text>
              </View>
            </TouchableOpacity>

            {showPicker && (
              <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : undefined}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? "spinner" : "default"}
                  minimumDate={new Date()}
                  onChange={onDateChange}
                  textColor={colors.text}
                />
              </View>
            )}
          </View>

          {/* SECTION 2: DAILY CAPACITY */}
          <View style={styles.section}>
            <Text style={styles.label}>DAILY COMMITMENT</Text>
            <View style={styles.timeControl}>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => handleTimeChange(-15)}>
                <Minus size={20} color={colors.text} />
              </TouchableOpacity>
              
              <View style={styles.timeDisplay}>
                <Clock size={16} color={colors.primary} style={{marginBottom: 4}} />
                <Text style={styles.timeValue}>
                  {dailyMinutes >= 60 ? `${Math.floor(dailyMinutes/60)}h ${dailyMinutes%60 > 0 ? dailyMinutes%60 + 'm' : ''}` : `${dailyMinutes}m`}
                </Text>
                <Text style={styles.timeSub}>PER DAY</Text>
              </View>

              <TouchableOpacity style={styles.stepperBtn} onPress={() => handleTimeChange(15)}>
                <Plus size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onCancel}>
              <Text style={styles.secondaryText}>Switch to Single Project</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm}>
              <Text style={styles.primaryText}>Initialize Journey</Text>
              <ArrowRight size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
  iconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(245, 158, 11, 0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },
  
  section: { marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 12, letterSpacing: 1 },
  
  dateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  dateText: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  
  iosPickerContainer: { marginTop: 10, backgroundColor: '#F9FAFB', borderRadius: 12, overflow: 'hidden' },

  // Time Control Styles
  timeControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  stepperBtn: { width: 48, height: 48, backgroundColor: '#FFF', borderRadius: 14, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  timeDisplay: { alignItems: 'center', flex: 1 },
  timeValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  timeSub: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },

  actions: { gap: 12, marginTop: 8 },
  primaryBtn: { backgroundColor: colors.primary, padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { padding: 12, alignItems: 'center' },
  secondaryText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
});