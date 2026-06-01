import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Share2, RefreshCw, ThumbsUp } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { SwipableCardStack, SwipableCardData } from '../src/components/SwipableCardStack';
import { BottomNav } from '../src/components/BottomNav';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { lightColors as colors } from '../src/constants/colors';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';
import { storage } from '../src/utils/storage';

type PromptCard = {
  id: string;
  text: string;
  category: string;
  tags?: string[];
};

export default function HomeScreen() {
  const router = useRouter();
  const { pendingRequestsCount } = useApp();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [currentPrompt, setCurrentPrompt] = useState<PromptCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  const loadSession = useCallback(async () => {
    const stored = await storage.getGameSession();
    if (!stored) {
      router.replace('/');
      return null;
    }
    setSessionId(stored.sessionId);
    setRoomCode(stored.roomCode);
    return stored.sessionId;
  }, [router]);

  const fetchNextPrompt = useCallback(async (activeSessionId: string) => {
    const result = await apiService.getNextPrompt(activeSessionId);
    setCurrentPrompt(result.prompt);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const id = await loadSession();
        if (!id) return;
        await fetchNextPrompt(id);
      } catch (e: any) {
        Alert.alert('Connection issue', e.message || 'Could not load the next card.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadSession, fetchNextPrompt]);

  const deckCards: SwipableCardData[] = useMemo(() => {
    if (!currentPrompt) return [];
    return [
      {
        id: currentPrompt.id,
        label: currentPrompt.text,
        category: currentPrompt.category,
      },
    ];
  }, [currentPrompt]);

  const handleSwipe = async (swipedLeft: boolean) => {
    if (!sessionId || !currentPrompt || actionBusy) return;
    setActionBusy(true);
    const promptSnapshot = currentPrompt;

    try {
      await apiService.recordSwipe(sessionId, promptSnapshot.id, swipedLeft);
      Haptics.impactAsync(
        swipedLeft ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
      );
      setCurrentPrompt(null);
      await fetchNextPrompt(sessionId);
    } catch (e: any) {
      Alert.alert('Sync failed', e.message || 'Could not save your swipe.');
      setCurrentPrompt(promptSnapshot);
    } finally {
      setActionBusy(false);
    }
  };

  const handleMoreLikeThis = async () => {
    if (!sessionId || !currentPrompt || actionBusy) return;
    setActionBusy(true);
    try {
      await apiService.boostCategory(sessionId, currentPrompt.category);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Noted', `We'll lean harder into ${currentPrompt.category}.`);
      setCurrentPrompt(null);
      await fetchNextPrompt(sessionId);
    } catch (e: any) {
      Alert.alert('Could not boost', e.message || 'Try again.');
    } finally {
      setActionBusy(false);
    }
  };

  const handlePivot = async () => {
    if (!sessionId || actionBusy) return;
    setActionBusy(true);
    try {
      await apiService.pivotSession(sessionId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setCurrentPrompt(null);
      await fetchNextPrompt(sessionId);
    } catch (e: any) {
      Alert.alert('Pivot failed', e.message || 'Try again.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleShareCard = async () => {
    if (!currentPrompt) return;
    const shareLine = `"${currentPrompt.text}"\n\n— Hezi conversation card • #deepconvos`;
    try {
      await Share.share({ message: shareLine });
    } catch {
      /* user dismissed */
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ErrorBoundary name="HomeScreen">
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <View>
              <Text style={styles.roomLabel}>ROOM</Text>
              <Text style={styles.roomCode}>{roomCode || '----'}</Text>
            </View>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => router.push('/social')}
              activeOpacity={0.7}
            >
              <Users size={22} color={colors.text} />
              {pendingRequestsCount > 0 && <View style={styles.badge} />}
            </TouchableOpacity>
          </View>

          <View style={styles.deckSection}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
              <SwipableCardStack
                key={currentPrompt?.id ?? 'empty'}
                cards={deckCards}
                onSwipeLeft={() => handleSwipe(true)}
                onSwipeRight={() => handleSwipe(false)}
                leftLabel="Answer & Explore Depth"
                rightLabel="Skip, change topic, or avoid bad mood"
                emptyMessage={actionBusy ? 'Dealing next card...' : 'Tap Pivot Topic for a fresh lane'}
              />
            )}
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareCard}
              disabled={!currentPrompt}
              activeOpacity={0.8}
            >
              <Share2 size={18} color={colors.primary} />
              <Text style={styles.shareText}>Copy for social</Text>
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={handlePivot}
                disabled={actionBusy || !sessionId}
                activeOpacity={0.85}
              >
                <RefreshCw size={18} color={colors.text} />
                <Text style={styles.secondaryActionText}>Pivot Topic</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryAction}
                onPress={handleMoreLikeThis}
                disabled={actionBusy || !currentPrompt}
                activeOpacity={0.85}
              >
                <ThumbsUp size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>Give us more like this</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.swipeHint}>← Answer / like   ·   Skip / dislike →</Text>
          </View>

          <BottomNav activeTab="Home" />
        </SafeAreaView>
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  roomLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 1.5,
  },
  roomCode: { fontSize: 28, fontWeight: '900', color: colors.text, marginTop: 2, letterSpacing: 4 },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  deckSection: { flex: 1, justifyContent: 'center' },
  loader: { marginTop: 80 },
  controls: { paddingHorizontal: 24, paddingBottom: 110 },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 12,
  },
  shareText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  actionRow: { flexDirection: 'row', gap: 10 },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryActionText: { fontSize: 14, fontWeight: '700', color: colors.text },
  primaryAction: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  primaryActionText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  swipeHint: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
  },
});
