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
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';
import { Check, X } from 'lucide-react-native';

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
        
        // Final destination way off screen
        const finalX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

        if (direction === 'left') {
          runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        } else {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Slow dramatic spring out
        translateX.value = withSpring(finalX, { damping: 25, stiffness: 60, velocity });
        translateY.value = withSpring(0);
        
        // Pronounced dramatic rotation
        rotation.value = withTiming(direction === 'right' ? ROTATION_MAX * 2 : -ROTATION_MAX * 2, { duration: 450 });
        
        // Give the user time to see the solid color cover everything before it disappears
        opacity.value = withTiming(0, { duration: 450 });
        scale.value = withTiming(0.8, { duration: 450 }, (isFinished) => {
          if (isFinished) {
            runOnJS(handleSwipeComplete)(direction);
          }
        });
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

  // Swipe Left -> Keep (Green Check) solid spread
  const leftRippleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD], [0.01, 15], Extrapolate.CLAMP) }
    ],
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD * 0.2], [0, 1], Extrapolate.CLAMP),
  }));

  const leftIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD * 0.8], [0, 1], Extrapolate.CLAMP),
    transform: [
      { scale: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD], [0.5, 1.2], Extrapolate.CLAMP) }
    ]
  }));

  // Swipe Right -> Skip (Red X) solid spread
  const rightRippleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(translateX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD], [0.01, 15], Extrapolate.CLAMP) }
    ],
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD * 0.2], [0, 1], Extrapolate.CLAMP),
  }));

  const rightIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD * 0.8], [0, 1], Extrapolate.CLAMP),
    transform: [
      { scale: interpolate(translateX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD], [0.5, 1.2], Extrapolate.CLAMP) }
    ]
  }));

  return (
    <Animated.View
      style={[styles.cardContainer, cardStyle, { position: index === 0 ? 'relative' : 'absolute' }]}
      pointerEvents={index === 0 ? 'auto' : 'none'}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card]}>
          
          <View style={styles.cardContent}>
            {card.category ? <Text style={styles.categoryTag}>{card.category}</Text> : null}
            <Text style={styles.cardLabel}>{card.label}</Text>
            {card.description ? <Text style={styles.cardDescription}>{card.description}</Text> : null}
          </View>

          {/* Spreading Solid Colors (Will cover text entirely) */}
          <Animated.View style={[styles.ripple, styles.keepRipple, leftRippleStyle]} />
          <Animated.View style={[styles.ripple, styles.skipRipple, rightRippleStyle]} />

          {/* Action Icons and Labels Over Top */}
          <Animated.View style={[styles.actionOverlay, leftIconStyle]}>
            <Check size={72} color="#ffffff" strokeWidth={3} />
            {leftLabel ? <Text style={styles.actionLabel}>{leftLabel}</Text> : null}
          </Animated.View>

          <Animated.View style={[styles.actionOverlay, rightIconStyle]}>
            <X size={72} color="#ffffff" strokeWidth={3} />
            {rightLabel ? <Text style={styles.actionLabel}>{rightLabel}</Text> : null}
          </Animated.View>

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
    borderWidth: 1.5,
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
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
    paddingHorizontal: 32,
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
    paddingHorizontal: 24,
    zIndex: 3,
  },
  actionLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
  },
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