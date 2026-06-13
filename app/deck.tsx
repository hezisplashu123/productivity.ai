import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CornerDownLeft, CornerDownRight, RotateCcw, MessageCircle, ArrowRight } from 'lucide-react-native';
// ADDED 'Easing' to this import line!
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, Easing } from 'react-native-reanimated';
import { SwipableCardStack, SwipableCardData } from '../src/components/SwipableCardStack';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';
import { storage } from '../src/utils/storage';
import { Theme } from '../src/constants/colors';
import { PRESET_QUESTIONS } from '../src/constants/categories';

export default function DeckScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, gamemode, theme } = useApp();
  const styles = getStyles(theme);
  
  const categoryId = (params.categoryId as string) || 'friends-deep-talk';

  const [cards, setCards] = useState<SwipableCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDiscussion, setActiveDiscussion] = useState<SwipableCardData | null>(null);

  const isFetching = useRef(false);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    loadDeck();
  }, [categoryId]);

  const loadDeck = async () => {
    setLoading(true);
    
    // 1. Try to resume from cache
    const cachedCards = await storage.getCachedQueue(gamemode, categoryId);
    
    if (cachedCards && cachedCards.length > 0) {
      setCards(cachedCards);
      
      // If our cache is running low on mount, fetch more immediately
      if (cachedCards.length <= 3) {
        fetchAICardsBackground(cachedCards);
      }
    } else {
      // 2. No cache. Load initial local cards so the deck is instantly ready
      const localQuestions = PRESET_QUESTIONS[categoryId] || PRESET_QUESTIONS['friends-deep-talk'];
      
      const initialCards = localQuestions.map((text, idx) => ({
        id: `local-${categoryId}-${idx}`,
        label: text,
        category: 'Start'
      }));
      
      setCards(initialCards);
      
      // Tell AI to start generating the next cards behind the scenes
      fetchAICardsBackground(initialCards);
    }
    
    setLoading(false);
  };

  const fetchAICardsBackground = async (currentCards: SwipableCardData[]) => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      if (user?.profileId) {
        const res = await apiService.getNextPrompts(user.profileId, gamemode, categoryId, 5);
        if (res && res.prompts) {
          const aiCards = res.prompts.map((p: any) => ({
            id: p.id,
            label: p.text,
            category: p.category
          }));
          
          setCards(prev => {
            const next = [...prev, ...aiCards];
            // Immediately save the updated queue to cache
            storage.saveCachedQueue(gamemode, categoryId, next.slice(currentIndexRef.current));
            return next;
          });
        }
      }
    } catch (e) {
      console.log('Background AI fetch failed.');
    } finally {
      isFetching.current = false;
    }
  };

  const handleIndexChange = (newIndex: number) => {
    currentIndexRef.current = newIndex;
    const remaining = cards.length - newIndex;
    
    // Save state so if they close the app, they resume exactly here
    storage.saveCachedQueue(gamemode, categoryId, cards.slice(newIndex));

    // If we only have 3 cards left in the queue, fetch 5 more silently
    if (remaining <= 3 && !isFetching.current) {
      fetchAICardsBackground(cards.slice(newIndex));
    }
  };

  const handleSwipeLeft = (card: SwipableCardData) => {
    // Show the Discussion Screen
    setActiveDiscussion(card);

    // Record swipe data to backend if it's a generated card
    if (user?.profileId && !card.id.startsWith('local-')) {
      apiService.recordSwipe(user.profileId, card.id, true).catch(() => {});
    }
  };

  const handleSwipeRight = (card: SwipableCardData) => {
    // Record skip data to backend if it's a generated card
    if (user?.profileId && !card.id.startsWith('local-')) {
      apiService.recordSwipe(user.profileId, card.id, false).catch(() => {});
    }
  };

  const closeDiscussion = () => {
    setActiveDiscussion(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.text} size={28} />
        </TouchableOpacity>
      </View>
      
      {/* MAIN GAMEPLAY CONTENT */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <>
            <SwipableCardStack
              cards={cards}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onIndexChange={handleIndexChange}
              emptyMessage="Out of cards! Generating more..."
            />
            <Text style={styles.skipRuleText}>If you don't have an answer, just skip it.</Text>
          </>
        )}
      </View>

      {/* PERSISTENT LEGEND */}
      <View style={styles.bottomSection} pointerEvents="none">
        <View style={styles.hintContainer}>
          <View style={styles.hintPill}>
            <CornerDownLeft size={16} color={theme.success} />
            <Text style={[styles.hintTitle, { color: theme.success }]}>Answer</Text>
          </View>
          <View style={styles.hintPill}>
            <RotateCcw size={16} color={theme.textSecondary} />
            <Text style={[styles.hintTitle, { color: theme.textSecondary }]}>Undo</Text>
          </View>
          <View style={styles.hintPill}>
            <Text style={[styles.hintTitle, { color: theme.error }]}>Skip</Text>
            <CornerDownRight size={16} color={theme.error} />
          </View>
        </View>
      </View>

      {/* FULL SCREEN DISCUSSION OVERLAY (Triggers when swiping left) */}
      {activeDiscussion && (
        <Animated.View style={styles.discussionOverlay} entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
          <SafeAreaView style={styles.discussionContent}>
            
            <Animated.View style={styles.discussionInner} entering={SlideInDown.duration(400).easing(Easing.out(Easing.cubic))} exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.cubic))}>
              <View style={styles.discussionBadge}>
                <MessageCircle size={20} color={theme.primary} />
                <Text style={styles.discussionBadgeText}>Group Discussion</Text>
              </View>
              
              <Text style={styles.discussionQuestion}>{activeDiscussion.label}</Text>
              
              <TouchableOpacity style={styles.nextButton} onPress={closeDiscussion} activeOpacity={0.8}>
                <Text style={styles.nextButtonText}>Next Question</Text>
                <ArrowRight size={20} color={theme.background} />
              </TouchableOpacity>
            </Animated.View>

          </SafeAreaView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipRuleText: {
    position: 'absolute',
    top: '50%',
    marginTop: 240,
    fontSize: 14,
    fontWeight: '500',
    color: theme.textMuted,
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
    backgroundColor: theme.backgroundElevated,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Discussion Modal Styles
  discussionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
    zIndex: 100,
  },
  discussionContent: {
    flex: 1,
  },
  discussionInner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  discussionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.backgroundElevated,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 8,
    marginBottom: 24,
  },
  discussionBadgeText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  discussionQuestion: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.text,
    lineHeight: 42,
    marginBottom: 40,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 18,
    borderRadius: 20,
    gap: 12,
  },
  nextButtonText: {
    color: theme.background,
    fontSize: 18,
    fontWeight: '800',
  }
});