import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../src/constants/colors';
import { getCategoryById } from '../src/constants/categories';
import { SwipableCardStack, SwipableCardData } from '../src/components/SwipableCardStack';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';

type Prompt = { id: string; text: string; category: string };

const CONSECUTIVE_SKIP_PIVOT = 3;

export default function DeckScreen() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { user } = useApp();
  const category = getCategoryById(String(categoryId || ''));

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const consecutiveSkips = useRef(0);

  const profileId = user?.profileId;

  const loadNext = useCallback(
    async (forcePivot = false) => {
      if (!profileId) return;
      const result = await apiService.getNextPrompt(profileId, forcePivot);
      setPrompt(result.prompt);
    },
    [profileId]
  );

  useEffect(() => {
    if (!category) {
      router.replace('/home');
      return;
    }
    const init = async () => {
      try {
        await loadNext(false);
      } catch (e: any) {
        Alert.alert('Could not load card', e.message);
        router.back();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [category, loadNext, router]);

  const deckCards: SwipableCardData[] = useMemo(() => {
    if (!prompt) return [];
    return [{ id: prompt.id, label: prompt.text, category: prompt.category }];
  }, [prompt]);

  const handleSwipe = async (swipedLeft: boolean) => {
    if (!profileId || !prompt || busy) return;
    setBusy(true);
    const snapshot = prompt;
    setPrompt(null);

    try {
      await apiService.recordSwipe(profileId, snapshot.id, swipedLeft);

      if (swipedLeft) {
        consecutiveSkips.current = 0;
      } else {
        consecutiveSkips.current += 1;
      }

      const shouldAutoPivot = !swipedLeft && consecutiveSkips.current >= CONSECUTIVE_SKIP_PIVOT;
      if (shouldAutoPivot) {
        consecutiveSkips.current = 0;
        await apiService.pivotProfile(profileId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      await loadNext(shouldAutoPivot);
    } catch (e: any) {
      Alert.alert('Sync failed', e.message || 'Try again.');
      setPrompt(snapshot);
    } finally {
      setBusy(false);
    }
  };

  if (!category) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={styles.categoryTitle}>{category.title}</Text>
        </View>
        <View style={styles.back} />
      </View>

      <View style={styles.deck}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <SwipableCardStack
            key={prompt?.id ?? 'loading'}
            cards={deckCards}
            onSwipeLeft={() => handleSwipe(true)}
            onSwipeRight={() => handleSwipe(false)}
            leftLabel="Answer & Explore Depth"
            rightLabel="Skip, change topic, or avoid bad mood"
            emptyMessage={busy ? 'Shuffling…' : 'No card loaded'}
          />
        )}
      </View>

      <Text style={styles.hint}>← like · skip →</Text>
      {consecutiveSkips.current > 0 && consecutiveSkips.current < CONSECUTIVE_SKIP_PIVOT && (
        <Text style={styles.pivotHint}>
          {CONSECUTIVE_SKIP_PIVOT - consecutiveSkips.current} more skips shifts the vibe
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  back: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  categoryIcon: { fontSize: 22 },
  categoryTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
  deck: { flex: 1, justifyContent: 'center' },
  hint: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  pivotHint: {
    textAlign: 'center',
    color: colors.swipeSkip,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 24,
  },
});
