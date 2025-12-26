import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { ArrowRight, Check, Sunrise, Coffee, Moon } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import { SunBackground } from './SunBackground';

export interface HabitProfileData {
  cognitiveTrigger: string | null;
  distraction: string | null;
  focusWindow: string | null;
}

interface HabitProfilerProps {
  onComplete: (data: HabitProfileData) => void;
}

const COGNITIVE_TRIGGERS = [
  {
    id: 'time-lie',
    title: 'The "Time" Lie',
    description: 'I\'ll start at exactly 3:00 PM.',
    subtitle: 'It is currently 3:02 PM',
  },
  {
    id: 'energy-lie',
    title: 'The "Energy" Lie',
    description: 'I\'m too tired. I\'ll do it tomorrow.',
    subtitle: 'You will not wake up early.',
  },
  {
    id: 'prep-lie',
    title: 'The "Prep" Lie',
    description: 'I just need to organize first.',
    subtitle: 'Productive Procrastination',
  },
  {
    id: 'pressure-lie',
    title: 'The "Pressure" Lie',
    description: 'I work better under pressure.',
    subtitle: 'Deadline Adrenaline Junkie',
  },
];

const DISTRACTIONS = [
  { id: 'doomscrolling', label: 'Doomscrolling', description: 'TikTok, Reels, and Shorts loops.' },
  { id: 'wikipedia-hole', label: 'The Wikipedia Hole', description: 'Researching random topics instead of working.' },
  { id: 'gaming', label: 'Gaming', description: 'Just one more match.' },
  { id: 'nap-roulette', label: 'Nap Roulette', description: 'I\'ll just close my eyes for 15 minutes.' },
  { id: 'side-quests', label: 'Side Quests', description: 'Cleaning the house to avoid one email.' },
];

const FOCUS_WINDOWS = [
  {
    id: 'early-bird',
    label: 'Early Bird',
    time: '6 AM - 10 AM',
    description: 'Before the world wakes up.',
    bgColor: '#FFF9E6', // Soft Yellow
    icon: Sunrise,
  },
  {
    id: 'mid-day',
    label: 'Mid-Day Sprinter',
    time: '11 AM - 3 PM',
    description: 'Caffeinated and locked in.',
    bgColor: '#FFE5CC', // Current background (orange)
    icon: Coffee,
  },
  {
    id: 'night-owl',
    label: 'Night Owl',
    time: '9 PM - 2 AM',
    description: 'Peace, quiet, and focus.',
    bgColor: '#1E3A5F', // Dark Blue
    icon: Moon,
  },
];

export const HabitProfiler: React.FC<HabitProfilerProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<HabitProfileData>({
    cognitiveTrigger: null,
    distraction: null,
    focusWindow: null,
  });

  const slideOffset = useSharedValue(0);
  const nextButtonPulse = useSharedValue(1);
  const isInitialMount = React.useRef(true);

  // Handle slide-in animation when step changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Slide in from right
    slideOffset.value = 300;
    slideOffset.value = withSpring(0, { damping: 20, stiffness: 100 });
  }, [currentStep]);

  const updateStepForward = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const updateStepBackward = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentStep < 2) {
      // Slide out left, then update step (useEffect will handle slide-in)
      slideOffset.value = withTiming(-300, { duration: 300 }, (finished) => {
        'worklet';
        if (finished) {
          runOnJS(updateStepForward)();
        }
      });
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      // Slide out right, then update step (useEffect will handle slide-in)
      slideOffset.value = withTiming(300, { duration: 300 }, (finished) => {
        'worklet';
        if (finished) {
          runOnJS(updateStepBackward)();
        }
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slideOffset.value }],
    };
  });

  const nextButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: nextButtonPulse.value }],
    };
  });

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return data.cognitiveTrigger !== null;
      case 1:
        return data.distraction !== null;
      case 2:
        return data.focusWindow !== null;
      default:
        return false;
    }
  };

  const handleSelection = (step: number, value: string) => {
    if (step === 0) {
      setData((prev) => ({ ...prev, cognitiveTrigger: value }));
    } else if (step === 1) {
      setData((prev) => ({ ...prev, distraction: value }));
    } else if (step === 2) {
      setData((prev) => ({ ...prev, focusWindow: value }));
    }

    // Pulse the next button when selection is made (after state update)
    setTimeout(() => {
      if (canProceed()) {
        nextButtonPulse.value = withSpring(1.1, { damping: 10 }, () => {
          nextButtonPulse.value = withSpring(1, { damping: 10 });
        });
      }
    }, 100);
  };

  const getBackgroundColor = () => {
    if (currentStep === 2 && data.focusWindow) {
      const window = FOCUS_WINDOWS.find((w) => w.id === data.focusWindow);
      return window?.bgColor || colors.background;
    }
    return colors.background;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1CognitiveTriggers data={data} onSelect={(value) => handleSelection(0, value)} />;
      case 1:
        return <Step2Distractions data={data} onSelect={(value) => handleSelection(1, value)} />;
      case 2:
        return <Step3FocusWindow data={data} onSelect={(value) => handleSelection(2, value)} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getBackgroundColor() }]} edges={['top', 'bottom']}>
      <StatusBar style={currentStep === 2 && data.focusWindow === 'night-owl' ? 'light' : 'dark'} />
      {currentStep !== 2 && <SunBackground />}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
      >
        <Animated.View style={[animatedStyle, { flex: 1 }]}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.border }]}
            onPress={handleBack}
          >
            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Back</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {canProceed() ? (
          <Animated.View style={nextButtonStyle}>
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: colors.primary }]}
              onPress={handleNext}
            >
              <Text style={[styles.nextButtonText, { color: colors.background, marginRight: 8 }]}>
                {currentStep === 2 ? 'Complete' : 'Next'}
              </Text>
              <ArrowRight size={20} color={colors.background} />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.border }, styles.nextButtonDisabled]}
            disabled
          >
            <Text style={[styles.nextButtonText, { color: colors.textSecondary, marginRight: 8 }]}>
              Next
            </Text>
            <ArrowRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress dots */}
      <View style={styles.progressContainer}>
        {[0, 1, 2].map((step) => (
          <View
            key={step}
            style={[
              styles.progressDot,
              {
                backgroundColor: step <= currentStep ? colors.primary : colors.border,
                width: step === currentStep ? 24 : 8,
                marginHorizontal: 4,
              },
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
};

// Step 1: Cognitive Triggers (2x2 Grid)
const Step1CognitiveTriggers: React.FC<{
  data: HabitProfileData;
  onSelect: (value: string) => void;
}> = ({ data, onSelect }) => {
  return (
    <View style={styles.stepContainer}>
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={[styles.stepTitle, { color: colors.text }]}>The "Lies We Tell Ourselves"</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Identify your mental block
        </Text>
      </MotiView>

      <View style={styles.gridContainer}>
        {COGNITIVE_TRIGGERS.map((trigger, index) => {
          const isSelected = data.cognitiveTrigger === trigger.id;
          return (
            <MotiView
              key={trigger.id}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400, delay: index * 100 }}
              style={{ marginBottom: 16, marginHorizontal: 8 }}
            >
              <TouchableOpacity
                style={[
                  styles.cognitiveCard,
                  {
                    backgroundColor: isSelected 
                      ? 'rgba(245, 158, 11, 0.08)' // Subtle orange background tint
                      : colors.backgroundCard,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1, // Solid orange border when selected
                  },
                ]}
                onPress={() => onSelect(trigger.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardTextContainer}>
                    <Text style={[styles.cognitiveTitle, { color: colors.text }]}>{trigger.title}</Text>
                    <Text style={[styles.cognitiveDescription, { color: colors.text }]}>{trigger.description}</Text>
                    <Text style={[styles.cognitiveSubtitle, { color: colors.textSecondary }]}>
                      {trigger.subtitle}
                    </Text>
                  </View>
                  <View style={styles.cardCTAContainer}>
                    <Text style={[styles.cardCTA, { color: isSelected ? colors.primary : colors.textSecondary }]}>
                      Select
                    </Text>
                    <ArrowRight 
                      size={20} 
                      color={isSelected ? colors.primary : colors.textSecondary} 
                    />
                  </View>
                </View>
                {isSelected && (
                  <View style={[styles.checkmarkContainer, { backgroundColor: colors.primary }]}>
                    <Check size={16} color={colors.background} />
                  </View>
                )}
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </View>
    </View>
  );
};

// Step 2: Distractions (Vertical Pills)
const Step2Distractions: React.FC<{
  data: HabitProfileData;
  onSelect: (value: string) => void;
}> = ({ data, onSelect }) => {
  return (
    <View style={styles.stepContainer}>
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={[styles.stepTitle, { color: colors.text }]}>Where does your time go?</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          The "Distraction of Choice"
        </Text>
      </MotiView>

      <View style={styles.pillsContainer}>
        {DISTRACTIONS.map((distraction, index) => {
          const isSelected = data.distraction === distraction.id;
          return (
            <MotiView
              key={distraction.id}
              from={{ opacity: 0, translateX: 20 }}
              animate={{ 
                opacity: 1, 
                translateX: isSelected ? 8 : 0, // Slide to the right when selected
              }}
              transition={{ type: 'spring', damping: 15, stiffness: 150 }}
              style={{ marginBottom: 12 }}
            >
                <TouchableOpacity
                  style={[
                    styles.pillButton,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.backgroundCard,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => onSelect(distraction.id)}
                  activeOpacity={0.8}
                >
                <View style={styles.cardContent}>
                  <View style={styles.cardTextContainer}>
                    <Text
                      style={[
                        styles.pillLabel,
                        { color: isSelected ? colors.background : colors.text },
                      ]}
                    >
                      {distraction.label}
                    </Text>
                    <Text
                      style={[
                        styles.pillDescription,
                        { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.textSecondary },
                      ]}
                    >
                      {distraction.description}
                    </Text>
                  </View>
                  <View style={styles.cardCTAContainer}>
                    <Text style={[styles.cardCTA, { color: isSelected ? colors.background : colors.textSecondary }]}>
                      Select
                    </Text>
                    <ArrowRight 
                      size={20} 
                      color={isSelected ? colors.background : colors.textSecondary} 
                    />
                  </View>
                </View>
                {isSelected && (
                  <View style={[styles.checkmarkContainer, { backgroundColor: colors.background }]}>
                    <Check size={16} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </View>
    </View>
  );
};

// Step 3: Focus Window (3 Time Blocks)
const Step3FocusWindow: React.FC<{
  data: HabitProfileData;
  onSelect: (value: string) => void;
}> = ({ data, onSelect }) => {
  const isDark = data.focusWindow === 'night-owl';
  return (
    <View style={styles.stepContainer}>
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
      >
        <Text style={[styles.stepTitle, { color: isDark ? '#FFFFFF' : colors.text }]}>
          When is your brain actually awake?
        </Text>
        <Text style={[styles.stepSubtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
          The "Focus Window"
        </Text>
      </MotiView>

      <View style={styles.focusContainer}>
        {FOCUS_WINDOWS.map((window, index) => {
          const isSelected = data.focusWindow === window.id;
          const isDark = window.id === 'night-owl';
          return (
            <MotiView
              key={window.id}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400, delay: index * 100 }}
              style={{ marginBottom: 20 }}
            >
              <TouchableOpacity
                style={[
                  styles.focusCard,
                  {
                    backgroundColor: isSelected ? window.bgColor : colors.backgroundCard,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => onSelect(window.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardContent}>
                  <View style={styles.cardTextContainer}>
                    <View style={styles.focusHeader}>
                      {window.icon && (
                        <window.icon 
                          size={24} 
                          color={isSelected && isDark ? '#FFFFFF' : (isSelected ? colors.primary : colors.textSecondary)} 
                          style={{ marginRight: 8 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.focusLabel,
                          {
                            color: isSelected && isDark ? '#FFFFFF' : colors.text,
                          },
                        ]}
                      >
                        {window.label}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.focusTime,
                        {
                          color: isSelected && isDark ? 'rgba(255,255,255,0.9)' : colors.textSecondary,
                        },
                      ]}
                    >
                      {window.time}
                    </Text>
                    <Text
                      style={[
                        styles.focusDescription,
                        {
                          color: isSelected && isDark ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
                        },
                      ]}
                    >
                      {window.description}
                    </Text>
                  </View>
                  <View style={styles.cardCTAContainer}>
                    <Text style={[
                      styles.cardCTA, 
                      { color: isSelected ? (isDark ? '#FFFFFF' : colors.primary) : colors.textSecondary }
                    ]}>
                      Select
                    </Text>
                    <ArrowRight 
                      size={20} 
                      color={isSelected ? (isDark ? '#FFFFFF' : colors.primary) : colors.textSecondary} 
                    />
                  </View>
                </View>
                {isSelected && (
                  <View style={[styles.checkmarkContainer, { backgroundColor: colors.primary }]}>
                    <Check size={16} color={colors.background} />
                  </View>
                )}
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    // Debug border - remove after fixing
    borderWidth: 4,
    borderColor: 'red',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 120,
    minHeight: '100%',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
  },
  stepSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cognitiveCard: {
    width: '47%',
    borderRadius: 20,
    padding: 18,
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 160,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  cardTextContainer: {
    flex: 1,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardCTAContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 'auto',
    paddingTop: 8,
  },
  cardCTA: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  cognitiveTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 24,
  },
  cognitiveDescription: {
    fontSize: 15,
    fontWeight: '400',
    marginBottom: 4,
    lineHeight: 20,
  },
  cognitiveSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
    opacity: 0.7, // Lighter gray
  },
  pillsContainer: {
    marginTop: 24,
  },
  pillButton: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 90,
  },
  pillLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 24,
  },
  pillDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  focusContainer: {
    marginTop: 24,
  },
  focusCard: {
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 120,
  },
  focusLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 24,
  },
  focusTime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 22,
  },
  focusDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'transparent',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
});

