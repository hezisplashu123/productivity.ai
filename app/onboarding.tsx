import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { lightColors as colors } from '../src/constants/colors';
import { SwipableCardStack, SwipableCardData } from '../src/components/SwipableCardStack';
import { storage } from '../src/utils/storage';

const TUTORIAL_CARDS: SwipableCardData[] = [
  {
    id: 'tutorial-left',
    label: 'Swipe LEFT to answer',
    description: 'When a question sparks depth, curiosity, or laughter—keep it in the mix.',
    category: 'Tutorial',
  },
  {
    id: 'tutorial-right',
    label: 'Swipe RIGHT to skip',
    description: 'When the vibe is off, pivot away. The AI learns what not to serve next.',
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

  const handleComplete = async () => {
    await storage.setSwipeTutorialComplete(true);
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.eyebrow}>Quick tutorial</Text>
        <Text style={styles.title}>Learn the swipe language</Text>
        <Text style={styles.subtitle}>
          Complete both gestures to enter the deck. Left keeps the energy; right changes the channel.
        </Text>
      </View>

      <View style={styles.deckArea}>
        {cards.length > 0 ? (
          <SwipableCardStack
            key={leftDone ? 'right-card' : 'left-card'}
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
          <View style={styles.doneBox}>
            <Text style={styles.doneTitle}>You are ready</Text>
            <Text style={styles.doneText}>The room is tuned. Time to deal real questions.</Text>
          </View>
        )}
      </View>

      <View style={styles.hints}>
        <View style={[styles.hintPill, leftDone && styles.hintDone]}>
          <ArrowLeft size={16} color={leftDone ? colors.success : colors.textSecondary} />
          <Text style={[styles.hintText, leftDone && styles.hintTextDone]}>Swipe left ✓</Text>
        </View>
        <View style={[styles.hintPill, rightDone && styles.hintDone]}>
          <ArrowRight size={16} color={rightDone ? colors.error : colors.textSecondary} />
          <Text style={[styles.hintText, rightDone && styles.hintTextDone]}>Swipe right ✓</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, !(leftDone && rightDone) && styles.continueDisabled]}
        onPress={handleComplete}
        disabled={!(leftDone && rightDone)}
        activeOpacity={0.85}
      >
        <Text style={styles.continueText}>Enter the conversation</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  header: { paddingTop: 12, paddingBottom: 8 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  deckArea: { flex: 1, justifyContent: 'center' },
  doneBox: {
    height: 420,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  doneTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
  doneText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  hints: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hintDone: { borderColor: colors.success, backgroundColor: '#ECFDF5' },
  hintText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  hintTextDone: { color: colors.text },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueDisabled: { opacity: 0.45 },
  continueText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
