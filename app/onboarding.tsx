import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { colors } from '../src/constants/colors';
import { SwipableCardStack, SwipableCardData } from '../src/components/SwipableCardStack';
import { storage } from '../src/utils/storage';

const TUTORIAL_CARDS: SwipableCardData[] = [
  {
    id: 'tutorial-left',
    label: 'Swipe LEFT to answer',
    description: 'When a question lands—keep it. The deck leans into topics the room loves.',
    category: 'Tutorial',
  },
  {
    id: 'tutorial-right',
    label: 'Swipe RIGHT to skip',
    description: 'When the mood is off—pivot away. The AI shifts to a fresher lane.',
    category: 'Tutorial',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [leftDone, setLeftDone] = useState(false);
  const [rightDone, setRightDone] = useState(false);

  const cards = useMemo(() => {
    if (!leftDone) return [TUTORIAL_CARDS[0]];
    if (!rightDone) return [TUTORIAL_CARDS[1]];
    return [];
  }, [leftDone, rightDone]);

  const handleFinish = async () => {
    await storage.setSwipeTutorialComplete(true);
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.eyebrow}>How to play</Text>
        <Text style={styles.title}>One phone. One deck.</Text>
        <Text style={styles.subtitle}>
          Pass the device around. Complete both swipes to enter the game.
        </Text>
      </View>

      <View style={styles.deck}>
        {cards.length > 0 ? (
          <SwipableCardStack
            key={leftDone ? 'right' : 'left'}
            cards={cards}
            onSwipeLeft={() => {
              if (!leftDone) setLeftDone(true);
            }}
            onSwipeRight={() => {
              if (leftDone && !rightDone) setRightDone(true);
            }}
            leftLabel="Answer & Explore Depth"
            rightLabel="Skip, change topic, or avoid bad mood"
            emptyMessage=""
          />
        ) : (
          <View style={styles.done}>
            <Text style={styles.doneTitle}>Ready to deal</Text>
            <Text style={styles.doneText}>Pick a category and let the room guide the AI.</Text>
          </View>
        )}
      </View>

      <View style={styles.hints}>
        <View style={[styles.hint, leftDone && styles.hintActiveKeep]}>
          <ArrowLeft size={16} color={leftDone ? colors.swipeKeep : colors.textMuted} />
          <Text style={styles.hintText}>Swipe left</Text>
        </View>
        <View style={[styles.hint, rightDone && styles.hintActiveSkip]}>
          <ArrowRight size={16} color={rightDone ? colors.swipeSkip : colors.textMuted} />
          <Text style={styles.hintText}>Swipe right</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.cta, !(leftDone && rightDone) && styles.ctaDisabled]}
        disabled={!(leftDone && rightDone)}
        onPress={handleFinish}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>Choose a category</Text>
      </TouchableOpacity>
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
  deck: { flex: 1, justifyContent: 'center' },
  done: { height: 440, justifyContent: 'center', alignItems: 'center' },
  doneTitle: { fontSize: 26, fontWeight: '800', color: colors.text },
  doneText: { fontSize: 16, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  hints: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
  },
  hintActiveKeep: { borderColor: colors.swipeKeep, backgroundColor: colors.swipeKeepGlow },
  hintActiveSkip: { borderColor: colors.swipeSkip, backgroundColor: colors.swipeSkipGlow },
  hintText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: colors.background, fontSize: 17, fontWeight: '700' },
});
