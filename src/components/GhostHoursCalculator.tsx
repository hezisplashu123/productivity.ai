import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  interpolateColor,
  runOnJS,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Brain } from 'lucide-react-native';
import { FocusWave } from './FocusWave';
import { LinearSlider } from './LinearSlider';
import { NoiseLevelSlider } from './NoiseLevelSlider';
import { WorkdayCompression } from './WorkdayCompression';
import { lightColors as colors } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- THEMES ---
const darkTheme = {
  background: '#0A0A0F',
  backgroundLight: '#1A1A2E',
  card: 'rgba(255, 255, 255, 0.08)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  primary: '#F59E0B',
  primaryGlow: 'rgba(245, 158, 11, 0.4)',
  error: '#EF4444',
  success: '#10B981',
};

// --- TYPES ---
interface GhostHoursCalculatorProps {
  onComplete?: (ghostHours: number, workHours: number) => void;
  onSkip?: () => void;
}

type Screen = 'mystery' | 'villain' | 'input' | 'verdict';

// --- UTILS ---
const getDistractionFactor = (level: number): number => {
  if (level <= 0) return 0.1;
  if (level >= 100) return 0.4;
  if (level <= 50) {
    return 0.1 + (level / 50) * (0.25 - 0.1);
  }
  return 0.25 + ((level - 50) / 50) * (0.4 - 0.25);
};

// --- INTERACTIVE BRAIN CORE COMPONENT ---
const SwitchTaxInteractive: React.FC<{ onChaosReached: () => void }> = ({ onChaosReached }) => {
  const [tapCount, setTapCount] = useState(0);
  const [showCritical, setShowCritical] = useState(false);
  
  // Animation Values
  const pulse = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);
  const colorProgress = useSharedValue(0); // 0=Blue, 0.5=Purple, 1=Red
  const glitchOpacity = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  // Constants
  const CORE_SIZE = 160;
  const CHAOS_THRESHOLD = 6; 

  // Continuous Pulse Animation
  useEffect(() => {
    const duration = tapCount >= 3 ? 400 : 2000; 
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: duration, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: duration, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [tapCount]);

  const handleTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    // 1. Calculate Stress Level (0 to 1)
    const stress = Math.min(newCount / CHAOS_THRESHOLD, 1);
    colorProgress.value = withTiming(stress, { duration: 300 });

    // 2. Visual Particle Ripple
    rippleScale.value = 2.0; 
    rippleOpacity.value = 0.8;
    
    rippleScale.value = withTiming(0.8, { duration: 300, easing: Easing.out(Easing.quad) });
    rippleOpacity.value = withTiming(0, { duration: 300 });

    // 3. Shake Effect
    const intensity = newCount * 4; 
    shakeX.value = withSequence(
      withTiming(intensity, { duration: 40 }),
      withTiming(-intensity, { duration: 40 }),
      withTiming(intensity / 2, { duration: 40 }),
      withTiming(0, { duration: 40 })
    );
    shakeY.value = withSequence(
      withTiming(-intensity, { duration: 40 }),
      withTiming(intensity, { duration: 40 }),
      withTiming(-intensity / 2, { duration: 40 }),
      withTiming(0, { duration: 40 })
    );

    // 4. Haptics
    if (newCount < 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (newCount < CHAOS_THRESHOLD) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Glitch effect on chaos
      glitchOpacity.value = withSequence(
        withTiming(0.2, { duration: 50 }),
        withTiming(1, { duration: 50 }),
        withTiming(0.5, { duration: 50 }),
        withTiming(1, { duration: 100 })
      );
    }

    // 5. Check Thresholds
    if (newCount === CHAOS_THRESHOLD) {
      setShowCritical(true);
      onChaosReached();
    }
  };

  // Animated Styles
  const coreStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      ['rgba(0, 240, 255, 0.1)', 'rgba(168, 85, 247, 0.2)', 'rgba(239, 68, 68, 0.3)']
    );

    const borderColor = interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      ['#00F0FF', '#A855F7', '#EF4444']
    );

    const shadowColor = interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      ['#00F0FF', '#A855F7', '#EF4444']
    );

    return {
      transform: [
        { scale: pulse.value },
        { translateX: shakeX.value },
        { translateY: shakeY.value }
      ],
      opacity: glitchOpacity.value,
      backgroundColor,
      borderColor,
      shadowColor,
    };
  });

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
    borderColor: interpolateColor(
      colorProgress.value,
      [0, 0.5, 1],
      ['#00F0FF', '#A855F7', '#EF4444']
    ),
  }));

  const getBrainColor = () => {
    if (tapCount >= CHAOS_THRESHOLD) return '#EF4444'; // Red
    if (tapCount >= 3) return '#A855F7'; // Purple
    return '#00F0FF'; // Neon Blue
  };

  return (
    <View style={styles.interactiveContainer}>
      <Pressable onPress={handleTap} style={styles.touchArea}>
        
        <View style={styles.statusContainer}>
          {showCritical ? (
            <MotiView
              from={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring' }}
            >
              <Text style={styles.criticalText}>SYSTEM CRITICAL</Text>
              <Text style={styles.criticalSubtext}>4.5 Hours Lost</Text>
            </MotiView>
          ) : (
            <Text style={styles.promptText}>
              {tapCount === 0 ? "Tap to add a distraction" : 
               tapCount < 3 ? "Keep tapping..." : "System unstable..."}
            </Text>
          )}
        </View>

        <View style={styles.coreWrapper}>
          <Animated.View style={[styles.rippleRing, rippleStyle]} />
          <Animated.View style={[styles.brainContainer, coreStyle]}>
            <Brain size={80} color={getBrainColor()} strokeWidth={1.5} />
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
};

// --- MAIN CALCULATOR COMPONENT ---
export const GhostHoursCalculator: React.FC<GhostHoursCalculatorProps> = ({
  onComplete,
  onSkip,
}) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('mystery');
  const [workHours, setWorkHours] = useState(8.0);
  const [distractionLevel, setDistractionLevel] = useState<number>(50);
  const [ghostHours, setGhostHours] = useState(0);

  const calculateGhostHours = useCallback((hours: number, level: number) => {
    const factor = getDistractionFactor(level);
    return hours * factor;
  }, []);

  const handleCalculate = useCallback(() => {
    try {
      const calculated = calculateGhostHours(workHours, distractionLevel);
      setGhostHours(isFinite(calculated) && calculated >= 0 ? calculated : 0);
      setTimeout(() => {
        setCurrentScreen('verdict');
      }, 100);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Calculation Error', error);
      setGhostHours(0);
      setCurrentScreen('verdict');
    }
  }, [workHours, distractionLevel, calculateGhostHours]);

  const handleReclaim = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete?.(ghostHours, workHours);
  }, [ghostHours, workHours, onComplete]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeAreaContent} edges={[]}>
        <View style={styles.content}>
          {currentScreen === 'mystery' && (
            <Screen1Mystery onNext={() => setCurrentScreen('villain')} onSkip={onSkip} />
          )}
          {currentScreen === 'villain' && (
            <Screen2Villain onNext={() => setCurrentScreen('input')} onSkip={onSkip} />
          )}
          {currentScreen === 'input' && (
            <Screen3Input
              workHours={workHours}
              setWorkHours={setWorkHours}
              distractionLevel={distractionLevel}
              setDistractionLevel={setDistractionLevel}
              onCalculate={handleCalculate}
              onSkip={onSkip}
            />
          )}
          {currentScreen === 'verdict' && (
            <Screen4Verdict
              ghostHours={ghostHours}
              workHours={workHours}
              onReclaim={handleReclaim}
              onComplete={onComplete}
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

// --- SCREENS ---
const Screen1Mystery: React.FC<{ onNext: () => void; onSkip?: () => void }> = ({ onNext }) => {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 600 }}
      style={styles.screen}
    >
      <View style={styles.chartContainer}>
        <WorkdayCompression height={250} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.mysteryTitle}>
          Imagine if you could finish an 8-hour workday in just 4 hours... without rushing.
        </Text>
        <Text style={styles.mysterySubtext}>Most people think it's impossible. Science disagrees.</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onNext();
        }}>
          <Text style={styles.buttonText}>How?</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
};

const Screen2Villain: React.FC<{ onNext: () => void; onSkip?: () => void }> = ({ onNext }) => {
  const [canProceed, setCanProceed] = useState(false);
  const handleChaos = () => setCanProceed(true);

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 600 }}
      style={styles.screen}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <SwitchTaxInteractive onChaosReached={handleChaos} />
      </View>
      <View style={styles.textContainerInteractive}>
        <Text style={styles.villainTitle}>The Switch Tax</Text>
        <Text style={styles.villainSubtext}>
          Every notification and tab switch fractures your focus.
          At 10+ interruptions, your brain enters a "critical state" of cognitive debt.
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        {canProceed ? (
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} style={{ width: '100%', alignItems: 'center' }}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNext();
            }}>
              <Text style={styles.buttonText}>Calculate My Loss</Text>
            </TouchableOpacity>
          </MotiView>
        ) : (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.hintContainer}>
            <Text style={styles.hintText}>Tap the brain to add distractions...</Text>
          </MotiView>
        )}
      </View>
    </MotiView>
  );
};

const Screen3Input: React.FC<{
  workHours: number;
  setWorkHours: (hours: number) => void;
  distractionLevel: number;
  setDistractionLevel: (level: number) => void;
  onCalculate: () => void;
  onSkip?: () => void;
}> = ({ workHours, setWorkHours, distractionLevel, setDistractionLevel, onCalculate }) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600 }}
      style={styles.screen}
    >
      <View style={styles.inputContainer}>
        <Text style={styles.inputTitle}>How many hours are you typically 'at your desk'?</Text>
        <Text style={styles.hoursDisplay}>{workHours.toFixed(1)} hours</Text>
        <LinearSlider
          value={(workHours - 4) / 8}
          onValueChange={(normalizedValue) => {
            const hours = Math.max(4, Math.min(12, 4 + normalizedValue * 8));
            const snappedHours = Math.round(hours * 2) / 2;
            setWorkHours(snappedHours);
          }}
          leftLabel="4h"
          rightLabel="12h"
        />
        <Text style={styles.inputSubtitle}>How noisy is your world?</Text>
        <FocusWave distractionLevel={distractionLevel} />
        <NoiseLevelSlider
          value={distractionLevel / 100}
          onValueChange={(normalizedValue) => {
            setDistractionLevel(Math.round(normalizedValue * 100));
          }}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={onCalculate}>
          <Text style={styles.buttonText}>Analyze</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
};

// --- SCREEN 4: THE VERDICT ---
const Screen4Verdict: React.FC<{
  ghostHours: number;
  workHours: number;
  onReclaim: () => void;
  onComplete?: (ghostHours: number, workHours: number) => void;
}> = ({ ghostHours, workHours, onReclaim, onComplete }) => {
  const [step, setStep] = useState<'results' | 'transition'>('results');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const contentOpacity = useSharedValue(1);
  const numberTranslateY = useSharedValue(0);
  const numberColor = useSharedValue(0); 
  const backgroundColorProgress = useSharedValue(0);
  const counterValue = useSharedValue(0);
  const ghostTimePulseOpacity = useSharedValue(0.8);

  const [displayValue, setDisplayValue] = useState('0.0');
  const [actualWorkDisplayValue, setActualWorkDisplayValue] = useState('0.0');
  const [ghostTimeDisplayValue, setGhostTimeDisplayValue] = useState('0.0');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    counterValue.value = withTiming(ghostHours, { duration: 2000 });
    ghostTimePulseOpacity.value = withRepeat(withTiming(1, { duration: 1500 }), -1, true);

    const interval = setInterval(() => {
      if (isMountedRef.current) {
        setDisplayValue(counterValue.value.toFixed(1));
        const progress = Math.min(1, counterValue.value / Math.max(ghostHours, 0.1));
        const actual = Math.max(0, workHours - ghostHours) * progress;
        const ghost = ghostHours * progress;
        setActualWorkDisplayValue(actual.toFixed(1));
        setGhostTimeDisplayValue(ghost.toFixed(1));
      }
    }, 16);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [ghostHours]);

  const handleReclaimPress = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setStep('transition');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    contentOpacity.value = withTiming(0, { duration: 300 });

    const ANIMATION_DURATION = 1000;
    const START_DELAY = 200;

    backgroundColorProgress.value = withDelay(START_DELAY, withTiming(1, { duration: ANIMATION_DURATION }));
    numberColor.value = withDelay(START_DELAY, withTiming(1, { duration: ANIMATION_DURATION }));

    numberTranslateY.value = withDelay(START_DELAY, withTiming(-SCREEN_HEIGHT, {
      duration: ANIMATION_DURATION,
      easing: Easing.in(Easing.cubic), 
    }, (finished) => {
      if (finished && onComplete) runOnJS(onComplete)(ghostHours, workHours);
    }));
  }, [isTransitioning]);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(backgroundColorProgress.value, [0, 1], ['#000000', '#FFFFFF']),
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
  
  const numberTextColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(numberColor.value, [0, 1], ['#FFA500', '#1A1A1A']),
  }));

  const transitionStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: numberTranslateY.value }]
  }));

  const actualWorkBarStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, counterValue.value / Math.max(ghostHours, 0.1));
    const percentage = ((Math.max(0, workHours - ghostHours) / workHours) * 100) * progress;
    return { width: `${percentage}%` };
  });

  const ghostTimeBarStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, counterValue.value / Math.max(ghostHours, 0.1));
    const percentage = ((ghostHours / workHours) * 100) * progress;
    return { width: `${percentage}%`, opacity: ghostTimePulseOpacity.value };
  });

  return (
    <Animated.View style={[styles.screen, backgroundAnimatedStyle, step === 'transition' && styles.screenLies]}>
      {step === 'results' && (
        <Animated.View style={[styles.resultContainer, contentAnimatedStyle]}>
          <Text style={styles.verdictTitle}>You are losing</Text>
          <View style={styles.numberContainer}>
            <Animated.Text style={styles.ghostHoursNumber}>{displayValue}</Animated.Text>
          </View>
          <Text style={styles.verdictSubtext}>every day to Switching.</Text>
          
          <View style={styles.barsContainer}>
            <View style={styles.barWrapper}>
              <View style={styles.barHeader}>
                <Text style={styles.barLabel}>Actual Work</Text>
                <Text style={[styles.barValue, styles.actualWorkValue]}>{actualWorkDisplayValue} h</Text>
              </View>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, styles.actualWorkBarFill, actualWorkBarStyle]} />
              </View>
            </View>
            <View style={styles.barWrapper}>
              <View style={styles.barHeader}>
                <Text style={styles.barLabel}>Ghost Time</Text>
                <Text style={[styles.barValue, styles.ghostTimeValue]}>{ghostTimeDisplayValue} h</Text>
              </View>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, styles.ghostTimeBarFill, ghostTimeBarStyle]} />
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {step === 'results' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleReclaimPress} disabled={isTransitioning}>
            <Text style={styles.buttonText}>Reclaim My {ghostHours.toFixed(1)} Hours</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'transition' && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.transitionNumberContainer, transitionStyle]}>
          <Animated.Text style={[styles.ghostHoursNumber, numberTextColorStyle]}>{displayValue}</Animated.Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: darkTheme.background },
  safeAreaContent: { flex: 1, backgroundColor: darkTheme.background },
  content: { flex: 1, backgroundColor: darkTheme.background },
  screen: { flex: 1, padding: 24, paddingBottom: 120, justifyContent: 'flex-start' },
  screenLies: { padding: 0, justifyContent: 'center', alignItems: 'center' },
  
  interactiveContainer: { alignItems: 'center', justifyContent: 'center', width: '100%', height: 350 },
  touchArea: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  statusContainer: { position: 'absolute', top: 0, alignItems: 'center', width: '100%', zIndex: 10 },
  promptText: { color: darkTheme.textSecondary, fontSize: 16, fontWeight: '500', textAlign: 'center' },
  criticalText: { color: darkTheme.error, fontSize: 24, fontWeight: '800', letterSpacing: 2, textShadowColor: 'rgba(239, 68, 68, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  criticalSubtext: { color: darkTheme.text, fontSize: 16, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  coreWrapper: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  brainContainer: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 4, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 20 },
  rippleRing: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 2, zIndex: 0 },

  textContainer: { alignItems: 'center', position: 'absolute', bottom: 140, left: 0, right: 0, paddingHorizontal: 24 },
  textContainerInteractive: { alignItems: 'center', position: 'absolute', bottom: 140, left: 0, right: 0, paddingHorizontal: 24 },
  chartContainer: { width: '100%', marginTop: 180, paddingHorizontal: 20 },
  mysteryTitle: { fontSize: 32, fontWeight: '700', color: darkTheme.text, textAlign: 'center', lineHeight: 42, marginBottom: 16 },
  mysterySubtext: { fontSize: 18, color: darkTheme.textSecondary, textAlign: 'center', lineHeight: 26 },
  villainTitle: { fontSize: 32, fontWeight: '700', color: darkTheme.text, textAlign: 'center', marginBottom: 16 },
  villainSubtext: { fontSize: 18, color: darkTheme.textSecondary, textAlign: 'center', lineHeight: 26 },
  
  buttonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { width: '100%', backgroundColor: darkTheme.primary, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', shadowColor: darkTheme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  buttonText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  hintContainer: { width: '100%', alignItems: 'center', paddingVertical: 20 },
  hintText: { fontSize: 16, color: darkTheme.textSecondary, opacity: 0.6, textAlign: 'center' },

  // Updated Input Screen Styles
  inputContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingBottom: 50, // Reduced gap to button
    paddingTop: 60, // Shifts content lower
  },
  inputTitle: { 
    fontSize: 22, 
    fontWeight: '600', 
    color: darkTheme.text, 
    textAlign: 'center', 
    marginBottom: 8,
    marginTop: 20 
  },
  hoursDisplay: { 
    fontSize: 42, 
    fontWeight: '700', 
    color: darkTheme.primary, 
    marginBottom: 20 // Spacing between number and slider
  },
  inputSubtitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: darkTheme.text, 
    marginTop: 10, // Tighter gap between sections
    marginBottom: 0
  },

  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  verdictTitle: { fontSize: 28, fontWeight: '700', color: darkTheme.text, marginBottom: 20 },
  numberContainer: { alignItems: 'center', justifyContent: 'center' },
  ghostHoursNumber: { fontSize: 96, fontWeight: '800', color: darkTheme.primary, marginBottom: 16 },
  verdictSubtext: { fontSize: 20, color: darkTheme.textSecondary, marginBottom: 24 },
  barsContainer: { width: '100%', marginTop: 32, gap: 20 },
  barWrapper: { width: '100%', marginBottom: 8 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  barLabel: { fontSize: 16, fontWeight: '600', color: darkTheme.text },
  barValue: { fontSize: 18, fontWeight: '700' },
  actualWorkValue: { color: '#10B981' },
  ghostTimeValue: { color: '#EF4444' },
  barTrack: { height: 56, backgroundColor: darkTheme.card, borderRadius: 16, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 16, position: 'absolute', left: 0, top: 0 },
  actualWorkBarFill: { backgroundColor: '#10B981' },
  ghostTimeBarFill: { backgroundColor: '#EF4444' },
  transitionNumberContainer: { justifyContent: 'center', alignItems: 'center', zIndex: 999 },
});