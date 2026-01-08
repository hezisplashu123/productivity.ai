import React, { useCallback, useRef, useState } from 'react';
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
import { lightColors as colors } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const ROTATION_MAX = 15;
const CARD_SCALE = 0.95;

export interface SwipableCardData {
  id: string;
  label: string;
  description: string;
}

interface SwipableCardProps {
  card: SwipableCardData;
  index: number;
  totalCards: number;
  onSwipeLeft: (cardId: string, velocity: number, duration: number) => void;
  onSwipeRight: (cardId: string, velocity: number, duration: number) => void;
  isTopCard: boolean;
}

interface SwipableCardStackProps {
  cards: SwipableCardData[];
  onSwipeLeft: (cardId: string, velocity: number, duration: number) => void;
  onSwipeRight: (cardId: string, velocity: number, duration: number) => void;
  emptyMessage?: string;
}

const SwipableCard: React.FC<SwipableCardProps> = ({
  card,
  index,
  totalCards,
  onSwipeLeft,
  onSwipeRight,
  isTopCard,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  
  const startTime = useRef<number>(Date.now());
  const startX = useRef<number>(0);

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right', velocity: number) => {
      const duration = Date.now() - startTime.current;
      if (direction === 'left') {
        onSwipeLeft(card.id, velocity, duration);
      } else {
        onSwipeRight(card.id, velocity, duration);
      }
    },
    [card.id, onSwipeLeft, onSwipeRight]
  );

  const panGesture = Gesture.Pan()
    .enabled(isTopCard)
    .onStart(() => {
      startTime.current = Date.now();
      startX.current = translateX.value;
      // Light haptic feedback on start
      runOnJS(Haptics.selectionAsync)();
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.1; // Subtle vertical movement
      
      // Rotation based on horizontal translation
      rotation.value = interpolate(
        translateX.value,
        [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        [-ROTATION_MAX, 0, ROTATION_MAX],
        Extrapolate.CLAMP
      );

      // Scale down slightly when dragging
      const dragDistance = Math.abs(translateX.value);
      scale.value = interpolate(
        dragDistance,
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

      // Determine if swipe threshold is met
      if (absTranslation > SWIPE_THRESHOLD || absVelocity > 500) {
        const direction = translationX > 0 ? 'right' : 'left';
        const finalX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        
        // Stronger haptic feedback on successful swipe
        if (direction === 'right') {
          runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        } else {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Animate card off screen
        translateX.value = withSpring(finalX, {
          damping: 20,
          stiffness: 90,
          velocity: velocity,
        });
        translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
        opacity.value = withTiming(0, { duration: 200 });
        scale.value = withTiming(0.8, { duration: 200 });

        // Calculate velocity for rescue protocol
        const swipeVelocity = absVelocity / 1000; // Normalize to reasonable range
        runOnJS(handleSwipeComplete)(direction, swipeVelocity);
      } else {
        // Spring back to center
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 300,
        });
        translateY.value = withSpring(0, { damping: 15, stiffness: 300 });
        rotation.value = withSpring(0, { damping: 15, stiffness: 300 });
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const zIndex = totalCards - index;
    const cardScale = index === 0 ? scale.value : 1 - index * 0.05;
    const cardOpacity = index === 0 ? opacity.value : 1 - index * 0.2;

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
        { scale: cardScale },
      ],
      opacity: cardOpacity,
      zIndex,
    };
  });

  // Background color based on swipe direction
  const backgroundStyle = useAnimatedStyle(() => {
    const progress = Math.abs(translateX.value) / SWIPE_THRESHOLD;
    const clampedProgress = Math.min(progress, 1);

    if (translateX.value > 0) {
      // Swiping right - green/positive
      return {
        backgroundColor: interpolate(
          clampedProgress,
          [0, 1],
          [colors.backgroundCard, colors.success],
          Extrapolate.CLAMP
        ),
      };
    } else if (translateX.value < 0) {
      // Swiping left - red/negative
      return {
        backgroundColor: interpolate(
          clampedProgress,
          [0, 1],
          [colors.backgroundCard, colors.error],
          Extrapolate.CLAMP
        ),
      };
    }
    return {
      backgroundColor: colors.backgroundCard,
    };
  });

  // Overlay indicators
  const rightOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const leftOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        cardStyle,
        { position: index === 0 ? 'relative' : 'absolute' },
      ]}
      pointerEvents={index === 0 ? 'auto' : 'none'}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, backgroundStyle]}>
          {/* Right swipe indicator */}
          <Animated.View style={[styles.overlay, styles.rightOverlay, rightOverlayStyle]}>
            <Text style={styles.overlayText}>✓ This kills my productivity</Text>
          </Animated.View>

          {/* Left swipe indicator */}
          <Animated.View style={[styles.overlay, styles.leftOverlay, leftOverlayStyle]}>
            <Text style={styles.overlayText}>✗ Doesn't affect me</Text>
          </Animated.View>

          {/* Card content */}
          <View style={styles.cardContent}>
            <Text style={[styles.cardLabel, { color: colors.text }]}>{card.label}</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              {card.description}
            </Text>
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
  emptyMessage = 'All done!',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedCards, setSwipedCards] = useState<Set<string>>(new Set());

  const handleSwipeLeft = useCallback(
    (cardId: string, velocity: number, duration: number) => {
      setSwipedCards((prev) => new Set(prev).add(cardId));
      setCurrentIndex((prev) => prev + 1);
      onSwipeLeft(cardId, velocity, duration);
    },
    [onSwipeLeft]
  );

  const handleSwipeRight = useCallback(
    (cardId: string, velocity: number, duration: number) => {
      setSwipedCards((prev) => new Set(prev).add(cardId));
      setCurrentIndex((prev) => prev + 1);
      onSwipeRight(cardId, velocity, duration);
    },
    [onSwipeRight]
  );

  const visibleCards = cards.filter((card) => !swipedCards.has(card.id));
  const remainingCards = visibleCards.slice(0, 3); // Show max 3 cards in stack

  if (visibleCards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {emptyMessage}
        </Text>
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
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stackContainer: {
    width: '100%',
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardContainer: {
    width: SCREEN_WIDTH - 40,
    height: 380,
    position: 'absolute',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cardLabel: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  rightOverlay: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  leftOverlay: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  overlayText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  emptyContainer: {
    width: '100%',
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
});











