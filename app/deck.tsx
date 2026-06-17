import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, CornerDownLeft, CornerDownRight, RotateCcw } from 'lucide-react-native';
import { SwipableCardStack } from '../src/components/SwipableCardStack';
import { DiscussionModal } from '../src/components/DiscussionModal';
import { useApp } from '../src/context/AppContext';
import { useDeckQueue } from '../src/hooks/useDeckQueue';
import { Theme } from '../src/constants/colors';
import { SwipableCardData } from '../src/types';

export default function DeckScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, gamemode, theme } = useApp();
  const styles = getStyles(theme);

  const categoryId = (params.categoryId as string) || 'friends-deep-talk';

  const { cards, loading, handleIndexChange, handleSwipeLeft: recordSwipeLeft, handleSwipeRight } = useDeckQueue({
    categoryId,
    gamemode,
    profileId: user?.profileId,
  });

  const [activeDiscussion, setActiveDiscussion] = useState<SwipableCardData | null>(null);

  const handleSwipeLeft = (card: SwipableCardData) => {
    setActiveDiscussion(card);
    recordSwipeLeft(card);
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

      {activeDiscussion && (
        <DiscussionModal
          activeDiscussion={activeDiscussion}
          onClose={closeDiscussion}
          theme={theme}
        />
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
});