import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  useAnimatedProps,
  FadeIn, // Added FadeIn
} from 'react-native-reanimated';
import { ArrowRight, Sunrise, Coffee, Moon, Clock, MinusCircle, Flame, Hourglass } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import { SwipableCardStack, SwipableCardData } from './SwipableCardStack';
import { ScaleButton } from './ScaleButton';
import * as Haptics from 'expo-haptics';

export interface OnboardingData {
  cognitiveTrigger: string | null;
  distraction: string | null;
  focusWindow: string | null;
  workArchetype: string | null;
  productivityKillers: string[];
  aiPersonality: string | null;
  primaryGoal: string | null;
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
}

const WORK_ARCHETYPES = [
  { id: 'firefighter', label: 'The Firefighter', description: 'Reacting to urgent tasks', icon: '🚨' },
  { id: 'over-planner', label: 'The Over-Planner', description: 'Planning > Doing', icon: '📊' },
  { id: 'juggler', label: 'The Juggler', description: 'Too many projects', icon: '🤹' },
  { id: 'sprinter', label: 'The Sprinter', description: 'Fast bursts, then burnout', icon: '🏃' },
];

const FRICTION_TYPES = [
  { id: 'dopamine', title: 'The Dopamine Loop', subtitle: 'Doomscrolling & Apps' },
  { id: 'switch', title: 'The Switch Tax', subtitle: 'Interruptions & Context Switching' },
  { id: 'fatigue', title: 'Decision Fatigue', subtitle: 'Overthinking & Paralysis' },
  { id: 'biology', title: 'Biological Drag', subtitle: 'Sleep Debt & Burnout' },
  { id: 'loops', title: 'Open Loops', subtitle: 'Mental Clutter & Unfinished Tasks' },
  { id: 'perfectionism', title: 'Perfectionism', subtitle: 'Fear of Starting' },
];

const COGNITIVE_TRIGGERS = [
  { id: 'time-lie', title: 'I\'ll do it tomorrow.', description: 'The promise of tomorrow is eternal. Tomorrow becomes today, and today becomes yesterday.', icon: Clock },
  { id: 'energy-lie', title: 'It\'s not that important.', description: 'Minimization. We downplay the value of the task to reduce the guilt of avoiding it.', icon: MinusCircle },
  { id: 'pressure-lie', title: 'I work better under pressure.', description: 'Deadline adrenaline. We convince ourselves that stress is a superpower.', icon: Flame },
  { id: 'prep-lie', title: 'I just need more time.', description: 'The preparation trap. We confuse planning with progress.', icon: Hourglass },
];

const DISTRACTIONS = [
  { id: 'doomscrolling', label: 'Doomscrolling', description: 'TikTok, Reels, and Shorts loops.' },
  { id: 'wikipedia-hole', label: 'The Wikipedia Hole', description: 'Researching random topics instead of working.' },
  { id: 'gaming', label: 'Gaming', description: 'Just one more match.' },
  { id: 'nap-roulette', label: 'Nap Roulette', description: 'I\'ll just close my eyes for 15 minutes.' },
  { id: 'side-quests', label: 'Side Quests', description: 'Cleaning the house to avoid one email.' },
];

const FOCUS_WINDOWS = [
  { id: 'early-bird', label: 'Early Bird', time: '6 AM - 10 AM', description: 'Before the world wakes up.', bgColor: '#FFF9E6', icon: Sunrise },
  { id: 'mid-day', label: 'Mid-Day Sprinter', time: '11 AM - 3 PM', description: 'Caffeinated and locked in.', bgColor: '#FFE5CC', icon: Coffee },
  { id: 'night-owl', label: 'Night Owl', time: '9 PM - 2 AM', description: 'Peace, quiet, and focus.', bgColor: '#1E3A5F', icon: Moon },
];

const getProcessingPhrases = (): string[] => ['Analyzing your workflow...', 'Building your custom dashboard...', 'Almost ready...'];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<OnboardingData>({
    cognitiveTrigger: null, distraction: null, focusWindow: null, workArchetype: null, productivityKillers: [], aiPersonality: null, primaryGoal: null,
  });

  const stepTransition = useSharedValue(0);

  useEffect(() => {
    stepTransition.value = 0;
    stepTransition.value = withSpring(1, { damping: 20, stiffness: 100 });
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 4) {
      setTimeout(() => { try { onComplete(data); } catch (error) { console.error('Error completing onboarding:', error); } }, 300);
    }
  }, [currentStep, data, onComplete]);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return data.cognitiveTrigger !== null;
      case 1: return data.distraction !== null;
      case 2: return data.focusWindow !== null;
      case 3: return data.workArchetype !== null;
      case 4: return data.productivityKillers.length > 0;
      default: return false;
    }
  }, [currentStep, data]);

  const stepAnimatedStyle = useAnimatedStyle(() => ({
    opacity: stepTransition.value,
    transform: [{ scale: interpolate(stepTransition.value, [0, 1], [0.85, 1]) }],
  }));

  // Changed root View to Animated.View and added entering prop for FadeIn effect
  return (
    <Animated.View 
      style={[styles.container, { backgroundColor: '#FFFFFF' }]}
      entering={FadeIn.duration(800)}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          removeClippedSubviews={true}
        >
          <Animated.View style={stepAnimatedStyle}>
            {currentStep === 0 && <Step0CognitiveTriggers data={data} setData={setData} />}
            {currentStep === 1 && <Step1Distractions data={data} setData={setData} />}
            {currentStep === 2 && <Step2FocusWindow data={data} setData={setData} />}
            {currentStep === 3 && <Step3WorkArchetype data={data} setData={setData} />}
            {currentStep === 4 && <Step4ProductivityKillers data={data} setData={setData} />}
          </Animated.View>
        </ScrollView>
        <View style={styles.progressContainer}>
          {[0, 1, 2, 3, 4].map((step) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                { backgroundColor: step <= currentStep ? colors.primary : colors.border, width: step === currentStep ? 24 : 8, marginHorizontal: 4 },
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
      <View style={[styles.navigationWrapper, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.navigation}>
          {currentStep > 0 && (
            <ScaleButton style={[styles.backButton, { borderColor: colors.border }]} onPress={handleBack} hapticType="selection">
              <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Back</Text>
            </ScaleButton>
          )}
          <View style={{ flex: 1 }} />
          {canProceed ? (
            <ScaleButton style={[styles.nextButton, { backgroundColor: colors.primary }]} onPress={handleNext} hapticType="notification">
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.nextButtonText, { color: colors.background, marginRight: 8 }]}>{currentStep === 4 ? 'Complete' : 'Next'}</Text>
                {currentStep < 4 && <ArrowRight size={20} color={colors.background} />}
              </View>
            </ScaleButton>
          ) : (
            <View style={[styles.nextButton, { backgroundColor: colors.border }, styles.nextButtonDisabled]}>
              <Text style={[styles.nextButtonText, { color: colors.textSecondary, marginRight: 8 }]}>Next</Text>
              <ArrowRight size={20} color={colors.textSecondary} />
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// ... (Subcomponents like Step0CognitiveTriggers, Step1Distractions remain unchanged, just copying them for completeness)

const Step0CognitiveTriggers: React.FC<{ data: OnboardingData; setData: React.Dispatch<React.SetStateAction<OnboardingData>>; }> = React.memo(({ data, setData }) => {
  const handleSelect = useCallback((triggerId: string) => setData((prevData) => ({ ...prevData, cognitiveTrigger: triggerId })), [setData]);
  const AnimatedPill = ({ trigger, isSelected, onPress }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[styles.pillButton, { backgroundColor: isSelected ? colors.primary : colors.backgroundCard, borderColor: isSelected ? colors.primary : colors.border, borderWidth: isSelected ? 2 : 1 }, isSelected && { shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 }]}
          onPress={onPress} onPressIn={() => (scale.value = withSpring(0.95))} onPressOut={() => (scale.value = withSpring(1))} activeOpacity={1}>
          <Text style={[styles.pillLabel, { color: isSelected ? colors.background : colors.text }]}>{trigger.title}</Text>
          <Text style={[styles.pillDescription, { color: isSelected ? colors.background : colors.textSecondary }]}>{trigger.description}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Lies we tell ourselves</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>The "Cognitive Trigger"</Text>
      <View style={styles.pillsContainer}>
        {COGNITIVE_TRIGGERS.map((trigger) => <AnimatedPill key={trigger.id} trigger={trigger} isSelected={data.cognitiveTrigger === trigger.id} onPress={() => handleSelect(trigger.id)} />)}
      </View>
    </View>
  );
});

const Step1Distractions: React.FC<{ data: OnboardingData; setData: React.Dispatch<React.SetStateAction<OnboardingData>>; }> = React.memo(({ data, setData }) => {
  const handleSelect = useCallback((distractionId: string) => setData((prevData) => ({ ...prevData, distraction: distractionId })), [setData]);
  const AnimatedPill = ({ distraction, isSelected, onPress }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[styles.pillButton, { backgroundColor: isSelected ? colors.primary : colors.backgroundCard, borderColor: isSelected ? colors.primary : colors.border, borderWidth: isSelected ? 2 : 1 }, isSelected && { shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 }]}
          onPress={onPress} onPressIn={() => (scale.value = withSpring(0.95))} onPressOut={() => (scale.value = withSpring(1))} activeOpacity={1}>
          <Text style={[styles.pillLabel, { color: isSelected ? colors.background : colors.text }]}>{distraction.label}</Text>
          <Text style={[styles.pillDescription, { color: isSelected ? colors.background : colors.textSecondary }]}>{distraction.description}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>Where does your time go?</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>The "Distraction of Choice"</Text>
      <View style={styles.pillsContainer}>
        {DISTRACTIONS.map((distraction) => <AnimatedPill key={distraction.id} distraction={distraction} isSelected={data.distraction === distraction.id} onPress={() => handleSelect(distraction.id)} />)}
      </View>
    </View>
  );
});

const Step2FocusWindow: React.FC<{ data: OnboardingData; setData: React.Dispatch<React.SetStateAction<OnboardingData>>; }> = React.memo(({ data, setData }) => {
  const handleSelect = useCallback((windowId: string) => setData((prevData) => ({ ...prevData, focusWindow: windowId })), [setData]);
  const AnimatedFocusCard = ({ window, isSelected, onPress }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const isWindowDark = window.id === 'night-owl';
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[styles.focusCard, { backgroundColor: isSelected ? window.bgColor : colors.backgroundCard, borderColor: isSelected ? colors.primary : colors.border, borderWidth: 1 }]}
          onPress={onPress} onPressIn={() => (scale.value = withSpring(0.95))} onPressOut={() => (scale.value = withSpring(1))} activeOpacity={1}>
          <View style={styles.cardContent}>
            <View style={styles.cardTextContainer}>
              <View style={styles.focusHeader}>
                {window.icon && <window.icon size={24} color={isSelected && isWindowDark ? '#FFFFFF' : (isSelected ? colors.primary : colors.textSecondary)} style={{ marginRight: 8 }} />}
                <Text style={[styles.focusLabel, { color: isSelected && isWindowDark ? '#FFFFFF' : colors.text }]}>{window.label}</Text>
              </View>
              <Text style={[styles.focusTime, { color: isSelected && isWindowDark ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]}>{window.time}</Text>
              <Text style={[styles.focusDescription, { color: isSelected && isWindowDark ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>{window.description}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>When is your brain actually awake?</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>The "Focus Window"</Text>
      <View style={styles.focusContainer}>
        {FOCUS_WINDOWS.map((window) => <AnimatedFocusCard key={window.id} window={window} isSelected={data.focusWindow === window.id} onPress={() => handleSelect(window.id)} />)}
      </View>
    </View>
  );
});

const AnimatedSelectableCard: React.FC<{ children: React.ReactNode; onPress: () => void; style?: any; }> = ({ children, onPress, style }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity style={style} onPress={onPress} onPressIn={() => (scale.value = withSpring(0.95))} onPressOut={() => (scale.value = withSpring(1))} activeOpacity={1}>{children}</TouchableOpacity>
    </Animated.View>
  );
};

const Step3WorkArchetype: React.FC<{ data: OnboardingData; setData: React.Dispatch<React.SetStateAction<OnboardingData>>; }> = React.memo(({ data, setData }) => {
  const handleSelect = useCallback((archetypeId: string) => setData((prevData) => ({ ...prevData, workArchetype: archetypeId })), [setData]);
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>How do you currently work?</Text>
      <View style={styles.cardsContainer}>
        {WORK_ARCHETYPES.map((archetype) => {
          const isSelected = data.workArchetype === archetype.id;
          return (
            <AnimatedSelectableCard
              key={archetype.id} onPress={() => handleSelect(archetype.id)}
              style={[styles.archetypeCard, { backgroundColor: colors.backgroundCard, borderColor: isSelected ? colors.primary : colors.border, shadowColor: colors.primary }, isSelected && styles.archetypeCardSelected]}>
              <Text style={styles.archetypeIcon}>{archetype.icon}</Text>
              <Text style={[styles.archetypeLabel, { color: colors.text }]}>{archetype.label}</Text>
              <Text style={[styles.archetypeDescription, { color: colors.textSecondary }]}>{archetype.description}</Text>
            </AnimatedSelectableCard>
          );
        })}
      </View>
    </View>
  );
});

const Step4ProductivityKillers: React.FC<{ data: OnboardingData; setData: React.Dispatch<React.SetStateAction<OnboardingData>>; }> = React.memo(({ data, setData }) => {
  const toggleKiller = useCallback((id: string) => {
    setData((prevData) => {
      const current = prevData.productivityKillers;
      if (current.includes(id)) {
        return { ...prevData, productivityKillers: current.filter((k) => k !== id) };
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return { ...prevData, productivityKillers: [...current, id] };
      }
    });
  }, [setData]);
  return (
    <View style={styles.frictionStepContainer}>
      <Text style={styles.frictionQuestionTitle}>What kills your productivity?</Text>
      <Text style={styles.frictionInstructions}>Select all that apply. This will help us personalize your experience.</Text>
      <View style={styles.frictionPillsContainer}>
        {FRICTION_TYPES.map((friction) => {
          const isSelected = data.productivityKillers.includes(friction.id);
          return (
            <FrictionPill key={friction.id} friction={friction} isSelected={isSelected} onPress={() => toggleKiller(friction.id)} />
          );
        })}
      </View>
    </View>
  );
});

const FrictionPill: React.FC<{ friction: { id: string; title: string; subtitle: string }; isSelected: boolean; onPress: () => void; }> = React.memo(({ friction, isSelected, onPress }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity onPress={onPress} onPressIn={() => (scale.value = withSpring(0.98))} onPressOut={() => (scale.value = withSpring(1))} activeOpacity={1} style={styles.frictionPillWrapper}>
      <Animated.View
        style={[styles.frictionPill, animatedStyle, { backgroundColor: isSelected ? colors.primary : colors.backgroundCard, borderWidth: isSelected ? 2 : 1, borderColor: isSelected ? colors.primary : colors.border, shadowColor: isSelected ? colors.primary : '#000', shadowOffset: { width: 0, height: isSelected ? 4 : 2 }, shadowOpacity: isSelected ? 0.2 : 0.05, shadowRadius: isSelected ? 8 : 4, elevation: isSelected ? 4 : 2 }]}>
        <Text style={[styles.frictionPillText, { color: isSelected ? colors.background : colors.text }]}>{friction.title}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20, paddingTop: 60, paddingBottom: 120, minHeight: '100%' },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 12, lineHeight: 40 },
  stepSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  cardsContainer: { marginTop: 12 },
  archetypeCard: { borderRadius: 20, padding: 16, borderWidth: 0, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, marginBottom: 12 },
  archetypeCardSelected: { borderWidth: 2, borderColor: '#F59E0B', shadowColor: '#F59E0B', shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 },
  archetypeIcon: { fontSize: 36, marginBottom: 8, textAlign: 'center' },
  archetypeLabel: { fontSize: 18, fontWeight: '700', marginBottom: 4, textAlign: 'center', lineHeight: 22 },
  archetypeDescription: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  frictionStepContainer: { flex: 1, backgroundColor: colors.background, paddingTop: 20, minHeight: '100%' },
  frictionQuestionTitle: { fontSize: 32, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 12, paddingHorizontal: 20, lineHeight: 40 },
  frictionInstructions: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20, lineHeight: 22 },
  frictionPillsContainer: { flex: 1, paddingHorizontal: 20, gap: 14, paddingBottom: 20 },
  frictionPillWrapper: { width: '100%' },
  frictionPill: { borderRadius: 20, paddingVertical: 18, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', minHeight: 60 },
  frictionPillText: { fontSize: 17, fontWeight: '600', textAlign: 'center', letterSpacing: 0.2 },
  navigationWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%' },
  navigation: { flexDirection: 'row', padding: 20, paddingTop: 20, alignItems: 'center' },
  backButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, borderWidth: 2 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  nextButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 28, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  nextButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  nextButtonDisabled: { backgroundColor: colors.border, opacity: 0.5 },
  progressContainer: { position: 'absolute', bottom: 100, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  progressDot: { height: 8, borderRadius: 4, transition: 'all 0.3s' },
  pillsContainer: { marginTop: 24 },
  pillButton: { borderRadius: 20, padding: 18, borderWidth: 0, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, minHeight: 90, marginBottom: 12 },
  pillLabel: { fontSize: 18, fontWeight: '700', marginBottom: 4, lineHeight: 24 },
  pillDescription: { fontSize: 14, lineHeight: 20 },
  focusContainer: { marginTop: 12 },
  focusCard: { borderRadius: 20, padding: 16, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, minHeight: 100, marginBottom: 12 },
  cardContent: { flex: 1, justifyContent: 'space-between', minHeight: '100%' },
  cardTextContainer: { flex: 1 },
  focusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  focusLabel: { fontSize: 18, fontWeight: '700', marginBottom: 4, lineHeight: 22 },
  focusTime: { fontSize: 16, fontWeight: '600', marginBottom: 4, lineHeight: 22 },
  focusDescription: { fontSize: 14, lineHeight: 18 },
});