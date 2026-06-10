import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, ChevronLeft, CornerDownLeft, CornerDownRight, RotateCcw, MessageCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, Easing } from 'react-native-reanimated';
import { colors } from '../src/constants/colors';
import { getCategoryById, PRESET_QUESTIONS } from '../src/constants/categories';
import { SwipableCardStack, SwipableCardData } from '../src/components/SwipableCardStack';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';

type Prompt = { id: string; text: string; category: string };

const BATCH_SIZE = 3; // How many AI questions to generate at a time
const BUFFER_THRESHOLD = 2; // Fetch more when only 2 cards are left in the queue

export default function DeckScreen() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { user } = useApp();
  const category = getCategoryById(String(categoryId || ''));

  const [queue, setQueue] = useState<Prompt[]>([]);
  const [swipedCount, setSwipedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const [activeDiscussion, setActiveDiscussion] = useState<Prompt | null>(null);
  const profileId = user?.profileId;

  // Helper to fetch fallback local presets if network/AI fails
  const getFallbackPrompts = useCallback((count: number) => {
    const presetList = PRESET_QUESTIONS[category?.id || ''] || PRESET_QUESTIONS['icebreakers'];
    const shuffled = [...presetList].sort(() => Math.random() - 0.5).slice(0, count);
    return shuffled.map((text, index) => ({
      id: `local-${category?.id}-${Date.now()}-${index}`,
      text: text,
      category: category?.title || 'Questions'
    }));
  }, [category]);

  // Initial Load - Get the first 3 cards
  useEffect(() => {
    if (!category) {
      router.replace('/home');
      return;
    }

    const fetchInitialPrompts = async () => {
      try {
        if (profileId) {
          const res = await apiService.getNextPrompts(profileId, BATCH_SIZE); 
          const aiQueue = res.prompts.map((p: any) => ({
            id: p.id,
            text: p.text,
            category: p.category
          }));
          setQueue(aiQueue);
        } else {
          setQueue(getFallbackPrompts(BATCH_SIZE));
        }
      } catch (error) {
        console.warn("Initial AI Fetch failed, falling back to presets:", error);
        setQueue(getFallbackPrompts(BATCH_SIZE));
      } finally {
        setLoading(false);
      }
    };

    fetchInitialPrompts();
  }, [category, profileId, router, getFallbackPrompts]);

  // Buffer System - Watch the queue and fetch 3 more quietly in the background
  useEffect(() => {
    const cardsRemaining = queue.length - swipedCount;

    if (cardsRemaining <= BUFFER_THRESHOLD && queue.length > 0 && !isFetchingMore && !loading && profileId) {
      const fetchBuffer = async () => {
        setIsFetchingMore(true);
        try {
          const res = await apiService.getNextPrompts(profileId, BATCH_SIZE);
          const aiQueue = res.prompts.map((p: any) => ({
            id: p.id,
            text: p.text,
            category: p.category
          }));
          
          // Seamlessly append the 3 new cards to the bottom of the deck
          setQueue(prev => [...prev, ...aiQueue]);
        } catch (error) {
          console.warn("Buffer AI Fetch failed, appending presets:", error);
          setQueue(prev => [...prev, ...getFallbackPrompts(BATCH_SIZE)]);
        } finally {
          setIsFetchingMore(false);
        }
      };

      fetchBuffer();
    }
  }, [swipedCount, queue.length, isFetchingMore, loading, profileId, getFallbackPrompts]);

  const deckCards: SwipableCardData[] = useMemo(() => {
    return queue.map(p => ({
      id: p.id,
      label: p.text,
      category: p.category,
    }));
  }, [queue]);

  const handleSwipe = async (swipedId: string, swipedLeft: boolean) => {
    // Increment our tracking so the buffer knows we are running out of cards
    setSwipedCount(prev => prev + 1);

    const swipedPrompt = queue.find(q => q.id === swipedId);

    if (swipedLeft && swipedPrompt) {
      setActiveDiscussion(swipedPrompt);
    }

    if (profileId) {
      try {
        // Teach the AI in the background
        apiService.recordSwipe(profileId, swipedId, swipedLeft).catch(() => {});
      } catch (e: any) {}
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <ChevronLeft size={24} color={colors.text} />
          <Text style={styles.backBtnText}>Categories</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
        </View>

        <View style={{ width: 100 }}>
          {isFetchingMore && (
             <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: 'flex-end', marginRight: 16 }} />
          )}
        </View>
      </View>

      <View style={styles.deck}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <View style={styles.stackWrapper}>
            <SwipableCardStack
              key={deckCards.length > 0 ? 'loaded' : 'empty'}
              cards={deckCards}
              onSwipeLeft={(id) => handleSwipe(id, true)}
              onSwipeRight={(id) => handleSwipe(id, false)}
              leftLabel="Answer"
              rightLabel="Skip"
              emptyMessage="Loading more questions..."
            />
            <Text style={styles.skipRuleText}>
              If you don't have an answer, just skip it.
            </Text>
          </View>
        )}
      </View>

      {/* 3-Pill Bottom Section */}
      <View style={styles.bottomSection}>
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
      </View>

      {/* DISCUSSION OVERLAY MODAL */}
      {activeDiscussion && (
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
              
              <Text style={styles.discussionQuestion}>{activeDiscussion.text}</Text>
              
              <Text style={styles.discussionHint}>
                Pass the phone around. Let everyone answer before moving on.
              </Text>

              <TouchableOpacity 
                style={styles.nextButton}
                onPress={handleFinishDiscussion}
                activeOpacity={0.8}
              >
                <Text style={styles.nextButtonText}>Done, give me a new question</Text>
                <ArrowRight size={20} color={colors.background} />
              </TouchableOpacity>
            </Animated.View>
          </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: 100, 
  },
  backBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 2,
  },
  headerCenter: { 
    flex: 1, 
    alignItems: 'center' 
  },
  categoryTitle: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: colors.text, 
    letterSpacing: 0.5 
  },
  deck: { flex: 1, justifyContent: 'center' },
  stackWrapper: {
    alignItems: 'center',
  },
  skipRuleText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  
  bottomSection: {
    paddingHorizontal: 24,
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
    paddingBottom: 40,
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
});