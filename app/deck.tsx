import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ArrowRight, Ghost, Layers, MessageCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { colors } from '../src/constants/colors';
import { getCategoryById } from '../src/constants/categories';
import { SwipableCardStack, SwipableCardData } from '../src/components/SwipableCardStack';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';

type Prompt = { id: string; text: string; category: string };

export default function DeckScreen() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { user } = useApp();
  const category = getCategoryById(String(categoryId || ''));

  const [queue, setQueue] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  
  // Discussion State
  const [activeDiscussion, setActiveDiscussion] = useState<Prompt | null>(null);

  const profileId = user?.profileId;

  // Background queue management
  const fetchMorePrompts = useCallback(async (count: number) => {
    if (!profileId || fetchingMore) return;
    setFetchingMore(true);
    try {
      const result = await apiService.getNextPrompts(profileId, count);
      if (result.prompts && result.prompts.length > 0) {
        setQueue(prev => [...prev, ...result.prompts]);
      }
    } catch (e: any) {
      console.log('Background fetch failed:', e.message);
    } finally {
      setFetchingMore(false);
    }
  }, [profileId, fetchingMore]);

  // Initial load
  useEffect(() => {
    if (!category) {
      router.replace('/home');
      return;
    }
    const init = async () => {
      try {
        const result = await apiService.getNextPrompts(profileId!, 3);
        setQueue(result.prompts);
      } catch (e: any) {
        Alert.alert('Could not load cards', e.message);
        router.back();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [category, profileId, router]);

  // Check queue health on every change
  useEffect(() => {
    // Always stay at least 2 questions ahead
    if (!loading && queue.length < 3 && !fetchingMore) {
      fetchMorePrompts(3 - queue.length);
    }
  }, [queue.length, loading, fetchingMore, fetchMorePrompts]);

  const deckCards: SwipableCardData[] = useMemo(() => {
    return queue.map(p => ({
      id: p.id,
      label: p.text,
      category: p.category,
    }));
  }, [queue]);

  const handleSwipe = async (swipedId: string, swipedLeft: boolean) => {
    if (!profileId) return;

    // Remove swiped card from queue immediately for UI snap
    const swipedPrompt = queue.find(q => q.id === swipedId);
    setQueue(prev => prev.filter(q => q.id !== swipedId));

    // If they kept it (Swipe Left), enter Discussion Mode
    if (swipedLeft && swipedPrompt) {
      setActiveDiscussion(swipedPrompt);
    }

    // Record it asynchronously
    try {
      await apiService.recordSwipe(profileId, swipedId, swipedLeft);
    } catch (e: any) {
      console.log('Sync failed', e.message);
    }
  };

  const handleFinishDiscussion = () => {
    Haptics.selectionAsync();
    setActiveDiscussion(null);
  };

  if (!category) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background UI */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Ghost size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.categoryIconWrap}>
            <Layers size={16} color={colors.primary} />
          </View>
          <Text style={styles.categoryTitle}>{category.title}</Text>
        </View>
        <View style={styles.back} />
      </View>

      <View style={styles.deck}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <SwipableCardStack
            key={deckCards.length > 0 ? 'loaded' : 'empty'}
            cards={deckCards}
            onSwipeLeft={(id) => handleSwipe(id, true)}
            onSwipeRight={(id) => handleSwipe(id, false)}
            leftLabel="Answer"
            rightLabel="Skip"
            emptyMessage={fetchingMore ? 'Generating perfect questions...' : 'Out of cards'}
          />
        )}
      </View>

      <Text style={styles.hint}>← answer · skip →</Text>

      {/* DISCUSSION OVERLAY MODAL */}
      {activeDiscussion && (
        <Animated.View 
          style={styles.discussionOverlay}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
        >
          <View style={styles.discussionContent}>
            <Animated.View entering={SlideInDown.springify().damping(24)} exiting={SlideOutDown}>
              <View style={styles.discussionBadge}>
                <MessageCircle size={20} color={colors.primary} />
                <Text style={styles.discussionBadgeText}>Group Discussion</Text>
              </View>
              
              <Text style={styles.discussionQuestion}>{activeDiscussion.text}</Text>
              
              <Text style={styles.discussionHint}>
                Pass the phone around. Let everyone answer before moving on.
              </Text>
            </Animated.View>
          </View>

          <Animated.View 
            style={styles.discussionFooter}
            entering={SlideInDown.delay(200).springify().damping(20)}
          >
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleFinishDiscussion}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Done, give me a new question</Text>
              <ArrowRight size={20} color={colors.background} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
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
  categoryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
  deck: { flex: 1, justifyContent: 'center' },
  hint: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 24,
  },
  
  // Discussion Modal Styles
  discussionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
    zIndex: 100,
    justifyContent: 'space-between',
  },
  discussionContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
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
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 44,
    marginBottom: 24,
  },
  discussionHint: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  discussionFooter: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 20,
    borderRadius: 20,
    gap: 12,
  },
  nextButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '800',
  },
});