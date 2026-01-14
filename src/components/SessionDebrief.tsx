import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, Layout } from 'react-native-reanimated';
import { Check, X, Clock, AlertTriangle, ArrowRight, Plus, Minus } from 'lucide-react-native';
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
  const [outcome, setOutcome] = useState<boolean | null>(null);
  const [friction, setFriction] = useState<string | null>(null);
  const [addedTime, setAddedTime] = useState(15);

  if (!visible) return null;

  const handleSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOutcome(true);
    // Slight delay for animation before closing
    setTimeout(() => {
        onComplete({ completed: true });
    }, 500);
  };

  const handleFailure = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOutcome(false);
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
    <Animated.View entering={FadeIn.duration(400)} style={styles.contentContainer}>
      <Text style={styles.headerTitle}>MISSION REPORT</Text>
      <Text style={styles.headerSubtitle}>Did you complete the objective?</Text>

      <View style={styles.outcomeRow}>
        <TouchableOpacity 
            style={[styles.outcomeBtn, styles.successBtn]} 
            onPress={handleSuccess}
            activeOpacity={0.8}
        >
            <View style={styles.iconCircleSuccess}>
                <Check size={32} color="#FFFFFF" strokeWidth={3} />
            </View>
            <Text style={styles.successText}>MISSION ACCOMPLISHED</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.outcomeBtn, styles.failBtn]} 
            onPress={handleFailure}
            activeOpacity={0.8}
        >
            <View style={styles.iconCircleFail}>
                <X size={32} color="#EF4444" strokeWidth={3} />
            </View>
            <Text style={styles.failText}>NOT YET</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
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
      <Animated.View entering={FadeIn.duration(500)} style={styles.whiteBackground} />
      
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
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
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
  
  // Outcome Step
  outcomeRow: {
    gap: 16,
    width: '100%',
  },
  outcomeBtn: {
    width: '100%',
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  successBtn: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  failBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  iconCircleSuccess: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircleFail: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  failText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.5,
  },

  // Analysis Step
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

  // Recovery Step
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