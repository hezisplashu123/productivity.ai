import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// @ts-ignore
import ConfettiCannon from 'react-native-confetti-cannon';
import { ArrowLeft, CornerDownLeft, CornerDownRight, RotateCcw, Users, Minus, Plus, Flame, Share2, X } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, Easing, withTiming, useSharedValue, useAnimatedStyle, withRepeat, withSequence } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { SwipableCardStack } from '../src/components/SwipableCardStack';
import { ShareCard } from '../src/components/ShareCard';
import { CenteredModal } from '../src/components/CenteredModal';
import { AnchoredTooltip } from '../src/components/AnchoredTooltip';
import { useApp } from '../src/context/AppContext';
import { useDeckQueue } from '../src/hooks/useDeckQueue';
import { storage } from '../src/utils/storage';
import { Theme } from '../src/constants/colors';
import { typography } from '../src/constants/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DeckScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, gamemode, theme, playerCount, setPlayerCount } = useApp();
  const styles = getStyles(theme);

  const categoryId = (params.categoryId as string) || 'friends-deep-talk';

  const { cards, loading, handleIndexChange, handleSwipeLeft, handleSwipeRight } = useDeckQueue({
    categoryId,
    gamemode,
    profileId: user?.profileId,
    playerCount: playerCount || 3, // Defaults to 3 if null
  });

  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [localPlayerCount, setLocalPlayerCount] = useState(playerCount || 3);
  
  // Ambient Glow Animation
  const glowOpacity = useSharedValue(0.15);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    glowOpacity.value = withRepeat(withSequence(withTiming(0.25, { duration: 4000 }), withTiming(0.15, { duration: 4000 })), -1, true);
    glowScale.value = withRepeat(withSequence(withTiming(1.2, { duration: 5000 }), withTiming(1, { duration: 5000 })), -1, true);
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));
  
  const MAX_HEAT = 10;
  const [heat, setHeat] = useState(0);
  const [confettiCount, setConfettiCount] = useState(0);
  const [showHeatModal, setShowHeatModal] = useState(false);
  const [tooltipAnchor, setTooltipAnchor] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [totalAnsweredSession, setTotalAnsweredSession] = useState(0);
  const maxHeatHapticFired = useRef(false);
  const heatMeterRef = useRef<View>(null);
  const shareBtnRef = useRef<View>(null);
  const shareCardRef = useRef<View>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [shareTooltipAnchor, setShareTooltipAnchor] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const heatPulseOpacity = useSharedValue(1);
  const heatPulseScale = useSharedValue(1);

  useEffect(() => {
    if (heat >= MAX_HEAT) {
      if (!maxHeatHapticFired.current) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        maxHeatHapticFired.current = true;
      }
      heatPulseOpacity.value = withRepeat(withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.quad) }), -1, true);
      heatPulseScale.value = withRepeat(withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.quad) }), -1, true);
    } else {
      heatPulseOpacity.value = withTiming(1);
      heatPulseScale.value = withTiming(1);
    }
  }, [heat]);

  const animatedHeatPulseStyle = useAnimatedStyle(() => ({
    opacity: heatPulseOpacity.value,
    transform: [{ scale: heatPulseScale.value }]
  }));

  const openTooltip = () => {
    heatMeterRef.current?.measureInWindow((x, y, width, height) => {
      setTooltipAnchor({ x, y, width, height });
      setShowHeatModal(true);
    });
  };

  const openShareTooltip = () => {
    shareBtnRef.current?.measureInWindow((x, y, width, height) => {
      setShareTooltipAnchor({ x, y, width, height });
      setShowShareTooltip(true);
    });
  };

  const onSwipeRightWrapper = async (card: any) => {
    setHeat(prev => Math.min(prev + 1, MAX_HEAT));
    setConfettiCount(prev => prev + 1);
    
    const newAnswered = totalAnsweredSession + 1;
    setTotalAnsweredSession(newAnswered);
    
    if (newAnswered === 3) {
      const hasSeen = await storage.getHasSeenHeatMeterIntro();
      if (!hasSeen) {
        openTooltip();
        await storage.setHasSeenHeatMeterIntro(true);
      }
    }
    
    if (newAnswered === 4) {
      const hasSeenShare = await storage.getHasSeenShareIntro();
      if (!hasSeenShare) {
        openShareTooltip();
        await storage.setHasSeenShareIntro(true);
      }
    }
    
    handleSwipeRight(card);
  };

  // Show player selection immediately if it has never been set
  useEffect(() => {
    if (playerCount === null && !loading) {
      if (gamemode === 'relationship') {
        setPlayerCount(2);
        setLocalPlayerCount(2);
      } else {
        setLocalPlayerCount(3);
        setShowPlayerModal(true);
      }
    }
  }, [playerCount, loading, gamemode]);

  const decrementPlayer = () => setLocalPlayerCount((prev) => Math.max(2, prev - 1));
  const incrementPlayer = () => setLocalPlayerCount((prev) => Math.min(20, prev + 1));

  const handleContinue = () => {
    setPlayerCount(localPlayerCount);
    setShowPlayerModal(false);
  };

  const currentQuestion = cards[0]?.label || '';

  const handleShare = async () => {
    try {
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
      });
      await Sharing.shareAsync(uri);
      setShowShareModal(false);
    } catch (e) {
      console.log('Error sharing:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* BACKGROUND GLOW */}
      <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]}>
        <Animated.View style={[styles.ambientGlow, animatedGlowStyle]} />
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
      </View>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            ref={heatMeterRef as any}
            style={styles.heatMeterContainer} 
            activeOpacity={0.7}
            onPress={openTooltip}
          >
            <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, animatedHeatPulseStyle]}>
              <Flame size={16} color={heat > 0 ? theme.primary : theme.textSecondary} />
              <View style={styles.heatBarTrack}>
                <Animated.View style={[styles.heatBarFill, { width: `${(heat / MAX_HEAT) * 100}%` }]} />
              </View>
            </Animated.View>
          </TouchableOpacity>

          {playerCount !== null && (
            <TouchableOpacity 
              onPress={() => {
                setLocalPlayerCount(playerCount);
                setShowPlayerModal(true);
              }} 
              style={styles.playerCountBadge}
              activeOpacity={0.7}
            >
              <Users size={16} color={theme.primary} />
              <Text style={styles.playerCountText}>{playerCount}</Text>
            </TouchableOpacity>
          )}

          {cards.length > 0 && (
            <TouchableOpacity 
              ref={shareBtnRef as any}
              onPress={() => {
                setShowShareTooltip(false); // dismiss if open
                setShowShareModal(true);
              }} 
              style={styles.playerCountBadge}
              activeOpacity={0.7}
            >
              <Share2 size={16} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* MAIN GAMEPLAY CONTENT */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : (
          <>
            <SwipableCardStack
              cards={cards}
              onSwipeLeft={handleSwipeLeft} // Left = Skip
              onSwipeRight={onSwipeRightWrapper} // Right = Answer
              onIndexChange={handleIndexChange}
              emptyMessage="Out of cards! Generating more..."
            />
            <Text style={styles.skipRuleText}>Swipe right if you liked the question.</Text>
          </>
        )}
      </View>

      {/* CONFETTI LAYER */}
      {confettiCount > 0 && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ConfettiCannon
            key={confettiCount}
            count={50}
            origin={{ x: SCREEN_WIDTH - 20, y: SCREEN_HEIGHT / 2 }}
            autoStart={true}
            fadeOut={true}
            fallSpeed={2500}
            explosionSpeed={350}
            colors={[theme.primary, theme.success, '#FFD700', '#FF69B4']}
          />
        </View>
      )}

      {/* PERSISTENT LEGEND */}
      <View style={styles.bottomSection} pointerEvents="none">
        <View style={styles.hintContainer}>
          <View style={styles.hintPill}>
            <CornerDownLeft size={16} color={theme.error} />
            <Text style={[styles.hintTitle, { color: theme.error }]}>Skip</Text>
          </View>
          <View style={styles.hintPill}>
            <RotateCcw size={16} color={theme.textSecondary} />
            <Text style={[styles.hintTitle, { color: theme.textSecondary }]}>Undo</Text>
          </View>
          <View style={styles.hintPill}>
            <Text style={[styles.hintTitle, { color: theme.success }]}>Answer</Text>
            <CornerDownRight size={16} color={theme.success} />
          </View>
        </View>
      </View>

      {/* HEAT EXPLANATION TOOLTIP */}
      <AnchoredTooltip 
        visible={showHeatModal} 
        onDismiss={() => setShowHeatModal(false)}
        title={heat >= MAX_HEAT ? "You're locked in!" : "Heat Meter"}
        description="When the bar fills up, the vibes are calibrated and good questions will flow."
        anchor={tooltipAnchor}
      />

      {/* SHARE EXPLANATION TOOLTIP */}
      <AnchoredTooltip 
        visible={showShareTooltip} 
        onDismiss={() => setShowShareTooltip(false)}
        title="Share the Vibe"
        description="If you really liked a question, you can share it with more people to get their answers!"
        anchor={shareTooltipAnchor}
      />

      {/* PLAYER SELECTION POPUP MODAL */}
      <CenteredModal visible={showPlayerModal} onDismiss={handleContinue}>
        <Text style={styles.modalTitle}>Group Size</Text>
        <Text style={styles.modalSubtitle}>We adjust the AI for the number of players.</Text>

        <View style={styles.counterRow}>
          <TouchableOpacity onPress={decrementPlayer} style={styles.circleBtn} activeOpacity={0.7}>
            <Minus size={28} color={theme.text} strokeWidth={3} />
          </TouchableOpacity>
          
          <Text style={styles.counterText}>{localPlayerCount}</Text>
          
          <TouchableOpacity onPress={incrementPlayer} style={styles.circleBtn} activeOpacity={0.7}>
            <Plus size={28} color={theme.text} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </CenteredModal>

      {/* SHARE PREVIEW MODAL */}
      <CenteredModal visible={showShareModal} onDismiss={() => setShowShareModal(false)}>
        <View style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
          <TouchableOpacity onPress={() => setShowShareModal(false)} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
            <X size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.modalTitle}>Share</Text>
        <Text style={styles.modalSubtitle}>Preview your export.</Text>
        
        <View style={{ width: 1080 * 0.25, height: 1920 * 0.25, alignSelf: 'center', marginVertical: 24, borderRadius: 16, overflow: 'hidden' }}>
          <View style={{ transform: [{ scale: 0.25 }], transformOrigin: 'top left' }}>
            <ShareCard ref={shareCardRef} question={currentQuestion} theme={theme} />
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleShare} activeOpacity={0.85}>
          <Text style={styles.continueButtonText}>Share to TikTok/Insta</Text>
        </TouchableOpacity>
      </CenteredModal>
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heatMeterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundElevated,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  heatBarTrack: {
    width: 60,
    height: 8,
    backgroundColor: theme.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  heatBarFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 4,
  },
  playerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundElevated,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 6,
  },
  playerCountText: {
    fontFamily: typography.bodyBold,
    color: theme.text,
    fontSize: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipRuleText: {
    fontFamily: typography.utility,
    position: 'absolute',
    top: '50%',
    marginTop: 240,
    fontSize: 14,
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
    fontFamily: typography.bodyBold,
    fontSize: 14,
  },
  
  ambientGlow: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.primary,
  },
  modalTitle: {
    fontFamily: typography.heading,
    fontSize: 28,
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: typography.body,
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
    gap: 32,
  },
  circleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.backgroundElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  counterText: {
    fontFamily: typography.heading,
    fontSize: 64,
    color: theme.text,
    fontVariant: ['tabular-nums'],
    minWidth: 70,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: theme.primary,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  continueButtonText: {
    fontFamily: typography.bodyBold,
    color: theme.background,
    fontSize: 18,
  },
});