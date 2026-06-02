import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  interpolateColor,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const ROTATION_MAX = 12;
const CARD_SCALE = 0.96;

export interface SwipableCardData {
  id: string;
  label: string;
  description?: string;
  category?: string;
}

interface SwipableCardProps {
  card: SwipableCardData;
  index: number;
  totalCards: number;
  onSwipeLeft: (cardId: string) => void;
  onSwipeRight: (cardId: string) => void;
  isTopCard: boolean;
  leftLabel?: string;
  rightLabel?: string;
}

interface SwipableCardStackProps {
  cards: SwipableCardData[];
  onSwipeLeft: (cardId: string) => void;
  onSwipeRight: (cardId: string) => void;
  emptyMessage?: string;
  leftLabel?: string;
  rightLabel?: string;
}

const SwipableCard: React.FC<SwipableCardProps> = ({
  card,
  index,
  totalCards,
  onSwipeLeft,
  onSwipeRight,
  isTopCard,
  leftLabel = 'Answer & Explore Depth',
  rightLabel = 'Skip / Change Topic',
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      if (direction === 'left') onSwipeLeft(card.id);
      else onSwipeRight(card.id);
    },
    [card.id, onSwipeLeft, onSwipeRight]
  );

  const panGesture = Gesture.Pan()
    .enabled(isTopCard)
    .onStart(() => {
      runOnJS(Haptics.selectionAsync)();
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.08;
      rotation.value = interpolate(
        translateX.value,
        [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        [-ROTATION_MAX, 0, ROTATION_MAX],
        Extrapolate.CLAMP
      );
      scale.value = interpolate(
        Math.abs(translateX.value),
        [0, SCREEN_WIDTH * 0.5],
        [1, CARD_SCALE],
        Extrapolate.CLAMP
      );
    })
    .onEnd((e) => {
      const velocity = e.velocityX;
      const translationX = translateX.value;
      const absTranslation = Math.abs(translationX);
      const absVelocity = Math.abs(velocity);

      if (absTranslation > SWIPE_THRESHOLD || absVelocity > 500) {
        const direction = translationX > 0 ? 'right' : 'left';
        const finalX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

        if (direction === 'left') {
          runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        } else {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        }

        translateX.value = withSpring(finalX, { damping: 20, stiffness: 90, velocity });
        translateY.value = withSpring(0);
        opacity.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0.85, { duration: 200 });
        runOnJS(handleSwipeComplete)(direction);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
        scale.value = withSpring(1);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: index === 0 ? scale.value : 1 - index * 0.04 },
    ],
    opacity: index === 0 ? opacity.value : 1 - index * 0.15,
    zIndex: totalCards - index,
  }));

  const backgroundStyle = useAnimatedStyle(() => {
    if (translateX.value < 0) {
      return {
        backgroundColor: interpolateColor(
          translateX.value,
          [-SWIPE_THRESHOLD, 0],
          [colors.swipeKeep, colors.backgroundCard]
        ),
        borderColor: interpolateColor(
          translateX.value,
          [-SWIPE_THRESHOLD, 0],
          [colors.primary, colors.border]
        ),
      };
    }
    if (translateX.value > 0) {
      return {
        backgroundColor: interpolateColor(
          translateX.value,
          [0, SWIPE_THRESHOLD],
          [colors.backgroundCard, colors.swipeSkip]
        ),
        borderColor: interpolateColor(
          translateX.value,
          [0, SWIPE_THRESHOLD],
          [colors.border, colors.error]
        ),
      };
    }
    return { backgroundColor: colors.backgroundCard, borderColor: colors.border };
  });

  const leftOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolate.CLAMP),
  }));

  const rightOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP),
  }));

  return (
    <Animated.View
      style={[styles.cardContainer, cardStyle, { position: index === 0 ? 'relative' : 'absolute' }]}
      pointerEvents={index === 0 ? 'auto' : 'none'}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, backgroundStyle]}>
          <Animated.View style={[styles.overlay, styles.keepOverlay, leftOverlayStyle]}>
            <Text style={[styles.overlayText, styles.keepText]}>{leftLabel}</Text>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.skipOverlay, rightOverlayStyle]}>
            <Text style={[styles.overlayText, styles.skipText]}>{rightLabel}</Text>
          </Animated.View>
          <View style={styles.cardContent}>
            {card.category ? <Text style={styles.categoryTag}>{card.category}</Text> : null}
            <Text style={styles.cardLabel}>{card.label}</Text>
            {card.description ? <Text style={styles.cardDescription}>{card.description}</Text> : null}
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

export const SwipableCardStack: React.FC<SwipableCardStackProps> = ({
  cards,
  onSwipeLeft,
  onSwipeRight,
  emptyMessage = 'No more cards',
  leftLabel,
  rightLabel,
}) => {
  const [swipedCards, setSwipedCards] = useState<Set<string>>(new Set());

  const handleSwipeLeft = useCallback(
    (cardId: string) => {
      setSwipedCards((prev) => new Set(prev).add(cardId));
      onSwipeLeft(cardId);
    },
    [onSwipeLeft]
  );

  const handleSwipeRight = useCallback(
    (cardId: string) => {
      setSwipedCards((prev) => new Set(prev).add(cardId));
      onSwipeRight(cardId);
    },
    [onSwipeRight]
  );

  const visibleCards = cards.filter((card) => !swipedCards.has(card.id));
  const remainingCards = visibleCards.slice(0, 3);

  if (visibleCards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.stackContainer}>
      {remainingCards.map((card, index) => (
        <SwipableCard
          key={card.id}
          card={card}
          index={index}
          totalCards={remainingCards.length}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          isTopCard={index === 0}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stackContainer: {
    width: '100%',
    height: 440,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: SCREEN_WIDTH - 40,
    height: 420,
    position: 'absolute',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    padding: 28,
    borderWidth: 1.5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.primary,
    marginBottom: 18,
  },
  cardLabel: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  cardDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  keepOverlay: { backgroundColor: colors.swipeKeepGlow },
  skipOverlay: { backgroundColor: colors.swipeSkipGlow },
  overlayText: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  keepText: { color: colors.swipeKeep },
  skipText: { color: colors.swipeSkip },
  emptyContainer: {
    height: 440,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
