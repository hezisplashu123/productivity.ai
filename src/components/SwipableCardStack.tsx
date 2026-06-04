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
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../constants/colors';
import { Check, X } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const ROTATION_MAX = 8;
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
  onUndo: () => void;
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
  onUndo,
  isTopCard,
  leftLabel = 'Answer',
  rightLabel = 'Skip',
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

      // Smooth, bounce-free swipe off
      if (absTranslation > SWIPE_THRESHOLD || absVelocity > 600) {
        const direction = translationX > 0 ? 'right' : 'left';
        const finalX = direction === 'right' ? SCREEN_WIDTH * 1.2 : -SCREEN_WIDTH * 1.2;

        if (direction === 'left') {
          runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        } else {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        }

        translateX.value = withTiming(finalX, { duration: 300, easing: Easing.out(Easing.cubic) });
        translateY.value = withTiming(e.translationY * 0.2, { duration: 300, easing: Easing.out(Easing.cubic) });
        
        opacity.value = withTiming(0, { duration: 200 }, (isFinished) => {
          if (isFinished) {
            runOnJS(handleSwipeComplete)(direction);
          }
        });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        rotation.value = withSpring(0, { damping: 20, stiffness: 200 });
        scale.value = withSpring(1, { damping: 20, stiffness: 200 });
      }
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      runOnJS(onUndo)();
    });

  // Pan takes priority over tap, allowing clean swipes while enabling undo taps
  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: index === 0 ? scale.value : 1 - index * 0.04 },
    ],
    // Only top card changes opacity during swipe, preventing visual ghosting behind it
    opacity: index === 0 ? opacity.value : 1, 
    zIndex: totalCards - index,
  }));

  const leftRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD], [0.01, 8], Extrapolate.CLAMP) }],
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD * 0.2], [0, 1], Extrapolate.CLAMP),
  }));

  const leftIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD * 0.8], [0, 1], Extrapolate.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD], [0.5, 1.1], Extrapolate.CLAMP) }]
  }));

  const rightRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(translateX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD], [0.01, 8], Extrapolate.CLAMP) }],
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD * 0.2], [0, 1], Extrapolate.CLAMP),
  }));

  const rightIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD * 0.8], [0, 1], Extrapolate.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD], [0.5, 1.1], Extrapolate.CLAMP) }]
  }));

  return (
    <Animated.View
      style={[styles.cardContainer, cardStyle, { position: index === 0 ? 'relative' : 'absolute' }]}
      pointerEvents={index === 0 ? 'auto' : 'none'}
    >
      <GestureDetector gesture={isTopCard ? composedGesture : Gesture.Pan().enabled(false)}>
        <Animated.View style={[styles.card]}>
          
          <View style={styles.cardContent}>
            {card.category ? <Text style={styles.categoryTag}>{card.category}</Text> : null}
            <Text style={styles.cardLabel}>{card.label}</Text>
            {card.description ? <Text style={styles.cardDescription}>{card.description}</Text> : null}
          </View>

          <Animated.View style={[styles.ripple, styles.keepRipple, leftRippleStyle]} />
          <Animated.View style={[styles.ripple, styles.skipRipple, rightRippleStyle]} />

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
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipeLeft = useCallback(
    (cardId: string) => {
      setCurrentIndex((prev) => prev + 1);
      onSwipeLeft(cardId);
    },
    [onSwipeLeft]
  );

  const handleSwipeRight = useCallback(
    (cardId: string) => {
      setCurrentIndex((prev) => prev + 1);
      onSwipeRight(cardId);
    },
    [onSwipeRight]
  );

  const handleUndo = useCallback(() => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const remainingCards = cards.slice(currentIndex, currentIndex + 3);

  if (remainingCards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.stackContainer}>
      {remainingCards.map((card, idx) => (
        <SwipableCard
          key={card.id}
          card={card}
          index={idx}
          totalCards={remainingCards.length}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onUndo={handleUndo}
          isTopCard={idx === 0}
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