import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideInUp } from 'react-native-reanimated';
import { Check, X, Clock, ArrowRight, Plus, Minus, Target, AlertCircle } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface SessionData {
  completed: boolean;
  distraction?: string;
  addedMinutes?: number;
}

interface SessionDebriefProps {
  visible: boolean;
  onComplete: (data: SessionData) => void;
}

const FRICTION_POINTS = [
  { id: 'distraction', label: 'Distractions', icon: '🔔' },
  { id: 'estimation', label: 'Bad Estimate', icon: '⏱️' },
  { id: 'energy', label: 'Low Energy', icon: '🔋' },
  { id: 'blocked', label: 'Blocked', icon: '🚧' },
];

export const SessionDebrief: React.FC<SessionDebriefProps> = ({ visible, onComplete }) => {
  const [step, setStep] = useState<'outcome' | 'analysis' | 'recovery'>('outcome');
  const [friction, setFriction] = useState<string | null>(null);
  const [addedTime, setAddedTime] = useState(15);

  if (!visible) return null;

  const handleSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Slight delay for animation before closing
    setTimeout(() => {
        onComplete({ completed: true });
    }, 300);
  };

  const handleFailure = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('analysis');
  };

  const handleFrictionSelect = (id: string) => {
    Haptics.selectionAsync();
    setFriction(id);
    setTimeout(() => setStep('recovery'), 250);
  };

  const adjustTime = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddedTime(prev => Math.max(5, prev + delta));
  };

  const handleExtension = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete({ 
        completed: false, 
        distraction: friction || 'unknown',
        addedMinutes: addedTime
    });
  };

  // --- RENDER STEPS ---

  const renderOutcome = () => (
    <View style={styles.contentContainer}>
      <Animated.View entering={SlideInDown.delay(100).springify()} style={styles.iconHeader}>
        <View style={styles.badgeContainer}>
            <Target size={16} color={colors.primary} />
            <Text style={styles.badgeText}>MISSION REPORT</Text>
        </View>
        <Text style={styles.mainQuestion}>Did you secure the objective?</Text>
      </Animated.View>

      <View style={styles.cardContainer}>
        {/* Success Card */}
        <Animated.View entering={SlideInUp.delay(200).springify()} style={{ width: '100%' }}>
            <TouchableOpacity 
                style={styles.successCard} 
                onPress={handleSuccess}
                activeOpacity={0.9}
            >
                <View style={styles.successIconBox}>
                    <Check size={28} color="#FFFFFF" strokeWidth={3} />
                </View>
                <View style={styles.cardTextContent}>
                    <Text style={styles.successTitle}>OBJECTIVE COMPLETE</Text>
                    <Text style={styles.successSubtitle}>Task finished successfully.</Text>
                </View>
                <ArrowRight size={20} color="#15803D" />
            </TouchableOpacity>
        </Animated.View>

        {/* Fail Card */}
        <Animated.View entering={SlideInUp.delay(300).springify()} style={{ width: '100%' }}>
            <TouchableOpacity 
                style={styles.failCard} 
                onPress={handleFailure}
                activeOpacity={0.9}
            >
                <View style={styles.failIconBox}>
                    <Clock size={28} color={colors.text} strokeWidth={2.5} />
                </View>
                <View style={styles.cardTextContent}>
                    <Text style={styles.failTitle}>NOT YET</Text>
                    <Text style={styles.failSubtitle}>I need more time or got blocked.</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );

  const renderAnalysis = () => (
    <Animated.View entering={SlideInDown} style={styles.contentContainer}>
      <Text style={styles.headerTitle}>DEBRIEF</Text>
      <Text style={styles.headerSubtitle}>What was the primary obstacle?</Text>

      <View style={styles.grid}>
        {FRICTION_POINTS.map((item) => (
            <TouchableOpacity 
                key={item.id}
                style={[styles.gridItem, friction === item.id && styles.gridItemSelected]}
                onPress={() => handleFrictionSelect(item.id)}
                activeOpacity={0.7}
            >
                <Text style={styles.gridIcon}>{item.icon}</Text>
                <Text style={[styles.gridLabel, friction === item.id && styles.gridLabelSelected]}>
                    {item.label}
                </Text>
            </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const renderRecovery = () => (
    <Animated.View entering={SlideInDown} style={styles.contentContainer}>
      <Text style={styles.headerTitle}>RECOVERY PROTOCOL</Text>
      <Text style={styles.headerSubtitle}>How much more time do you need?</Text>

      <View style={styles.timeControl}>
        <TouchableOpacity style={styles.timeBtn} onPress={() => adjustTime(-5)}>
            <Minus size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.timeDisplay}>
            <Text style={styles.timeValue}>{addedTime}</Text>
            <Text style={styles.timeUnit}>MINUTES</Text>
        </View>
        <TouchableOpacity style={styles.timeBtn} onPress={() => adjustTime(5)}>
            <Plus size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.confirmBtn} onPress={handleExtension}>
        <Text style={styles.confirmText}>UPDATE MISSION PARAMETERS</Text>
        <ArrowRight size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* White Background Fade In */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.whiteBackground} />
      
      <View style={styles.safeArea}>
        {step === 'outcome' && renderOutcome()}
        {step === 'analysis' && renderAnalysis()}
        {step === 'recovery' && renderRecovery()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF', // Clean white sheet
  },
  safeArea: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // --- Header Styles ---
  iconHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)', // Light orange pill
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  mainQuestion: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 34,
  },

  // --- Card Styles (New) ---
  cardContainer: {
    width: '100%',
    gap: 16,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4', // Very light green
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 20,
    borderRadius: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  successIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#16A34A', // Green
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14532D', // Dark green text
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '500',
  },

  failCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB', // Light Gray
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 20,
    borderRadius: 24,
  },
  failIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  failTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  failSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // --- Reuse existing styles for other steps ---
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  gridItem: {
    width: '47%',
    aspectRatio: 1.2,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  gridItemSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFFBEB',
  },
  gridIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  gridLabelSelected: {
    color: colors.primaryDark,
  },
  timeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  timeBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplay: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
  },
  timeUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 24,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    gap: 8,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});