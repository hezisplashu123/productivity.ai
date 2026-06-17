import { useEffect, useState, useRef, useCallback } from 'react';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';
import { PRESET_QUESTIONS } from '../constants/categories';
import { SwipableCardData, Gamemode } from '../types';

interface UseDeckQueueOptions {
  categoryId: string;
  gamemode: Gamemode;
  profileId?: string;
}

export function useDeckQueue({ categoryId, gamemode, profileId }: UseDeckQueueOptions) {
  const [cards, setCards] = useState<SwipableCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const isFetching = useRef(false);
  const currentIndexRef = useRef(0);

  const fetchAICardsBackground = useCallback(async (currentCards: SwipableCardData[]) => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      if (profileId) {
        const res = await apiService.getNextPrompts(profileId, gamemode, categoryId, 5);
        if (res && res.prompts) {
          const aiCards = res.prompts.map((p: { id: string; text: string; category: string }) => ({
            id: p.id,
            label: p.text,
            category: p.category, 
          }));

          setCards((prev) => {
            const next = [...prev, ...aiCards];
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
  }, [profileId, gamemode, categoryId]);

  const loadDeck = useCallback(async () => {
    setLoading(true);

    const cachedCards = await storage.getCachedQueue(gamemode, categoryId);

    if (cachedCards && cachedCards.length > 0) {
      setCards(cachedCards);

      if (cachedCards.length <= 3) {
        fetchAICardsBackground(cachedCards);
      }
    } else {
      const localQuestions = PRESET_QUESTIONS[categoryId] || PRESET_QUESTIONS['friends-deep-talk'];

      const initialCards = localQuestions.map((text, idx) => ({
        id: `local-${categoryId}-${idx}`,
        label: text,
        category: 'Start', 
      }));

      setCards(initialCards);
      fetchAICardsBackground(initialCards);
    }

    setLoading(false);
  }, [categoryId, gamemode, fetchAICardsBackground]);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  const handleIndexChange = useCallback((newIndex: number) => {
    currentIndexRef.current = newIndex;
    const remaining = cards.length - newIndex;

    storage.saveCachedQueue(gamemode, categoryId, cards.slice(newIndex));

    if (remaining <= 3 && !isFetching.current) {
      fetchAICardsBackground(cards.slice(newIndex));
    }
  }, [cards, gamemode, categoryId, fetchAICardsBackground]);

  const handleSwipeLeft = useCallback((card: SwipableCardData) => {
    if (profileId && !card.id.startsWith('local-')) {
      apiService.recordSwipe(profileId, card.id, true).catch(() => {});
    }
  }, [profileId]);

  const handleSwipeRight = useCallback((card: SwipableCardData) => {
    if (profileId && !card.id.startsWith('local-')) {
      apiService.recordSwipe(profileId, card.id, false).catch(() => {});
    }
  }, [profileId]);

  return {
    cards,
    loading,
    handleIndexChange,
    handleSwipeLeft,
    handleSwipeRight,
  };
}