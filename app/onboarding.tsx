import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Check, Flame, MessageCircle, Sparkles, X, ArrowRight, Users } from 'lucide-react-native';
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
  withSpring,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { colors } from '../src/constants/colors';
import { storage } from '../src/utils/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.24;

const TUTORIAL_STEPS = [
  {
    id: 'tutorial-right',
    question: 'What is your favorite season of the year?',
    guidance: "Don't like a question?\nSwipe right to skip.",
    expectedDirection: 'right' as const,
  },
  {
    id: 'tutorial-left',
    question: 'What is a movie you could watch over and over again?',
    guidance: 'Fits the vibe?\nSwipe left to answer.',
    expectedDirection: 'left' as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [hasStartedDemo, setHasStartedDemo] = useState(false);

  // Intro Animation Values
  const introProgress = useSharedValue(0); 
  const headerOpacity = useSharedValue(0);
  const categoryOpacity = useSharedValue(0);
  const categoryTranslateY = useSharedValue(20);
  const demoButtonOpacity = useSharedValue(0);
  
  // Card Values
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardTranslateY = useSharedValue(24);
  const dragX = useSharedValue(0);
  const idlePullX = useSharedValue(0);
  const isDragging = useSharedValue(0);
  
  // Guidance Text Values
  const guidanceOpacity = useSharedValue(0);
  const [typedChars, setTypedChars] = useState(0);

  const activeStep = useMemo(() => TUTORIAL_STEPS[stepIndex], [stepIndex]);
  const renderedGuidance = useMemo(
    () => activeStep.guidance.slice(0, typedChars),
    [activeStep.guidance, typedChars]
  );

  const expectedDirection = activeStep.expectedDirection;

  const startIdleHint = (direction: 'left' | 'right') => {
    cancelAnimation(idlePullX);
    const target = direction === 'right' ? 14 : -14;
    idlePullX.value = withRepeat(
      withTiming(target, {
        duration: 1800,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  };

  // Typing Effect
  useEffect(() => {
    setTypedChars(0);
    guidanceOpacity.value = 0;
    guidanceOpacity.value = withTiming(1, { duration: 360 });

    const textLen = activeStep.guidance.length;

    if (stepIndex > 0) {
      introProgress.value = 1;
      headerOpacity.value = 1;
      categoryOpacity.value = 1;
    }

    const timer = setInterval(() => {
      setTypedChars((prev) => {
        const next = prev + 1;
        
        if (next >= textLen) {
          clearInterval(timer);
          if (stepIndex === 0 && !hasStartedDemo) {
             demoButtonOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) });
          }
          if (stepIndex !== 0) {
             setTimeout(() => startIdleHint(expectedDirection), 300);
          }
          return textLen;
        }
        return next;
      });
    }, 45);

    return () => clearInterval(timer);
  }, [stepIndex, activeStep.guidance, hasStartedDemo, expectedDirection]);

  useEffect(() => {
    if (completed) {
      cancelAnimation(idlePullX);
    }
  }, [completed]);

  const handleStartDemo = () => {
    if (hasStartedDemo) return;
    setHasStartedDemo(true);
    
    demoButtonOpacity.value = withTiming(0, { duration: 300 });
    
    introProgress.value = withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) });
    headerOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    categoryOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    categoryTranslateY.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) });
    
    cardOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    cardScale.value = withSpring(1, { damping: 20, stiffness: 80 });
    cardTranslateY.value = withSpring(0, { damping: 20, stiffness: 80 });
    
    setTimeout(() => startIdleHint(expectedDirection), 1000);
  };

  const handleFinish = async () => {
    await storage.setSwipeTutorialComplete(true);
    router.replace('/home');
  };

  const moveToNextStep = () => {
    if (stepIndex === TUTORIAL_STEPS.length - 1) {
      cancelAnimation(idlePullX);
      idlePullX.value = 0;
      setCompleted(true);
      return;
    }
    
    dragX.value = 0;
    isDragging.value = 0;
    cardOpacity.value = 0;
    cardScale.value = 0.92;
    cardTranslateY.value = 20;

    setStepIndex((prev) => prev + 1);
    
    cardOpacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    cardScale.value = withSpring(1, { damping: 24, stiffness: 85 });
    cardTranslateY.value = withSpring(0, { damping: 26, stiffness: 80 });
  };

  const panGesture = Gesture.Pan()
    .enabled(!completed && hasStartedDemo)
    .onBegin(() => {
      isDragging.value = 1;
      cancelAnimation(idlePullX);
    })
    .onUpdate((event) => {
      dragX.value = event.translationX;
    })
    .onEnd(() => {
      const passedThreshold = Math.abs(dragX.value) > SWIPE_THRESHOLD;
      const direction = dragX.value > 0 ? 'right' : 'left';
      const matchesStep = direction === expectedDirection;

      if (passedThreshold && matchesStep) {
        const finalX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        dragX.value = withSpring(finalX, { damping: 25, stiffness: 60 });
        
        cardOpacity.value = withTiming(0, { duration: 450 });
        cardScale.value = withTiming(0.8, { duration: 450 }, (isFinished) => {
          if (isFinished) runOnJS(moveToNextStep)();
        });
        return;
      }
      
      dragX.value = withSpring(0, { damping: 26, stiffness: 78 });
      isDragging.value = 0;
      runOnJS(startIdleHint)(expectedDirection);
    });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const categoryAnimatedStyle = useAnimatedStyle(() => ({
    opacity: categoryOpacity.value,
    transform: [{ translateY: categoryTranslateY.value }],
  }));

  const demoButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: demoButtonOpacity.value,
      transform: [{ translateY: interpolate(demoButtonOpacity.value, [0, 1], [30, 0]) }],
    };
  });

  const guidanceAnimatedStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(introProgress.value, [0, 1], [34, 15]);
    const lineHeight = interpolate(introProgress.value, [0, 1], [42, 22]);
    const translateY = interpolate(introProgress.value, [0, 1], [SCREEN_HEIGHT * 0.22, 0]);
    
    return {
      opacity: guidanceOpacity.value,
      fontSize,
      lineHeight,
      transform: [{ translateY }],
    };
  });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateY: cardTranslateY.value },
      { translateX: dragX.value + idlePullX.value * (1 - isDragging.value) },
      { rotate: `${interpolate(dragX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-10, 0, 10])}deg` },
      { scale: cardScale.value },
    ],
  }));

  const skipRippleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(dragX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD], [0.01, 15], Extrapolate.CLAMP) }
    ],
    opacity: interpolate(dragX.value, [0, SWIPE_THRESHOLD * 0.2], [0, 1], Extrapolate.CLAMP),
  }));

  const keepRippleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(dragX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD], [0.01, 15], Extrapolate.CLAMP) }
    ],
    opacity: interpolate(dragX.value, [0, -SWIPE_THRESHOLD * 0.2], [0, 1], Extrapolate.CLAMP),
  }));

  const skipIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dragX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD * 0.8], [0, 1], Extrapolate.CLAMP),
    transform: [
      { scale: interpolate(dragX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD], [0.5, 1.2], Extrapolate.CLAMP) }
    ]
  }));

  const keepIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(dragX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD * 0.8], [0, 1], Extrapolate.CLAMP),
    transform: [
      { scale: interpolate(dragX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD], [0.5, 1.2], Extrapolate.CLAMP) }
    ]
  }));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <Text style={styles.eyebrow}>How to play</Text>
        <Text style={styles.title}>Swipe into better conversations</Text>
        <Text style={styles.subtitle}>
          Pass the phone around. The system learns the room's vibe and curates future questions based on your swipes.
        </Text>
      </Animated.View>

      <View style={styles.deck}>
        <Animated.View style={[styles.categoryReveal, categoryAnimatedStyle]}>
          <Sparkles size={16} color={colors.primary} />
          <Text style={styles.categoryRevealText}>Icebreakers</Text>
        </Animated.View>

        {!completed ? (
          <>
            <Animated.Text style={[styles.guidance, guidanceAnimatedStyle]}>
              {renderedGuidance}
            </Animated.Text>
            
            <Animated.View 
              style={[styles.demoButtonContainer, demoButtonAnimatedStyle]} 
              pointerEvents={hasStartedDemo ? 'none' : 'auto'}
            >
              <TouchableOpacity style={styles.demoButton} onPress={handleStartDemo} activeOpacity={0.85}>
                <Text style={styles.demoButtonText}>Take me to the demo</Text>
                <ArrowRight size={20} color={colors.background} />
              </TouchableOpacity>
            </Animated.View>

            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.card, cardAnimatedStyle]}>
                
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <MessageCircle size={16} color={colors.primary} />
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
          </>
        ) : (
          <Animated.View style={styles.done} entering={FadeIn.duration(600)}>
            <Text style={styles.doneTitle}>You're ready.</Text>
            
            <View style={styles.ruleBox}>
              <View style={styles.ruleIconWrap}>
                <Users size={22} color={colors.primary} />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>The Circle</Text>
                <Text style={styles.ruleText}>Swipe to find a question you like. Read it aloud, answer it first, then pass the phone around the room.</Text>
              </View>
            </View>

            <View style={styles.ruleBox}>
              <View style={styles.ruleIconWrap}>
                <Sparkles size={22} color={colors.primary} />
              </View>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleTitle}>Calibration Phase</Text>
                <Text style={styles.ruleText}>The first 3 swipes teach the game your group's exact vibe. After that, the system generates highly curated, personalized questions.</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      <Animated.View style={[{ width: '100%' }, headerAnimatedStyle]}>
        <TouchableOpacity
          style={[styles.cta, !completed && styles.ctaDisabled]}
          disabled={!completed}
          onPress={handleFinish}
          activeOpacity={0.85}
        >
          <View style={styles.ctaContent}>
            <Flame size={16} color={colors.background} />
            <Text style={styles.ctaText}>Go to dashboard</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  header: { paddingTop: 8, paddingBottom: 4 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  deck: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  categoryReveal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
  },
  categoryRevealText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  guidance: {
    color: colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    width: SCREEN_WIDTH * 0.9,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  demoButtonContainer: {
    position: 'absolute',
    top: '60%', 
    alignSelf: 'center',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  demoButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
  card: {
    width: SCREEN_WIDTH - 56,
    minHeight: 290,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.backgroundCard,
    overflow: 'hidden',
    position: 'absolute',
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
  done: { 
    width: '100%',
    height: 440, 
    justifyContent: 'center', 
  },
  doneTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: colors.text, 
    marginBottom: 32,
    textAlign: 'center' 
  },
  ruleBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundCard,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  ruleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  ruleText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { color: colors.background, fontSize: 17, fontWeight: '700' },
});