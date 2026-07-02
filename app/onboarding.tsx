import React, { useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Check, MessageCircle, Sparkles, X, ArrowRight, Hand, CornerDownLeft, CornerDownRight, RotateCcw, Layers, Users } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Easing, Extrapolate, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming, FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { storage } from '../src/utils/storage';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';
import { Theme } from '../src/constants/colors';
import { typography } from '../src/constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const AGE_RANGES = ["18-21", "22-25", "26-29", "30-39", "40+"];

const TUTORIAL_STEPS = [
  { id: 'tutorial-left', question: 'What is a movie you could watch over and over again?', guidance: "Don't like a question?\nSwipe left to skip.", expectedAction: 'left' as const },
  { id: 'tutorial-right', question: 'What is your favorite season of the year?', guidance: 'Fits the vibe?\nSwipe right to answer.', expectedAction: 'right' as const },
  { id: 'tutorial-tap', question: 'What is your favorite season of the year?', guidance: 'Swiped too fast?\nTap the card to undo.', expectedAction: 'tap' as const },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, theme } = useApp();
  const styles = getStyles(theme);
  
  // Phase 0: Intro, Phase 1: Age, Phase 2: Demo, Phase 3: Done
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  
  const [stepIndex, setStepIndex] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [showHint, setShowHint] = useState(false);
  
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningRef = useRef(false);

  const cardScale = useSharedValue(0.9);
  const dragX = useSharedValue(0);
  const idlePullX = useSharedValue(0);
  const isDragging = useSharedValue(0);
  const fingerOpacity = useSharedValue(0);
  const fingerX = useSharedValue(0);
  const fingerScale = useSharedValue(1);
  const guidanceOpacity = useSharedValue(1);

  const activeStep = useMemo(() => TUTORIAL_STEPS[stepIndex], [stepIndex]);
  const expectedAction = activeStep.expectedAction;
  
  useEffect(() => {
    if (phase === 2) {
      setTypedChars(0);
      guidanceOpacity.value = 0;
      guidanceOpacity.value = withTiming(1, { duration: 300 });

      const fullText = TUTORIAL_STEPS[stepIndex].guidance;
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setTypedChars(count);
        if (count >= fullText.length) clearInterval(interval);
      }, 35);
      
      return () => clearInterval(interval);
    }
  }, [phase, stepIndex]);

  const startIdleHint = (action: 'left' | 'right' | 'tap') => {
    cancelAnimation(idlePullX);
    if (action === 'tap') return; 
    const target = action === 'right' ? 14 : -14;
    idlePullX.value = withRepeat(withTiming(target, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true);
  };

  const clearHintTimer = () => {
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
  };

  const resetHintTimer = () => {
    clearHintTimer();
    setShowHint(false);
    hintTimeoutRef.current = setTimeout(() => { setShowHint(true); }, 2500); 
  };

  useEffect(() => {
    if (phase === 2) {
      startIdleHint(expectedAction);
      resetHintTimer();
    }
    return () => clearHintTimer();
  }, [phase, stepIndex]);

  useEffect(() => {
    if (showHint && phase === 2) {
      if (expectedAction === 'tap') {
        fingerX.value = 0; fingerScale.value = 1;
        fingerOpacity.value = withRepeat(withSequence(withTiming(0.8, { duration: 200 }), withTiming(0, { duration: 200 }), withTiming(0.8, { duration: 200 }), withTiming(0, { duration: 1000 })), -1);
        fingerScale.value = withRepeat(withSequence(withTiming(0.8, { duration: 200, easing: Easing.out(Easing.cubic) }), withTiming(1, { duration: 200 }), withTiming(0.8, { duration: 200, easing: Easing.out(Easing.cubic) }), withTiming(1, { duration: 1000 })), -1);
      } else {
        const targetX = expectedAction === 'right' ? 120 : -120;
        fingerX.value = 0; fingerScale.value = 1;
        fingerOpacity.value = withRepeat(withSequence(withTiming(0.8, { duration: 300 }), withTiming(0.8, { duration: 800 }), withTiming(0, { duration: 300 }), withTiming(0, { duration: 600 })), -1);
        fingerX.value = withRepeat(withSequence(withTiming(0, { duration: 300 }), withTiming(targetX, { duration: 800, easing: Easing.out(Easing.cubic) }), withTiming(targetX, { duration: 300 }), withTiming(0, { duration: 0 }), withTiming(0, { duration: 600 })), -1);
      }
    } else {
      cancelAnimation(fingerOpacity); cancelAnimation(fingerX); cancelAnimation(fingerScale);
      fingerOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [showHint, expectedAction, phase]);

  const handleAgeSelect = async (age: string) => {
    Haptics.selectionAsync();
    setSelectedAge(age);
    await storage.setAgeRange(age);
    
    // Fire and forget backend update
    if (user?.id) {
      apiService.ensureProfile(user.id, undefined, age).catch(() => {});
    }

    // Move to Demo
    setPhase(2);
    cardScale.value = withSpring(1, { damping: 20, stiffness: 80 });
  };

  const moveToNextStep = () => {
    if (stepIndex === 0) { 
      setStepIndex(1); 
      resetStateForNextCard(); 
    } 
    else if (stepIndex === 1) { 
      setStepIndex(2); 
      resetStateForNextCard(); 
    } 
    else if (stepIndex === 2) { 
      setPhase(3); // Jump to done
      cancelAnimation(idlePullX); 
      setShowHint(false); 
    }
  };

  const resetStateForNextCard = () => {
    dragX.value = 0; 
    isDragging.value = 0; 
    cardScale.value = 0.92; 
    cardScale.value = withSpring(1, { damping: 24, stiffness: 85 }); 
    isTransitioningRef.current = false;
    resetHintTimer();
  };

  const handleFinish = async () => {
    await storage.setSwipeTutorialComplete(true);
    router.replace('/home');
  };

  const triggerUndoSequence = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setTimeout(() => {
      moveToNextStep();
    }, 1200);
  };

  const panGesture = Gesture.Pan().enabled(phase === 2)
    .onBegin(() => {
      isDragging.value = 1; 
      cancelAnimation(idlePullX); 
      runOnJS(setShowHint)(false);
      runOnJS(clearHintTimer)();
    })
    .onUpdate((event) => {
      dragX.value = expectedAction === 'tap' ? event.translationX * 0.15 : event.translationX;
    })
    .onEnd((e) => {
      if (expectedAction === 'tap') {
        dragX.value = withSpring(0, { damping: 20, stiffness: 200 }); 
        isDragging.value = 0;
        runOnJS(startIdleHint)(expectedAction); 
        runOnJS(resetHintTimer)();
        return;
      }
      
      const passedThreshold = Math.abs(dragX.value) > SWIPE_THRESHOLD || Math.abs(e.velocityX) > 600;
      const direction = dragX.value > 0 ? 'right' : 'left';
      
      if (passedThreshold && direction === expectedAction) {
        dragX.value = withTiming(direction === 'right' ? SCREEN_WIDTH * 1.2 : -SCREEN_WIDTH * 1.2, { duration: 300, easing: Easing.out(Easing.cubic) });
        cardScale.value = withTiming(0.8, { duration: 200 }, (isFinished) => { if (isFinished) runOnJS(moveToNextStep)(); });
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
      cardScale.value = 0.8; 
      cardScale.value = withSpring(1, { damping: 20, stiffness: 200 });
      runOnJS(triggerUndoSequence)();
    });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const guidanceAnimatedStyle = useAnimatedStyle(() => ({ opacity: guidanceOpacity.value }));
  const cardAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dragX.value + idlePullX.value * (1 - isDragging.value) }, { rotate: `${interpolate(dragX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-8, 0, 8])}deg` }, { scale: cardScale.value }] }));
  const swipeHintAnimatedStyle = useAnimatedStyle(() => ({ opacity: fingerOpacity.value, transform: [{ translateX: fingerX.value }, { scale: fingerScale.value }] }));
  
  // Left = Skip, Right = Answer
  const skipRippleStyle = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(dragX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD], [0.01, 8], Extrapolate.CLAMP) }], opacity: interpolate(dragX.value, [0, -SWIPE_THRESHOLD * 0.2], [0, 1], Extrapolate.CLAMP) }));
  const keepRippleStyle = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(dragX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD], [0.01, 8], Extrapolate.CLAMP) }], opacity: interpolate(dragX.value, [0, SWIPE_THRESHOLD * 0.2], [0, 1], Extrapolate.CLAMP) }));
  const skipIconStyle = useAnimatedStyle(() => ({ opacity: interpolate(dragX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD * 0.8], [0, 1], Extrapolate.CLAMP), transform: [{ scale: interpolate(dragX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD], [0.5, 1.1], Extrapolate.CLAMP) }] }));
  const keepIconStyle = useAnimatedStyle(() => ({ opacity: interpolate(dragX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD * 0.8], [0, 1], Extrapolate.CLAMP), transform: [{ scale: interpolate(dragX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD], [0.5, 1.1], Extrapolate.CLAMP) }] }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* SEGMENTED PROGRESS BAR */}
      <View style={styles.progressContainer}>
        {[0, 1, 2, 3].map((step) => (
          <View key={step} style={[styles.progressSegment, step <= phase && styles.progressSegmentActive]} />
        ))}
      </View>

      {phase === 0 && (
        <Animated.View style={styles.introContainer} entering={FadeIn} exiting={FadeOut}>
          <Text style={styles.scienceQuote}>"Psychological studies show that escalating, reciprocal vulnerability creates profound interpersonal closeness in just 45 minutes."</Text>
          <View style={styles.bigRulesContainer}>
            <View style={styles.bigRuleCard}>
              <View style={styles.bigRuleIcon}><MessageCircle size={28} color={theme.primary} /></View>
              <Text style={styles.bigRuleTitle}>The Circle Rule</Text>
              <Text style={styles.bigRuleDesc}>Read aloud. Answer it yourself first. Pass to the left.</Text>
            </View>
            <View style={styles.bigRuleCard}>
              <View style={styles.bigRuleIcon}><Layers size={28} color={theme.primary} /></View>
              <Text style={styles.bigRuleTitle}>The Iceberg Effect</Text>
              <Text style={styles.bigRuleDesc}>The deck starts light. As you swipe right to answer, the AI pulls you gradually deeper.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setPhase(1)} activeOpacity={0.85}><Text style={styles.primaryButtonText}>Next</Text><ArrowRight size={20} color={theme.background} /></TouchableOpacity>
        </Animated.View>
      )}

      {phase === 1 && (
        <Animated.View style={styles.introContainer} entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={styles.bigIconContainer}><Users size={48} color={theme.primary} /></View>
            <Text style={styles.doneTitle}>One quick thing...</Text>
            <Text style={styles.doneSubtitle}>To generate the most accurate questions, the AI needs to know your life stage.</Text>
            
            <View style={styles.ageGrid}>
              {AGE_RANGES.map((age) => (
                <TouchableOpacity 
                  key={age} 
                  style={[styles.ageButton, selectedAge === age && styles.ageButtonActive]} 
                  onPress={() => handleAgeSelect(age)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.ageText, selectedAge === age && styles.ageTextActive]}>{age}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {phase === 2 && (
        <Animated.View style={styles.demoWrapper} entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)}>
          <View style={styles.demoTopBar}><Text style={styles.eyebrow}>How to play</Text></View>
          
          <View style={styles.demoCenterStage}>
            <Animated.Text style={[styles.guidance, guidanceAnimatedStyle]}>
              {activeStep.guidance.slice(0, typedChars)}
            </Animated.Text>
            
            <Animated.View style={[styles.swipeHintContainer, swipeHintAnimatedStyle]} pointerEvents="none">
              <View style={styles.fingerCircle} />
              <Hand size={40} color="#ffffff" strokeWidth={2} style={styles.fingerIcon} />
            </Animated.View>
            
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.card, cardAnimatedStyle]}>
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}><Sparkles size={16} color={theme.primary} /><Text style={styles.cardTopText}>Demo Question</Text></View>
                  <Text style={styles.cardQuestion}>{activeStep.question}</Text>
                </View>
                <Animated.View style={[styles.ripple, { backgroundColor: theme.error }, skipRippleStyle]} />
                <Animated.View style={[styles.ripple, { backgroundColor: theme.success }, keepRippleStyle]} />
                <Animated.View style={[styles.actionOverlay, skipIconStyle]}><X size={72} color="#ffffff" strokeWidth={3} /><Text style={styles.actionLabel}>Skip</Text></Animated.View>
                <Animated.View style={[styles.actionOverlay, keepIconStyle]}><Check size={72} color="#ffffff" strokeWidth={3} /><Text style={styles.actionLabel}>Answer</Text></Animated.View>
              </Animated.View>
            </GestureDetector>
            
            <Text style={styles.skipRuleText}>Swipe right if you liked the question.</Text>
          </View>
          
          <View style={styles.bottomSection} pointerEvents="none">
            <View style={styles.hintContainer}>
              <View style={styles.hintPill}><CornerDownLeft size={16} color={theme.error} /><Text style={[styles.hintTitle, { color: theme.error }]}>Skip</Text></View>
              <View style={styles.hintPill}><RotateCcw size={16} color={theme.textSecondary} /><Text style={[styles.hintTitle, { color: theme.textSecondary }]}>Undo</Text></View>
              <View style={styles.hintPill}><Text style={[styles.hintTitle, { color: theme.success }]}>Answer</Text><CornerDownRight size={16} color={theme.success} /></View>
            </View>
          </View>
        </Animated.View>
      )}

      {phase === 3 && (
        <Animated.View style={styles.doneContainer} entering={FadeIn.duration(600)}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={styles.bigIconContainer}><Sparkles size={48} color={theme.primary} /></View>
            <Text style={styles.doneTitle}>You're ready.</Text>
            <Text style={styles.doneSubtitle}>Pick a vibe and let the AI find the perfect questions for your group.</Text>
          </View>
          <TouchableOpacity style={[styles.primaryButton, { width: '100%', marginBottom: 16 }]} onPress={handleFinish} activeOpacity={0.85}><Text style={styles.primaryButtonText}>View Topics</Text><ArrowRight size={20} color={theme.background} /></TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 24 },
  progressContainer: { flexDirection: 'row', gap: 6, marginBottom: 16, paddingTop: 8 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: theme.border },
  progressSegmentActive: { backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8 },
  introContainer: { flex: 1, justifyContent: 'center', paddingBottom: 20 },
  bigIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.backgroundElevated, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: theme.border },
  scienceQuote: { fontFamily: typography.heading, fontSize: 24, color: theme.text, lineHeight: 34, marginBottom: 48, fontStyle: 'italic' },
  bigRulesContainer: { gap: 16, marginBottom: 48 },
  bigRuleCard: { backgroundColor: theme.backgroundCard, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.border },
  bigRuleIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.backgroundElevated, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: theme.border },
  bigRuleTitle: { fontFamily: typography.heading, fontSize: 22, color: theme.text, marginBottom: 8 },
  bigRuleDesc: { fontFamily: typography.body, fontSize: 16, color: theme.textSecondary, lineHeight: 24 },
  
  // Age Selection Styles
  ageGrid: { marginTop: 40, gap: 12 },
  ageButton: { backgroundColor: theme.backgroundCard, borderWidth: 1, borderColor: theme.border, paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  ageButtonActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  ageText: { fontFamily: typography.bodyBold, fontSize: 18, color: theme.text },
  ageTextActive: { color: theme.background },

  demoWrapper: { flex: 1, marginHorizontal: -24 }, 
  demoTopBar: { paddingTop: 20, alignItems: 'center' },
  eyebrow: { fontFamily: typography.bodyBold, fontSize: 12, color: theme.primary, letterSpacing: 2, textTransform: 'uppercase' },
  
  demoCenterStage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  guidance: { fontFamily: typography.heading, position: 'absolute', top: 30, color: theme.text, fontSize: 22, lineHeight: 30, textAlign: 'center', width: SCREEN_WIDTH * 0.9, paddingHorizontal: 20, zIndex: 10 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 18, borderRadius: 999, gap: 8, shadowColor: theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  primaryButtonText: { fontFamily: typography.bodyBold, color: theme.background, fontSize: 17 },
  
  swipeHintContainer: { position: 'absolute', zIndex: 20, alignItems: 'center', justifyContent: 'center' },
  fingerCircle: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.6)' },
  fingerIcon: { marginTop: 40, marginLeft: 20 },
  
  card: { width: SCREEN_WIDTH - 40, height: 440, borderRadius: 32, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.backgroundCard, overflow: 'hidden', position: 'absolute', zIndex: 5 },
  cardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTopText: { fontFamily: typography.bodyBold, color: theme.primary, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  cardQuestion: { fontFamily: typography.body, color: theme.text, fontSize: 26, lineHeight: 36, textAlign: 'center' },
  
  ripple: { position: 'absolute', top: '50%', left: '50%', width: 80, height: 80, marginTop: -40, marginLeft: -40, borderRadius: 40, zIndex: 2 },
  actionOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 3 },
  actionLabel: { fontFamily: typography.heading, color: '#ffffff', fontSize: 18, textAlign: 'center', marginTop: 16 },
  
  skipRuleText: { fontFamily: typography.body, position: 'absolute', top: '50%', marginTop: 240, fontSize: 14, color: theme.textMuted, textAlign: 'center' },
  
  bottomSection: { paddingBottom: 32, alignItems: 'center' },
  hintContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  hintPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.backgroundElevated, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, gap: 8, borderWidth: 1, borderColor: theme.border },
  hintTitle: { fontFamily: typography.bodyBold, fontSize: 14 },
  
  doneContainer: { flex: 1, paddingBottom: 20 },
  doneTitle: { fontFamily: typography.heading, fontSize: 40, color: theme.text, marginBottom: 16 },
  doneSubtitle: { fontFamily: typography.body, fontSize: 18, color: theme.textSecondary, lineHeight: 26 },
});