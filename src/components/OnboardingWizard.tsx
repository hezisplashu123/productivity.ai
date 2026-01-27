import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { ArrowRight, Check, Briefcase, Flame, Zap, Brain, Smartphone, Gamepad2, BedDouble, Target, Activity, AlertTriangle, Anchor, Sunrise, Sun, CloudSun, Sunset, Moon, GraduationCap, PenTool, TrendingUp, Shield, Globe, Gem, ChevronsRight, Home, Layers } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';

// --- IDENTITIES ---
const IDENTITIES = [
  { 
    id: 'student', 
    label: 'Student', 
    description: 'Assignments, Exams, Studying, Research.', 
    icon: GraduationCap 
  },
  { 
    id: 'professional', 
    label: 'Professional', 
    description: '9-5 Career, Meetings, Admin, Corporate.', 
    icon: Briefcase 
  },
  { 
    id: 'entrepreneur', 
    label: 'Entrepreneur', 
    description: 'Business, Freelancing, Side Hustles.', 
    icon: TrendingUp 
  },
  { 
    id: 'maker', 
    label: 'Maker / Creative', 
    description: 'Building, Coding, Writing, Designing, Art.', 
    icon: PenTool 
  },
  { 
    id: 'personal', 
    label: 'Life Admin', 
    description: 'Chores, Errands, Finances, Home.', 
    icon: Home 
  },
];

const ARCHETYPES = [
  { id: 'architect', label: 'The Architect', description: 'I need a perfect plan before starting.', icon: Layers }, 
  { id: 'firefighter', label: 'The Firefighter', description: 'I only work when the deadline is scary.', icon: Flame },
  { id: 'sprinter', label: 'The Sprinter', description: 'I work in intense bursts, then crash.', icon: Zap },
  { id: 'deep_worker', label: 'The Deep Worker', description: 'I need long hours of total silence.', icon: Brain },
];

// --- VILLAINS ---
const VILLAINS = [
  { 
    id: 'doomscrolling', 
    label: 'The Scroll', 
    description: 'Getting sucked into social media loops.', 
    icon: Smartphone 
  },
  { 
    id: 'multitasking', 
    label: 'The Juggler', 
    description: 'Trying to do 3 things at once and finishing nothing.', 
    icon: Layers 
  },
  { 
    id: 'side_quests', 
    label: 'Side Quests', 
    description: 'Cleaning the room to avoid the real task.', 
    icon: Gamepad2 
  },
  { 
    id: 'rotting', 
    label: 'Brain Fog', 
    description: 'Feeling paralyzed and low energy.', 
    icon: BedDouble 
  },
];

const MENTAL_BLOCKS = [
  { id: 'perfectionism', label: 'Perfectionism', description: 'If it\'s not perfect, I won\'t start.', icon: Target },
  { id: 'overwhelm', label: 'Overwhelm', description: 'The project feels too massive.', icon: Activity },
  { id: 'procrastination', label: 'Resistance', description: 'I just don\'t feel like it yet.', icon: AlertTriangle },
  { id: 'boredom', label: 'Boredom', description: 'The task is dull and painful.', icon: Anchor },
];

const FOCUS_WINDOWS = [
  { id: 'early_morning', label: 'Early Morning', time: '5 AM - 9 AM', icon: Sunrise, skyColor: '#FFE4E1', textColor: '#1A1A1A' },
  { id: 'late_morning', label: 'Late Morning', time: '9 AM - 12 PM', icon: Sun, skyColor: '#E0F7FA', textColor: '#1A1A1A' },
  { id: 'afternoon', label: 'Afternoon', time: '1 PM - 5 PM', icon: CloudSun, skyColor: '#FFF8E1', textColor: '#1A1A1A' },
  { id: 'evening', label: 'Evening', time: '5 PM - 9 PM', icon: Sunset, skyColor: '#F3E5F5', textColor: '#1A1A1A' },
  { id: 'late_night', label: 'Late Night', time: '9 PM - 2 AM', icon: Moon, skyColor: '#1E293B', textColor: '#FFFFFF' },
];

const CORE_DRIVERS = [
  { 
    id: 'velocity', 
    label: 'Velocity', 
    description: 'I value Speed. I want to finish early and reclaim my time.', 
    icon: ChevronsRight 
  },
  { 
    id: 'mastery', 
    label: 'Mastery', 
    description: 'I value Quality. I want to do deep, excellent work.', 
    icon: Gem 
  },
  { 
    id: 'survival', 
    label: 'Survival', 
    description: 'I value Sanity. I am burnt out and just need to get by.', 
    icon: Shield 
  },
  { 
    id: 'impact', 
    label: 'Impact', 
    description: 'I value Leverage. I only want to do the high-ROI tasks.', 
    icon: Globe 
  },
];

export const OnboardingWizard = ({ onComplete }: any) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({ 
    identity: null,
    workArchetype: null, 
    frictionVillain: null, 
    mentalBlock: null, 
    focusWindow: null,
    coreDriver: null
  });
  
  const stepTransition = useSharedValue(0);

  useEffect(() => { stepTransition.value = 0; stepTransition.value = withSpring(1); }, [currentStep]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentStep < 5) setCurrentStep(currentStep + 1);
    else onComplete(data);
  };

  // --- UPDATED TITLES FOR CLARITY ---
  const steps = [
    { title: "Which profile best fits you?", data: IDENTITIES, key: 'identity' },
    { title: "What is your natural work style?", data: ARCHETYPES, key: 'workArchetype' },
    { title: "What is your biggest distraction?", data: VILLAINS, key: 'frictionVillain' },
    { title: "What holds you back the most?", data: MENTAL_BLOCKS, key: 'mentalBlock' },
    { title: "When are you most productive?", data: FOCUS_WINDOWS, key: 'focusWindow' },
    { title: "How should AI optimize your tasks?", data: CORE_DRIVERS, key: 'coreDriver' }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === 5;
  
  // @ts-ignore
  const canProceed = data[currentStepData.key] !== null;

  const PillCard = ({ item, isSelected, onPress }: any) => (
    <TouchableOpacity style={[styles.pillCard, isSelected && styles.selectedCard]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.pillIcon}><item.icon size={22} color={isSelected ? colors.primary : colors.textSecondary} /></View>
      <View style={{ flex: 1 }}><Text style={styles.pillLabel}>{item.label}</Text><Text style={styles.pillDesc}>{item.description}</Text></View>
      <View style={[styles.radio, isSelected && styles.radioActive]}>{isSelected && <Check size={12} color="#FFF" />}</View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          <View style={{ flex: 1 }}>
            {currentStepData.key !== 'focusWindow' ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {currentStepData.data.map((item: any) => (
                  <PillCard 
                    key={item.id} 
                    item={item} 
                    // @ts-ignore
                    isSelected={data[currentStepData.key] === item.id} 
                    // @ts-ignore
                    onPress={() => setData({ ...data, [currentStepData.key]: item.id })} 
                  />
                ))}
              </ScrollView>
            ) : (
              <View style={{ flex: 1, gap: 8 }}>
                {FOCUS_WINDOWS.map(item => (
                  <TouchableOpacity key={item.id} style={[styles.skyCard, { flex: 1, backgroundColor: data.focusWindow === item.id ? item.skyColor : '#F9FAFB' }]} onPress={() => setData({ ...data, focusWindow: item.id })}>
                    <item.icon size={24} color={data.focusWindow === item.id ? item.textColor : colors.textSecondary} />
                    <View style={{ flex: 1, marginLeft: 16 }}><Text style={[styles.pillLabel, { color: data.focusWindow === item.id ? item.textColor : colors.text }]}>{item.label}</Text><Text style={[styles.skyTime, { color: data.focusWindow === item.id ? item.textColor : colors.textSecondary }]}>{item.time}</Text></View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity style={[styles.nextBtn, !canProceed && { opacity: 0.5 }]} disabled={!canProceed} onPress={handleNext}>
            <Text style={styles.nextText}>{isLastStep ? 'Finish' : 'Next'}</Text>
            <ArrowRight size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  content: { flex: 1, padding: 24 },
  stepTitle: { fontSize: 28, fontWeight: '800', marginBottom: 24, color: colors.text },
  pillCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: 'transparent' },
  selectedCard: { backgroundColor: '#FFFBEB', borderColor: colors.primary },
  pillIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  pillLabel: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  pillDesc: { fontSize: 13, color: colors.textSecondary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center' },
  radioActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  skyCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderRadius: 16 },
  skyTime: { fontSize: 12, fontWeight: '600', opacity: 0.7 },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#EEE' },
  nextBtn: { backgroundColor: colors.primary, padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  nextText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});