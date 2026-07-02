import { useEffect, useState, useRef, useCallback } from 'react';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';
import { SwipableCardData, Gamemode } from '../types';

interface UseDeckQueueOptions {
  categoryId: string;
  gamemode: Gamemode;
  profileId?: string;
  playerCount: number;
}

export function useDeckQueue({ categoryId, gamemode, profileId, playerCount }: UseDeckQueueOptions) {
  const [cards, setCards] = useState<SwipableCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const isFetching = useRef(false);
  const currentIndexRef = useRef(0);

  const fetchAICardsBackground = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      if (profileId) {
        const res = await apiService.getNextPrompts(profileId, gamemode, categoryId, 10, playerCount);
        if (res && res.prompts) {
          const aiCards = res.prompts.map((p: { id: string; text: string; category: string }) => ({
            id: p.id,
            label: p.text,
            category: p.category, 
          }));

          setCards((prev) => {
            // STRICT DEDUPLICATION: Prevent React duplicate key crashes
            const existingIds = new Set(prev.map(c => c.id));
            const uniqueNewCards = aiCards.filter((c: SwipableCardData) => !existingIds.has(c.id));
            
            // If the backend sent cards we already have, don't update state
            if (uniqueNewCards.length === 0) return prev;

            const next = [...prev, ...uniqueNewCards];
            storage.saveCachedQueue(gamemode, categoryId, next.slice(currentIndexRef.current));
            return next;
          });
        }
      }
    } catch (e) {
      console.log('Background AI fetch failed.');
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  }, [profileId, gamemode, categoryId, playerCount]);

  const loadDeck = useCallback(async () => {
    setLoading(true);

    const cachedCards = await storage.getCachedQueue(gamemode, categoryId);

    if (cachedCards && cachedCards.length > 0) {
      setCards(cachedCards);
      setLoading(false);

      if (cachedCards.length <= 5) {
        fetchAICardsBackground();
      }
    } else {
      // If there is no cache, hit the backend to get the Calibration DB Deck
      fetchAICardsBackground();
    }
  }, [categoryId, gamemode, fetchAICardsBackground]);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  const handleIndexChange = useCallback((newIndex: number) => {
    currentIndexRef.current = newIndex;
    const remaining = cards.length - newIndex;

    storage.saveCachedQueue(gamemode, categoryId, cards.slice(newIndex));

    if (remaining <= 5 && !isFetching.current) {
      fetchAICardsBackground();
    }
  }, [cards, gamemode, categoryId, fetchAICardsBackground]);

  const handleSwipeLeft = useCallback((card: SwipableCardData) => {
    if (profileId) {
      apiService.recordSwipe(profileId, card.id, false).catch(() => {});
    }
  }, [profileId]);

  const handleSwipeRight = useCallback((card: SwipableCardData) => {
    if (profileId) {
      apiService.recordSwipe(profileId, card.id, true).catch(() => {});
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