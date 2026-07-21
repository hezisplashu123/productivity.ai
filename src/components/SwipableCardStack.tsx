import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Share } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, interpolate, Extrapolate, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check, X } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/colors';
import { typography } from '../constants/typography';
import { SwipableCardData } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const ROTATION_MAX = 8;
const CARD_SCALE = 0.96;

interface SwipableCardProps {
  card: SwipableCardData; 
  index: number; 
  totalCards: number;
  onSwipeLeft: (card: SwipableCardData) => void; 
  onSwipeRight: (card: SwipableCardData) => void; 
  onUndo: () => void;
  isTopCard: boolean; 
  theme: Theme;
}

const SwipableCard: React.FC<SwipableCardProps> = ({ card, index, totalCards, onSwipeLeft, onSwipeRight, onUndo, isTopCard, theme }) => {
  const styles = getStyles(theme);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const hapticState = useSharedValue(0);

  const handleSwipeComplete = useCallback((direction: 'left' | 'right') => {
    direction === 'left' ? onSwipeLeft(card) : onSwipeRight(card);
  }, [card, onSwipeLeft, onSwipeRight]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(Haptics.selectionAsync)();
      hapticState.value = 0;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX; 
      translateY.value = e.translationY * 0.08;
      rotation.value = interpolate(translateX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-ROTATION_MAX, 0, ROTATION_MAX], Extrapolate.CLAMP);
      scale.value = interpolate(Math.abs(translateX.value), [0, SCREEN_WIDTH * 0.5], [1, CARD_SCALE], Extrapolate.CLAMP);
      
      const ratio = Math.abs(translateX.value) / SWIPE_THRESHOLD;
      if (ratio >= 0.9 && hapticState.value < 3) {
        hapticState.value = 3;
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      } else if (ratio >= 0.66 && hapticState.value < 2) {
        hapticState.value = 2;
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      } else if (ratio >= 0.33 && hapticState.value < 1) {
        hapticState.value = 1;
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onEnd((e) => {
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD || Math.abs(e.velocityX) > 600) {
        const direction = translateX.value > 0 ? 'right' : 'left';
        // Left is Skip (Medium impact), Right is Answer (Success impact)
        runOnJS(direction === 'right' ? Haptics.notificationAsync : Haptics.impactAsync)(direction === 'right' ? Haptics.NotificationFeedbackType.Success : Haptics.ImpactFeedbackStyle.Medium);
        translateX.value = withTiming(direction === 'right' ? SCREEN_WIDTH * 1.2 : -SCREEN_WIDTH * 1.2, { duration: 300, easing: Easing.out(Easing.cubic) });
        translateY.value = withTiming(e.translationY * 0.2, { duration: 300, easing: Easing.out(Easing.cubic) });
        opacity.value = withTiming(0, { duration: 200 }, (f) => f && runOnJS(handleSwipeComplete)(direction));
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        rotation.value = withSpring(0, { damping: 20, stiffness: 200 });
        scale.value = withSpring(1, { damping: 20, stiffness: 200 });
      }
    });

  const handleShare = useCallback(() => {
    Share.share({
      message: `Answering this with my friends on Hezi: ${card.label}`,
    }).catch(console.error);
  }, [card.label]);

  const tapGesture = Gesture.Tap().maxDuration(250).onEnd(() => runOnJS(onUndo)());
  const longPressGesture = Gesture.LongPress().minDuration(500).onEnd(() => runOnJS(handleShare)());
  const composedGesture = Gesture.Exclusive(panGesture, longPressGesture, tapGesture);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotation.value}deg` }, { scale: index === 0 ? scale.value : 1 - index * 0.04 }],
    opacity: index === 0 ? opacity.value : 1, zIndex: totalCards - index,
  }));

  // LEFT = SKIP (Error / X)
  const leftRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD], [0.01, 8], Extrapolate.CLAMP) }],
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD * 0.2], [0, 1], Extrapolate.CLAMP),
  }));

  const leftIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD * 0.8], [0, 1], Extrapolate.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [-SWIPE_THRESHOLD * 0.2, -SWIPE_THRESHOLD], [0.5, 1.1], Extrapolate.CLAMP) }]
  }));

  // RIGHT = ANSWER (Success / Check)
  const rightRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(translateX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD], [0.01, 8], Extrapolate.CLAMP) }],
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD * 0.2], [0, 1], Extrapolate.CLAMP),
  }));

  const rightIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD * 0.8], [0, 1], Extrapolate.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD], [0.5, 1.1], Extrapolate.CLAMP) }]
  }));

  return (
    <Animated.View style={[styles.cardContainer, cardStyle, { position: index === 0 ? 'relative' : 'absolute' }]} pointerEvents={index === 0 ? 'auto' : 'none'}>
      <GestureDetector gesture={isTopCard ? composedGesture : Gesture.Pan().enabled(false)}>
        <Animated.View style={styles.card}>
          <View style={styles.cardContent}>
            {index === 0 && (
              <>
                {card.category && <Text style={styles.categoryTag}>{card.category}</Text>}
                <Text style={styles.cardLabel}>{card.label}</Text>
                {card.description && <Text style={styles.cardDescription}>{card.description}</Text>}
              </>
            )}
          </View>
          <Animated.View style={[styles.ripple, { backgroundColor: theme.error }, leftRippleStyle]} />
          <Animated.View style={[styles.ripple, { backgroundColor: theme.success }, rightRippleStyle]} />
          <Animated.View style={[styles.actionOverlay, leftIconStyle]}><X size={72} color="#ffffff" strokeWidth={3} /><Text style={styles.actionLabel}>Skip</Text></Animated.View>
          <Animated.View style={[styles.actionOverlay, rightIconStyle]}><Check size={72} color="#ffffff" strokeWidth={3} /><Text style={styles.actionLabel}>Answer</Text></Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

export const SwipableCardStack: React.FC<{ 
  cards: SwipableCardData[]; 
  onSwipeLeft: (card: SwipableCardData) => void; 
  onSwipeRight: (card: SwipableCardData) => void; 
  onIndexChange?: (index: number) => void;
  emptyMessage?: string; 
}> = ({ cards, onSwipeLeft, onSwipeRight, onIndexChange, emptyMessage = 'No more cards' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { theme } = useApp();
  const styles = getStyles(theme);

  const handleSwipeLeft = useCallback((card: SwipableCardData) => { 
    setCurrentIndex((prev) => {
      const next = prev + 1;
      onIndexChange?.(next);
      return next;
    }); 
    onSwipeLeft(card); 
  }, [onSwipeLeft, onIndexChange]);

  const handleSwipeRight = useCallback((card: SwipableCardData) => { 
    setCurrentIndex((prev) => {
      const next = prev + 1;
      onIndexChange?.(next);
      return next;
    }); 
    onSwipeRight(card); 
  }, [onSwipeRight, onIndexChange]);

  const handleUndo = useCallback(() => { 
    if (currentIndex > 0) { 
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
      setCurrentIndex((prev) => {
        const next = prev - 1;
        onIndexChange?.(next);
        return next;
      }); 
    } 
  }, [currentIndex, onIndexChange]);

  const remainingCards = cards.slice(currentIndex, currentIndex + 3);
  
  if (remainingCards.length === 0) return <View style={styles.emptyContainer}><Text style={styles.emptyText}>{emptyMessage}</Text></View>;

  return (
    <View style={styles.stackContainer}>
      {remainingCards.map((card, idx) => (
        <SwipableCard key={card.id} card={card} index={idx} totalCards={remainingCards.length} onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight} onUndo={handleUndo} isTopCard={idx === 0} theme={theme} />
      ))}
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  stackContainer: { width: '100%', height: 440, alignItems: 'center', justifyContent: 'center' },
  cardContainer: { width: SCREEN_WIDTH - 40, height: 440, position: 'absolute' },
  card: { width: '100%', height: '100%', borderRadius: 32, borderWidth: 1, backgroundColor: theme.backgroundCard, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.3, shadowRadius: 32, elevation: 12, overflow: 'hidden' },
  cardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  categoryTag: { fontFamily: typography.utility, fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: theme.primary, marginBottom: 18 },
  cardLabel: { fontFamily: typography.body, fontSize: 26, color: theme.text, textAlign: 'center', lineHeight: 36 },
  cardDescription: { fontFamily: typography.body, fontSize: 16, color: theme.textSecondary, textAlign: 'center', lineHeight: 24, marginTop: 14 },
  ripple: { position: 'absolute', top: '50%', left: '50%', width: 80, height: 80, marginTop: -40, marginLeft: -40, borderRadius: 40, zIndex: 2 },
  actionOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, zIndex: 3 },
  actionLabel: { fontFamily: typography.heading, color: '#ffffff', fontSize: 18, textAlign: 'center', marginTop: 16 },
  emptyContainer: { height: 440, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontFamily: typography.body, fontSize: 17, color: theme.textSecondary, textAlign: 'center' },
});