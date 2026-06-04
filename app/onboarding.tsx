import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import { Check, Flame, MessageCircle, Sparkles, X, ArrowRight, Hand, CornerDownLeft, CornerDownRight, RotateCcw } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../src/constants/colors';
import { storage } from '../src/utils/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const TUTORIAL_STEPS = [
  {
    id: 'tutorial-right',
    question: 'What is your favorite season of the year?',
    guidance: "Don't like a question?\nSwipe right to skip.",
    expectedAction: 'right' as const,
  },
  {
    id: 'tutorial-left',
    question: 'What is a movie you could watch over and over again?',
    guidance: 'Fits the vibe?\nSwipe left to answer.',
    expectedAction: 'left' as const,
  },
  {
    id: 'tutorial-tap',
    question: 'What is your favorite season of the year?', // Same as the first to mimic undo
    guidance: 'Swiped too fast?\nTap the card to undo.',
    expectedAction: 'tap' as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  
  // App Phases: 0 = Intro, 1 = Pre-Demo, 2 = Active Demo, 2.5 = Demo Modal, 3 = Done
  const [phase, setPhase] = useState<0 | 1 | 2 | 2.5 | 3>(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isTypingStep, setIsTypingStep] = useState(-1);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation Values
  const demoProgress = useSharedValue(0); 
  const cardScale = useSharedValue(0.9);
  const dragX = useSharedValue(0);
  const idlePullX = useSharedValue(0);
  const isDragging = useSharedValue(0);
  const fingerOpacity = useSharedValue(0);
  const fingerX = useSharedValue(0);
  const fingerScale = useSharedValue(1);
  const guidanceOpacity = useSharedValue(0);
  
  const [typedChars, setTypedChars] = useState(0);

  const activeStep = useMemo(() => TUTORIAL_STEPS[stepIndex], [stepIndex]);
  const renderedGuidance = useMemo(
    () => activeStep.guidance.slice(0, typedChars),
    [activeStep.guidance, typedChars]
  );
  const expectedAction = activeStep.expectedAction;

  useFocusEffect(
    React.useCallback(() => {
      setPhase(0);
      setStepIndex(0);
      setShowHint(false);
      setIsTypingStep(-1);
      setTypedChars(0);
      demoProgress.value = 0;
      cardScale.value = 0.9;
      dragX.value = 0;
      idlePullX.value = 0;
      isDragging.value = 0;
      fingerOpacity.value = 0;
      fingerX.value = 0;
      fingerScale.value = 1;
      guidanceOpacity.value = 0;
    }, [])
  );

  // Bulletproof Typewriter Effect
  useEffect(() => {
    if ((phase === 1 || phase === 2) && stepIndex !== isTypingStep) {
      setIsTypingStep(stepIndex);
      setTypedChars(0);
      
      // Instantly hide old text, then fade in new text container
      guidanceOpacity.value = 0; 
      guidanceOpacity.value = withTiming(1, { duration: 300 }); 
      
      const textLen = TUTORIAL_STEPS[stepIndex].guidance.length;
      const timer = setInterval(() => {
        setTypedChars((prev) => {
          if (prev >= textLen) {
            clearInterval(timer);
            return textLen;
          }
          return prev + 1;
        });
      }, 35);
      return () => clearInterval(timer);
    }
  }, [phase, stepIndex, isTypingStep]);

  const startIdleHint = (action: 'left' | 'right' | 'tap') => {
    cancelAnimation(idlePullX);
    if (action === 'tap') return; // No pull for tap
    
    const target = action === 'right' ? 14 : -14;
    idlePullX.value = withRepeat(
      withTiming(target, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  };

  const resetHintTimer = () => {
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    setShowHint(false);
    hintTimeoutRef.current = setTimeout(() => {
      setShowHint(true);
    }, 3000); 
  };

  useEffect(() => {
    if (phase === 2) resetHintTimer();
    return () => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, [phase, stepIndex]);

  // Dynamic Visual Hint based on expected action
  useEffect(() => {
    if (showHint && phase === 2) {
      if (expectedAction === 'tap') {
        fingerX.value = 0;
        fingerScale.value = 1;
        
        fingerOpacity.value = withRepeat(
          withSequence(
            withTiming(0.8, { duration: 200 }),
            withTiming(0, { duration: 200 }),
            withTiming(0.8, { duration: 200 }),
            withTiming(0, { duration: 1000 })
          ),
          -1
        );
        fingerScale.value = withRepeat(
          withSequence(
            withTiming(0.8, { duration: 200, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 200 }),
            withTiming(0.8, { duration: 200, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 1000 })
          ),
          -1
        );
      } else {
        const targetX = expectedAction === 'right' ? 120 : -120;
        fingerX.value = 0;
        fingerScale.value = 1;
        
        fingerOpacity.value = withRepeat(
          withSequence(
            withTiming(0.8, { duration: 300 }),
            withTiming(0.8, { duration: 800 }),
            withTiming(0, { duration: 300 }),
            withTiming(0, { duration: 600 })
          ),
          -1
        );
        
        fingerX.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 300 }),
            withTiming(targetX, { duration: 800, easing: Easing.out(Easing.cubic) }),
            withTiming(targetX, { duration: 300 }),
            withTiming(0, { duration: 0 }),
            withTiming(0, { duration: 600 })
          ),
          -1
        );
      }
    } else {
      cancelAnimation(fingerOpacity);
      cancelAnimation(fingerX);
      cancelAnimation(fingerScale);
      fingerOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [showHint, expectedAction, phase]);

  const handleStartTutorial = () => {
    setPhase(1);
  };

  const handleStartDemo = () => {
    setPhase(2);
    demoProgress.value = withTiming(1, { duration: 800, easing: Easing.inOut(Easing.cubic) });
    cardScale.value = withSpring(1, { damping: 20, stiffness: 80 });
    setTimeout(() => startIdleHint(expectedAction), 1000);
  };

  const moveToNextStep = () => {
    if (stepIndex === 0) {
      // Swipe Right completed
      setStepIndex(1);
      resetStateForNextCard();
    } else if (stepIndex === 1) {
      // Swipe Left completed -> Modal
      setPhase(2.5);
      cancelAnimation(idlePullX);
      setShowHint(false);
    } else if (stepIndex === 2) {
      // Tap Undo completed
      setPhase(3);
      cancelAnimation(idlePullX);
      setShowHint(false);
    }
  };

  const resetStateForNextCard = () => {
    dragX.value = 0;
    isDragging.value = 0;
    cardScale.value = 0.92;
    cardScale.value = withSpring(1, { damping: 24, stiffness: 85 });
    resetHintTimer();
  };

  const finishDiscussionModal = () => {
    setPhase(2);
    setStepIndex(2); // Go to the Tap Undo step
    resetStateForNextCard();
  };

  const handleFinish = async () => {
    await storage.setSwipeTutorialComplete(true);
    router.replace('/home');
  };

  const panGesture = Gesture.Pan()
    .enabled(phase === 2)
    .onBegin(() => {
      isDragging.value = 1;
      cancelAnimation(idlePullX);
      runOnJS(setShowHint)(false);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    })
    .onUpdate((event) => {
      // If we are expecting a tap, add heavy resistance to swiping
      if (expectedAction === 'tap') {
        dragX.value = event.translationX * 0.15; 
      } else {
        dragX.value = event.translationX;
      }
    })
    .onEnd((e) => {
      if (expectedAction === 'tap') {
        // Snap back instantly
        dragX.value = withSpring(0, { damping: 20, stiffness: 200 });
        isDragging.value = 0;
        runOnJS(startIdleHint)(expectedAction);
        runOnJS(resetHintTimer)();
        return;
      }

      const absTranslation = Math.abs(dragX.value);
      const absVelocity = Math.abs(e.velocityX);
      const passedThreshold = absTranslation > SWIPE_THRESHOLD || absVelocity > 600;
      const direction = dragX.value > 0 ? 'right' : 'left';
      const matchesStep = direction === expectedAction;

      if (passedThreshold && matchesStep) {
        const finalX = direction === 'right' ? SCREEN_WIDTH * 1.2 : -SCREEN_WIDTH * 1.2;
        
        // Smooth exit
        dragX.value = withTiming(finalX, { duration: 300, easing: Easing.out(Easing.cubic) });
        cardScale.value = withTiming(0.8, { duration: 200 }, (isFinished) => {
          if (isFinished) runOnJS(moveToNextStep)();
        });
        return;
      }
      
      dragX.value = withSpring(0, { damping: 20, stiffness: 200 });
      isDragging.value = 0;
      runOnJS(startIdleHint)(expectedAction);
      runOnJS(resetHintTimer)();
    });

  const tapGesture = Gesture.Tap()
    .enabled(phase === 2 && expectedAction === 'tap')
    .maxDuration(250)
    .onEnd(() => {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      
      // Simulate the undo "pop-in" effect
      cardScale.value = 0.8;
      cardScale.value = withSpring(1, { damping: 20, stiffness: 200 });
      
      runOnJS(moveToNextStep)();
    });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const guidanceAnimatedStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(demoProgress.value, [0, 1], [36, 20]);
    const lineHeight = interpolate(demoProgress.value, [0, 1], [44, 28]);
    const translateY = interpolate(demoProgress.value, [0, 1], [0, -210]);
    return {
      opacity: guidanceOpacity.value,
      fontSize,
      lineHeight,
      transform: [{ translateY }],
    };
  });

  const demoButtonAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(demoProgress.value, [0, 0.5], [1, 0]);
    const translateY = interpolate(demoProgress.value, [0, 1], [110, 150]);
    return { opacity, transform: [{ translateY }] };
  });

  const hintsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: demoProgress.value,
    transform: [{ translateY: interpolate(demoProgress.value, [0, 1], [40, 0]) }],
  }));

  const ruleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: demoProgress.value,
    transform: [{ translateY: interpolate(demoProgress.value, [0, 1], [20, 0]) }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: demoProgress.value,
    transform: [
      { translateX: dragX.value + idlePullX.value * (1 - isDragging.value) },
      { translateY: interpolate(demoProgress.value, [0, 1], [60, 0]) },
      { rotate: `${interpolate(dragX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-8, 0, 8])}deg` },
      { scale: cardScale.value },
    ],
  }));

  const swipeHintAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fingerOpacity.value,
    transform: [
      { translateX: fingerX.value },
      { scale: fingerScale.value }
    ],
  }));

  const skipRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(dragX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD], [0.01, 8], Extrapolate.CLAMP) }],
    opacity: interpolate(dragX.value, [0, SWIPE_THRESHOLD * 0.2], [0, 1], Extrapolate.CLAMP),
  }));

  const keepRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(dragX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD], [0.01, 8], Extrapolate.CLAMP) }],
    opacity: interpolate(dragX.value, [0, -SWIPE_THRESHOLD * 0.2], [0, 1], Extrapolate.CLAMP),
  }));

  const skipIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dragX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD * 0.8], [0, 1], Extrapolate.CLAMP),
    transform: [{ scale: interpolate(dragX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD], [0.5, 1.1], Extrapolate.CLAMP) }]
  }));

  const keepIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dragX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD * 0.8], [0, 1], Extrapolate.CLAMP),
    transform: [{ scale: interpolate(dragX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD], [0.5, 1.1], Extrapolate.CLAMP) }]
  }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {phase === 0 && (
        <Animated.View style={styles.introContainer} entering={FadeIn} exiting={FadeOut}>
          <Text style={styles.scienceQuote}>
            "Psychological studies show that escalating, reciprocal vulnerability creates profound interpersonal closeness in just 45 minutes."
          </Text>

          <View style={styles.bigRulesContainer}>
            <View style={styles.bigRuleCard}>
              <View style={styles.bigRuleIcon}>
                <MessageCircle size={28} color={colors.primary} />
              </View>
              <Text style={styles.bigRuleTitle}>The Circle Rule</Text>
              <Text style={styles.bigRuleDesc}>Read aloud. Answer it yourself first. Pass to the left.</Text>
            </View>

            <View style={styles.bigRuleCard}>
              <View style={styles.bigRuleIcon}>
                <Flame size={28} color={colors.primary} />
              </View>
              <Text style={styles.bigRuleTitle}>The AI Adapts</Text>
              <Text style={styles.bigRuleDesc}>Swipe left to answer, right to skip. Tap the card to undo. The game learns your group's unique boundaries.</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleStartTutorial} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Show me how</Text>
            <ArrowRight size={20} color={colors.background} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {(phase === 1 || phase === 2) && (
        <View style={styles.demoWrapper}>
          
          <View style={styles.demoTopBar}>
            <Text style={styles.eyebrow}>How to play</Text>
          </View>

          <View style={styles.demoCenterStage}>
            
            <Animated.Text style={[styles.guidance, guidanceAnimatedStyle]}>
              {renderedGuidance}
            </Animated.Text>

            <Animated.View style={[styles.absoluteCenter, demoButtonAnimatedStyle]} pointerEvents={phase === 1 ? 'auto' : 'none'}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleStartDemo} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>Start the demo</Text>
                <ArrowRight size={20} color={colors.background} />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.swipeHintContainer, swipeHintAnimatedStyle]} pointerEvents="none">
              <View style={styles.fingerCircle} />
              <Hand size={40} color="#ffffff" strokeWidth={2} style={styles.fingerIcon} />
            </Animated.View>

            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.card, cardAnimatedStyle]}>
                
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <Sparkles size={16} color={colors.primary} />
                    <Text style={styles.cardTopText}>Demo Question</Text>
                  </View>
                  <Text style={styles.cardQuestion}>{activeStep.question}</Text>
                </View>

                <Animated.View style={[styles.ripple, styles.keepRipple, keepRippleStyle]} />
                <Animated.View style={[styles.ripple, styles.skipRipple, skipRippleStyle]} />

                <Animated.View style={[styles.actionOverlay, keepIconStyle]}>
                  <Check size={72} color="#ffffff" strokeWidth={3} />
                </Animated.View>
                <Animated.View style={[styles.actionOverlay, skipIconStyle]}>
                  <X size={72} color="#ffffff" strokeWidth={3} />
                </Animated.View>

              </Animated.View>
            </GestureDetector>

            <Animated.Text style={[styles.skipRuleText, ruleAnimatedStyle]}>
              If you don't have an answer, just skip it.
            </Animated.Text>
          </View>

          <Animated.View style={[styles.bottomSection, hintsAnimatedStyle]} pointerEvents="none">
            <View style={styles.hintContainer}>
              <View style={styles.hintPill}>
                <CornerDownLeft size={16} color="#10B981" />
                <Text style={[styles.hintTitle, { color: '#10B981' }]}>Answer</Text>
              </View>
              
              <View style={styles.hintPill}>
                <RotateCcw size={16} color={colors.textSecondary} />
                <Text style={[styles.hintTitle, { color: colors.textSecondary }]}>Undo</Text>
              </View>

              <View style={styles.hintPill}>
                <Text style={[styles.hintTitle, { color: '#EF4444' }]}>Skip</Text>
                <CornerDownRight size={16} color="#EF4444" />
              </View>
            </View>
          </Animated.View>

        </View>
      )}

      {phase === 2.5 && (
        <Animated.View 
          style={styles.discussionOverlay}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <View style={styles.discussionContent}>
            <Animated.View 
              entering={SlideInDown.duration(400).easing(Easing.out(Easing.cubic))} 
              exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.cubic))}
            >
              <View style={styles.discussionBadge}>
                <MessageCircle size={20} color={colors.primary} />
                <Text style={styles.discussionBadgeText}>Group Discussion</Text>
              </View>
              
              <Text style={styles.discussionQuestion}>{TUTORIAL_STEPS[1].question}</Text>
              
              <Text style={styles.discussionHint}>
                Pass the phone around. Let everyone answer before moving on.
              </Text>

              <TouchableOpacity 
                style={styles.nextButton}
                onPress={finishDiscussionModal}
                activeOpacity={0.8}
              >
                <Text style={styles.nextButtonText}>Got it, what's next?</Text>
                <ArrowRight size={20} color={colors.background} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      )}

      {phase === 3 && (
        <Animated.View style={styles.doneContainer} entering={FadeIn.duration(600)}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={styles.doneTitle}>You're ready.</Text>
            <Text style={styles.doneSubtitle}>Pick a category and let the AI find the perfect questions for your group.</Text>
          </View>

          <TouchableOpacity style={[styles.primaryButton, { width: '100%', marginBottom: 16 }]} onPress={handleFinish} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Go to categories</Text>
            <ArrowRight size={20} color={colors.background} />
          </TouchableOpacity>
        </Animated.View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  scienceQuote: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 34,
    marginBottom: 48,
    fontStyle: 'italic',
  },
  bigRulesContainer: {
    gap: 16,
    marginBottom: 48,
  },
  bigRuleCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bigRuleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bigRuleTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  bigRuleDesc: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  demoWrapper: { flex: 1 },
  demoTopBar: { paddingTop: 20, alignItems: 'center' },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  demoCenterStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidance: {
    position: 'absolute',
    color: colors.text,
    fontWeight: '800',
    textAlign: 'center',
    width: SCREEN_WIDTH * 0.9,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  absoluteCenter: {
    position: 'absolute',
    zIndex: 11,
  },
  
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 999,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: { color: colors.background, fontSize: 17, fontWeight: '800' },

  swipeHintContainer: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerCircle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  fingerIcon: {
    marginTop: 40,
    marginLeft: 20,
  },

  card: {
    width: SCREEN_WIDTH - 56,
    height: 320,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
    overflow: 'hidden',
    position: 'absolute',
    zIndex: 5,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTopText: {
    color: colors.primary,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  cardQuestion: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
  },
  ripple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    marginTop: -40,
    marginLeft: -40,
    borderRadius: 40,
    zIndex: 2,
  },
  keepRipple: { backgroundColor: '#10B981' },
  skipRipple: { backgroundColor: '#EF4444' },
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },

  skipRuleText: {
    position: 'absolute',
    top: '50%',
    marginTop: 180, 
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
  },

  bottomSection: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  hintContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '700',
  },

  discussionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
    zIndex: 100,
  },
  discussionContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  discussionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 8,
    marginBottom: 24,
  },
  discussionBadgeText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  discussionQuestion: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 42,
    marginBottom: 24,
  },
  discussionHint: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 20,
    gap: 12,
    marginTop: 40,
  },
  nextButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '800',
  },

  doneContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  doneTitle: { fontSize: 40, fontWeight: '800', color: colors.text, marginBottom: 16 },
  doneSubtitle: { fontSize: 18, color: colors.textSecondary, lineHeight: 26 },
});