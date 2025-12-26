import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolate,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { ScaleButton } from './ScaleButton';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Dark theme colors for scientific reveal
const darkTheme = {
  background: '#0A0A0F', // Deep midnight blue-black
  backgroundLight: '#1A1A2E',
  card: 'rgba(255, 255, 255, 0.08)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  primary: '#F59E0B', // Keep the gold accent
  primaryGlow: 'rgba(245, 158, 11, 0.4)',
  error: '#EF4444',
  success: '#10B981',
};

interface GhostHoursCalculatorProps {
  onComplete?: (ghostHours: number, workHours: number) => void;
  onSkip?: () => void;
}

type Screen = 'mystery' | 'villain' | 'input' | 'verdict';

const DISTRACTION_LEVELS = [
  {
    id: 'goldfish',
    label: 'Goldfish',
    description: 'Constant interruptions',
    factor: 0.4,
    emoji: '🐠',
  },
  {
    id: 'human',
    label: 'Human',
    description: 'Every 30 mins',
    factor: 0.25,
    emoji: '👤',
  },
  {
    id: 'monk',
    label: 'Monk',
    description: 'Rarely',
    factor: 0.1,
    emoji: '🧘',
  },
];

export const GhostHoursCalculator: React.FC<GhostHoursCalculatorProps> = ({
  onComplete,
  onSkip,
}) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('mystery');
  const [workHours, setWorkHours] = useState(8);
  const [distractionLevel, setDistractionLevel] = useState<string | null>(null);
  const [ghostHours, setGhostHours] = useState(0);

  // Calculate ghost hours
  const calculateGhostHours = useCallback((hours: number, level: string) => {
    const levelData = DISTRACTION_LEVELS.find((l) => l.id === level);
    if (!levelData) return 0;
    return hours * levelData.factor;
  }, []);

  const handleCalculate = useCallback(() => {
    if (!distractionLevel) return;
    const calculated = calculateGhostHours(workHours, distractionLevel);
    setGhostHours(calculated);
    setCurrentScreen('verdict');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [workHours, distractionLevel, calculateGhostHours]);

  const handleReclaim = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete?.(ghostHours, workHours);
  }, [ghostHours, workHours, onComplete]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />
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
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// Screen 1: The Mystery (The Hook)
const Screen1Mystery: React.FC<{ onNext: () => void; onSkip?: () => void }> = ({
  onNext,
  onSkip,
}) => {
  const pulseScale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: opacity.value,
  }));

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 600 }}
      style={styles.screen}
    >
      <Animated.View style={[styles.pulseContainer, pulseStyle]}>
        <View style={styles.pulseCircle} />
      </Animated.View>

      <View style={styles.textContainer}>
        <Text style={styles.mysteryTitle}>
          Imagine if you could finish an 8-hour workday in just 4 hours... without rushing.
        </Text>
        <Text style={styles.mysterySubtext}>Most people think it's impossible. Science disagrees.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <ScaleButton
          style={[styles.primaryButton, { backgroundColor: darkTheme.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNext();
          }}
          hapticType="impact"
        >
          <Text style={styles.buttonText}>How?</Text>
        </ScaleButton>
      </View>
    </MotiView>
  );
};

// Screen 2: The Villain (The Reveal)
const Screen2Villain: React.FC<{ onNext: () => void; onSkip?: () => void }> = ({
  onNext,
  onSkip,
}) => {
  const lineProgress = useSharedValue(0);
  const breakPoint = useSharedValue(0);
  const spiralRotation = useSharedValue(0);

  useEffect(() => {
    // Animate line forward
    lineProgress.value = withTiming(1, { duration: 1000 }, () => {
      // Break the line
      breakPoint.value = withTiming(1, { duration: 300 }, () => {
        // Spiral back
        spiralRotation.value = withRepeat(
          withTiming(360, { duration: 2000 }),
          -1,
          false
        );
      });
    });
  }, []);

  const lineStyle = useAnimatedStyle(() => ({
    width: `${lineProgress.value * 80}%`,
  }));

  const breakStyle = useAnimatedStyle(() => ({
    opacity: breakPoint.value,
    transform: [{ rotate: `${spiralRotation.value}deg` }],
  }));

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 600 }}
      style={styles.screen}
    >
      <View style={styles.animationContainer}>
        <View style={styles.lineContainer}>
          <Animated.View style={[styles.line, lineStyle]} />
          <Animated.View style={[styles.lineBreak, breakStyle]} />
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.villainTitle}>The enemy isn't laziness. It's the Switch Tax.</Text>
        <Text style={styles.villainSubtext}>
          Every notification, email, or tab switch costs your brain 23 minutes of focus. We call
          this 'Ghost Time'.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <ScaleButton
          style={[styles.primaryButton, { backgroundColor: darkTheme.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNext();
          }}
          hapticType="impact"
        >
          <Text style={styles.buttonText}>Calculate My Ghost Time</Text>
        </ScaleButton>
      </View>
    </MotiView>
  );
};

// Screen 3: The Input (The Data)
const Screen3Input: React.FC<{
  workHours: number;
  setWorkHours: (hours: number) => void;
  distractionLevel: string | null;
  setDistractionLevel: (level: string) => void;
  onCalculate: () => void;
  onSkip?: () => void;
}> = ({ workHours, setWorkHours, distractionLevel, setDistractionLevel, onCalculate, onSkip }) => {
  const sliderWidth = SCREEN_WIDTH - 80; // Account for padding
  const sliderPosition = useSharedValue((workHours - 4) / 8); // 4-12 range, normalized 0-1
  const lastHours = useSharedValue(workHours);

  // Sync slider position when workHours changes externally
  useEffect(() => {
    sliderPosition.value = withSpring((workHours - 4) / 8, { damping: 15, stiffness: 300 });
    lastHours.value = workHours;
  }, [workHours]);

  const updateHours = useCallback((hours: number) => {
    if (hours !== lastHours.value) {
      lastHours.value = hours;
      setWorkHours(hours);
      Haptics.selectionAsync();
    }
  }, [setWorkHours]);

  const handleTrackPress = useCallback((e: any) => {
    const { locationX } = e.nativeEvent;
    const newPosition = Math.max(0, Math.min(1, locationX / sliderWidth));
    sliderPosition.value = withSpring(newPosition, { damping: 15, stiffness: 300 });
    const hours = Math.round(4 + newPosition * 8);
    updateHours(hours);
  }, [sliderWidth, updateHours, sliderPosition]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Store initial position
    })
    .onUpdate((e) => {
      const startPosition = (workHours - 4) / 8;
      const delta = e.translationX / sliderWidth;
      const newPosition = Math.max(0, Math.min(1, startPosition + delta));
      sliderPosition.value = newPosition;
      const hours = Math.round(4 + newPosition * 8);
      runOnJS(updateHours)(hours);
    })
    .onEnd(() => {
      const hours = Math.round(4 + sliderPosition.value * 8);
      sliderPosition.value = withSpring((hours - 4) / 8, { damping: 15, stiffness: 300 });
    });

  const sliderStyle = useAnimatedStyle(() => {
    const thumbPosition = sliderPosition.value * (sliderWidth - 32);
    return {
      transform: [{ translateX: thumbPosition }],
    };
  });

  const trackFillStyle = useAnimatedStyle(() => ({
    width: `${sliderPosition.value * 100}%`,
  }));

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600 }}
      style={styles.screen}
    >
      <View style={styles.inputContainer}>
        <Text style={styles.inputTitle}>How many hours are you typically 'at your desk'?</Text>
        <Text style={styles.hoursDisplay}>{workHours} hours</Text>

        {/* Custom Slider */}
        <View style={styles.sliderContainer}>
          <TouchableOpacity 
            style={styles.sliderTrack}
            onPress={handleTrackPress}
            activeOpacity={1}
          >
            <Animated.View style={[styles.sliderTrackFill, trackFillStyle]} />
          </TouchableOpacity>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.sliderThumb, sliderStyle]}>
              <View style={styles.sliderThumbInner} />
            </Animated.View>
          </GestureDetector>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>4h</Text>
            <Text style={styles.sliderLabel}>12h</Text>
          </View>
        </View>

        <Text style={styles.inputSubtitle}>How often do you check your phone/Slack?</Text>

        <View style={styles.frequencyContainer}>
          {DISTRACTION_LEVELS.map((level) => {
            const isSelected = distractionLevel === level.id;
            return (
              <ScaleButton
                key={level.id}
                style={[
                  styles.frequencyCard,
                  isSelected && { borderColor: darkTheme.primary, borderWidth: 2 },
                ]}
                onPress={() => {
                  setDistractionLevel(level.id);
                  Haptics.selectionAsync();
                }}
                hapticType="selection"
              >
                <Text style={styles.frequencyEmoji}>{level.emoji}</Text>
                <Text style={[styles.frequencyLabel, isSelected && { color: darkTheme.primary }]}>
                  {level.label}
                </Text>
                <Text style={styles.frequencyDescription}>{level.description}</Text>
              </ScaleButton>
            );
          })}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <ScaleButton
          style={[
            styles.primaryButton,
            { backgroundColor: distractionLevel ? darkTheme.primary : darkTheme.card },
          ]}
          onPress={onCalculate}
          disabled={!distractionLevel}
          hapticType="notification"
        >
          <Text style={[styles.buttonText, !distractionLevel && { opacity: 0.5 }]}>Analyze</Text>
        </ScaleButton>
      </View>
    </MotiView>
  );
};

// Screen 4: The Verdict (The Number)
const Screen4Verdict: React.FC<{
  ghostHours: number;
  workHours: number;
  onReclaim: () => void;
}> = ({ ghostHours, workHours, onReclaim }) => {
  const counterValue = useSharedValue(0);
  const progressValue = useSharedValue(0);
  const barChartProgress = useSharedValue(0);
  const screenOpacity = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState('0.0');
  const [showProgress, setShowProgress] = useState(true);

  useEffect(() => {
    // Dim screen and show progress
    screenOpacity.value = withTiming(0.3, { duration: 500 });
    
    // Progress circle animation
    progressValue.value = withTiming(1, { duration: 2000 }, () => {
      runOnJS(setShowProgress)(false);
      // Counter animation
      counterValue.value = withTiming(ghostHours, { duration: 2000 });
      screenOpacity.value = withTiming(1, { duration: 500 });
      
      // Bar chart animation
      barChartProgress.value = withSpring(1, { damping: 15, stiffness: 100 });
    });
  }, [ghostHours]);

  useAnimatedReaction(
    () => counterValue.value,
    (value) => {
      runOnJS(setDisplayValue)(value.toFixed(1));
    }
  );

  const counterStyle = useAnimatedStyle(() => {
    return {
      opacity: counterValue.value > 0 ? 1 : 0,
    };
  });

  const progressCircleStyle = useAnimatedStyle(() => {
    const circumference = 2 * Math.PI * 60;
    const strokeDashoffset = circumference * (1 - progressValue.value);
    return {
      strokeDashoffset,
    };
  });

  const actualWorkBarStyle = useAnimatedStyle(() => ({
    width: `${(workHours - ghostHours) / workHours * 100 * barChartProgress.value}%`,
  }));

  const ghostTimeBarStyle = useAnimatedStyle(() => ({
    width: `${(ghostHours / workHours) * 100 * barChartProgress.value}%`,
  }));

  const actualHours = workHours - ghostHours;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 600 }}
      style={styles.screen}
    >
      <Animated.View style={[styles.overlay, { opacity: screenOpacity }]} />

      {/* Progress Circle */}
      {showProgress && (
        <View style={styles.progressContainer}>
          <Svg width={140} height={140}>
            <Circle
              cx={70}
              cy={70}
              r={60}
              fill="none"
              stroke={darkTheme.card}
              strokeWidth={4}
            />
            <AnimatedCircle
              cx={70}
              cy={70}
              r={60}
              fill="none"
              stroke={darkTheme.primary}
              strokeWidth={4}
              strokeDasharray={2 * Math.PI * 60}
              style={progressCircleStyle}
              strokeLinecap="round"
            />
          </Svg>
          <Text style={styles.progressText}>Analyzing Context Switching...</Text>
        </View>
      )}

      {/* Result Screen */}
      <Animated.View style={[styles.resultContainer, counterStyle]}>
        <Text style={styles.verdictTitle}>You are losing</Text>
        <Text style={styles.ghostHoursNumber}>
          {displayValue} Hours
        </Text>
        <Text style={styles.verdictSubtext}>
          every day to Switching.
        </Text>
        <Text style={styles.verdictDescription}>
          You aren't working {workHours} hours. You're working {actualHours.toFixed(1)} hours. The
          rest is smoke.
        </Text>

        {/* Bar Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartBar}>
            <Animated.View style={[styles.chartBarFill, styles.actualWorkBar, actualWorkBarStyle]} />
            <Text style={styles.chartLabel}>Actual Work</Text>
          </View>
          <View style={styles.chartBar}>
            <Animated.View style={[styles.chartBarFill, styles.ghostTimeBar, ghostTimeBarStyle]} />
            <Text style={styles.chartLabel}>Ghost Time</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <ScaleButton
          style={[styles.primaryButton, { backgroundColor: darkTheme.primary }]}
          onPress={onReclaim}
          hapticType="notification"
        >
          <Text style={styles.buttonText}>Reclaim my {ghostHours.toFixed(1)} hours</Text>
        </ScaleButton>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  content: {
    flex: 1,
  },
  screen: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: darkTheme.background,
  },
  // Screen 1 Styles
  pulseContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: darkTheme.primary,
    shadowColor: darkTheme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  // Screen 2 Styles
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  lineContainer: {
    width: '80%',
    height: 4,
    backgroundColor: darkTheme.card,
    borderRadius: 2,
    position: 'relative',
  },
  line: {
    height: '100%',
    backgroundColor: darkTheme.primary,
    borderRadius: 2,
  },
  lineBreak: {
    position: 'absolute',
    right: '20%',
    top: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: darkTheme.error,
  },
  // Text Styles
  textContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  mysteryTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: darkTheme.text,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 16,
  },
  mysterySubtext: {
    fontSize: 18,
    color: darkTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  villainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: darkTheme.text,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 16,
  },
  villainSubtext: {
    fontSize: 18,
    color: darkTheme.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  // Screen 3 Styles
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: darkTheme.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  hoursDisplay: {
    fontSize: 48,
    fontWeight: '700',
    color: darkTheme.primary,
    textAlign: 'center',
    marginBottom: 40,
  },
  sliderContainer: {
    marginBottom: 60,
    position: 'relative',
    height: 40,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 8,
    backgroundColor: darkTheme.card,
    borderRadius: 4,
    position: 'relative',
    width: '100%',
  },
  sliderTrackFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: darkTheme.primary,
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: -12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: darkTheme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: darkTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sliderThumbInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: darkTheme.text,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 14,
    color: darkTheme.textSecondary,
  },
  inputSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: darkTheme.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  frequencyContainer: {
    gap: 16,
  },
  frequencyCard: {
    backgroundColor: darkTheme.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frequencyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  frequencyLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: darkTheme.text,
    marginBottom: 8,
  },
  frequencyDescription: {
    fontSize: 16,
    color: darkTheme.textSecondary,
  },
  // Screen 4 Styles
  progressContainer: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -70 }, { translateY: -70 }],
    alignItems: 'center',
  },
  progressText: {
    marginTop: 16,
    fontSize: 16,
    color: darkTheme.textSecondary,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verdictTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: darkTheme.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  ghostHoursNumber: {
    fontSize: 96,
    fontWeight: '800',
    color: darkTheme.primary,
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: darkTheme.primaryGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  verdictSubtext: {
    fontSize: 20,
    color: darkTheme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  verdictDescription: {
    fontSize: 18,
    color: darkTheme.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  chartContainer: {
    width: '100%',
    gap: 16,
  },
  chartBar: {
    height: 60,
    backgroundColor: darkTheme.card,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 12,
  },
  actualWorkBar: {
    backgroundColor: darkTheme.success,
  },
  ghostTimeBar: {
    backgroundColor: darkTheme.error,
    opacity: 0.7,
  },
  chartLabel: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    fontSize: 16,
    fontWeight: '600',
    color: darkTheme.text,
  },
  // Button Styles
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: darkTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: darkTheme.text,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: darkTheme.textSecondary,
  },
});

