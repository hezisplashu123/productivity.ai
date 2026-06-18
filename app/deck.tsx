import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CornerDownLeft, CornerDownRight, RotateCcw, Users, Minus, Plus } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { SwipableCardStack } from '../src/components/SwipableCardStack';
import { useApp } from '../src/context/AppContext';
import { useDeckQueue } from '../src/hooks/useDeckQueue';
import { Theme } from '../src/constants/colors';

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

  // Show player selection immediately if it has never been set
  useEffect(() => {
    if (playerCount === null && !loading) {
      setLocalPlayerCount(3);
      setShowPlayerModal(true);
    }
  }, [playerCount, loading]);

  const decrementPlayer = () => setLocalPlayerCount((prev) => Math.max(2, prev - 1));
  const incrementPlayer = () => setLocalPlayerCount((prev) => Math.min(20, prev + 1));

  const handleContinue = () => {
    setPlayerCount(localPlayerCount);
    setShowPlayerModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft color={theme.text} size={24} />
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
            <Users size={18} color={theme.primary} />
            <Text style={styles.playerCountText}>{playerCount} Players</Text>
          </TouchableOpacity>
        )}
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
              onSwipeRight={handleSwipeRight} // Right = Answer
              onIndexChange={handleIndexChange}
              emptyMessage="Out of cards! Generating more..."
            />
            <Text style={styles.skipRuleText}>Swipe right if you liked the question.</Text>
          </>
        )}
      </View>

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

      {/* PLAYER SELECTION POPUP MODAL */}
      {showPlayerModal && (
        <Animated.View style={styles.modalOverlay} entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
          <Animated.View style={styles.modalCenteredBox} entering={ZoomIn.duration(300).springify().damping(20)} exiting={ZoomOut.duration(200)}>
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
          </Animated.View>
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
  playerCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundElevated,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
  },
  playerCountText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '800',
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
  
  // Clean Modal Styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCenteredBox: {
    width: '100%',
    backgroundColor: theme.backgroundCard,
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
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
    fontSize: 64,
    fontWeight: '900',
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
    color: theme.background,
    fontSize: 18,
    fontWeight: '800',
  },
});