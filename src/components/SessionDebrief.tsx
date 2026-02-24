import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView
} from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideInUp } from 'react-native-reanimated';
import { 
  Check, 
  Clock, 
  ArrowRight, 
  Plus, 
  Minus, 
  Target, 
  Smartphone, 
  Hourglass, 
  Battery, 
  HelpCircle,
  MessageSquare
} from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

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
  { id: 'distraction', label: 'Distracted', Icon: Smartphone },
  { id: 'estimation', label: 'Ran Out of Time', Icon: Hourglass },
  { id: 'energy', label: 'Low Energy', Icon: Battery },
  { id: 'stuck', label: 'Got Stuck', Icon: HelpCircle },
];

export const SessionDebrief: React.FC<SessionDebriefProps> = ({ visible, onComplete }) => {
  const [step, setStep] = useState<'outcome' | 'analysis' | 'recovery'>('outcome');
  const [friction, setFriction] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [addedTime, setAddedTime] = useState(15);
  const [isTransitioning, setIsTransitioning] = useState(false);

  if (!visible) return null;

  const handleSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
        onComplete({ completed: true });
    }, 300);
  };

  const handleFailure = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('analysis');
  };

  const handleFrictionSelect = (id: string) => {
    if (isTransitioning) return;
    
    Haptics.selectionAsync();
    setFriction(id);
    setCustomReason(''); // Clear custom text if picking a preset
    setIsTransitioning(true);

    // Slower animation (800ms) with orange highlight before moving
    setTimeout(() => {
      setStep('recovery');
      setIsTransitioning(false);
    }, 800);
  };

  const handleCustomSubmit = () => {
    if (customReason.trim().length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFriction('other');
      setStep('recovery');
    }
  };

  const adjustTime = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddedTime(prev => Math.max(5, prev + delta));
  };

  const handleExtension = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const finalReason = (friction === 'other' || customReason) ? customReason : (friction || 'unknown');

    onComplete({ 
        completed: false, 
        distraction: finalReason,
        addedMinutes: addedTime
    });
  };

  // --- RENDER STEPS ---

  const renderOutcome = () => (
    <View style={styles.centerContent}>
      <Animated.View entering={SlideInDown.delay(100).springify()} style={styles.iconHeader}>
        <View style={styles.badgeContainer}>
            <Target size={16} color={colors.primary} />
            <Text style={styles.badgeText}>MISSION REPORT</Text>
        </View>
        <Text style={styles.mainQuestion}>Did you finish the task?</Text>
      </Animated.View>

      <View style={styles.cardContainer}>
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
                    <Text style={styles.successTitle}>YES</Text>
                    <Text style={styles.successSubtitle}>Objective secure. Mark as done.</Text>
                </View>
                <ArrowRight size={20} color="#15803D" />
            </TouchableOpacity>
        </Animated.View>

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
                    <Text style={styles.failSubtitle}>I need more time.</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );

  const renderAnalysis = () => (
    <View style={styles.centerContent}>
      <Animated.View entering={SlideInDown} style={{ width: '100%', alignItems: 'center' }}>
        <Text style={styles.headerTitle}>DEBRIEF</Text>
        <Text style={styles.headerSubtitle}>What slowed you down?</Text>

        {/* Grid of 4 Options */}
        <View style={styles.grid}>
          {FRICTION_POINTS.map((item) => {
              const isSelected = friction === item.id;
              return (
                  <TouchableOpacity 
                      key={item.id}
                      style={[
                        styles.gridItem, 
                        isSelected && styles.gridItemSelected
                      ]}
                      onPress={() => handleFrictionSelect(item.id)}
                      activeOpacity={0.7}
                      disabled={isTransitioning}
                  >
                      <View style={[
                        styles.iconCircle, 
                        isSelected && { backgroundColor: 'rgba(255,255,255,0.4)' }
                      ]}>
                          <item.Icon 
                              size={28} 
                              color={isSelected ? '#7c2d12' : colors.textSecondary} 
                              strokeWidth={2}
                          />
                      </View>
                      <Text 
                        style={[
                          styles.gridLabel, 
                          isSelected && { color: '#7c2d12', fontWeight: '700' }
                        ]}
                        numberOfLines={2}
                      >
                          {item.label}
                      </Text>
                  </TouchableOpacity>
              );
          })}
        </View>

        {/* "OR" Separator */}
        <View style={styles.separator}>
          <View style={styles.line} />
          <Text style={styles.separatorText}>OR</Text>
          <View style={styles.line} />
        </View>

        {/* Custom Text Input */}
        <View style={styles.customInputContainer}>
          <MessageSquare size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.textInput}
            placeholder="Type what happened..."
            placeholderTextColor={colors.textSecondary}
            value={customReason}
            onChangeText={(text) => {
              setCustomReason(text);
              if (friction) setFriction(null);
            }}
            returnKeyType="done"
            onSubmitEditing={handleCustomSubmit}
          />
          
          {/* Confirm Button */}
          {customReason.trim().length > 0 && (
            <Animated.View entering={FadeIn}>
              <TouchableOpacity 
                style={styles.miniConfirmBtn} 
                onPress={handleCustomSubmit}
              >
                <ArrowRight size={16} color="#FFF" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </View>
  );

  const renderRecovery = () => (
    <View style={styles.centerContent}>
      <Animated.View entering={SlideInDown} style={{ width: '100%', alignItems: 'center' }}>
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
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 1. Full Screen White Background (Static Layer) */}
      <View style={styles.whiteBackground} />

      {/* 2. Keyboard Aware Layer (Content moves up, background stays solid) */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 'outcome' && renderOutcome()}
            {step === 'analysis' && renderAnalysis()}
            {step === 'recovery' && renderRecovery()}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  whiteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF', // Ensures no see-through when keyboard opens
    zIndex: 0,
  },
  keyboardContainer: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  centerContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400, // Helps centering
  },
  
  // Header Styles
  iconHeader: { alignItems: 'center', marginBottom: 40 },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  mainQuestion: { fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center', lineHeight: 34 },

  // Card Styles
  cardContainer: { width: '100%', gap: 16 },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
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
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContent: { flex: 1 },
  successTitle: { fontSize: 16, fontWeight: '800', color: '#14532D', letterSpacing: 0.5, marginBottom: 2 },
  successSubtitle: { fontSize: 14, color: '#15803D', fontWeight: '500' },

  failCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
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
  failTitle: { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: 0.5, marginBottom: 2 },
  failSubtitle: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },

  // Debrief Header
  headerTitle: { fontSize: 12, fontWeight: '800', color: colors.primary, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  headerSubtitle: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 32 },
  
  // Grid Styles
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  gridItem: {
    width: '47%', 
    height: 120, // Fixed height for consistency
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  gridItemSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(245, 158, 11, 0.15)', // Orange opacity background
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  gridLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    width: '100%',
  },
  gridLabelSelected: { color: colors.primaryDark },

  // Separator
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
    paddingHorizontal: 10
  },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  separatorText: { marginHorizontal: 10, color: colors.textSecondary, fontSize: 12, fontWeight: '600' },

  // Custom Input Box
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 56,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
    height: '100%',
  },
  miniConfirmBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // Recovery Time Control
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
  timeDisplay: { alignItems: 'center' },
  timeValue: { fontSize: 48, fontWeight: '800', color: colors.text },
  timeUnit: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1 },
  
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
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});