import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Flame, Trophy } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { lightColors as colors } from '../src/constants/colors';
import AnimatedStreakFlame from '../src/components/AnimatedStreakFlame';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';

const TOP_RANK_COLORS = {
  1: { number: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  2: { number: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
  3: { number: '#B45309', bg: '#FFF7ED', border: '#FFEDD5' },
};

interface LeaderboardEntry {
  rank: number | string;
  name: string;
  streak: number;
  isCurrentUser?: boolean;
  id: string;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useApp();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const apiData = await apiService.getLeaderboard();
      
      const formattedData: LeaderboardEntry[] = apiData.map((item: any, index: number) => {
        const isMe = user ? item.id === user.id : false;
        return {
          id: item.id,
          rank: index + 1,
          name: isMe && user?.name ? user.name : (item.name || 'Operative'),
          streak: item.streak,
          isCurrentUser: isMe
        };
      });

      setLeaderboardData(formattedData);
    } catch (error) {
      console.error("Failed to load leaderboard", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Global Streak</Text>
          <View style={styles.flameContainer}>
            <AnimatedStreakFlame onPress={() => {}} />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.podiumContainer}>
              <Trophy size={40} color={colors.primary} strokeWidth={1.5} />
              <Text style={styles.podiumText}>Keep the fire burning!</Text>
            </View>

            {leaderboardData.map((entry, index) => {
              const rankNum = typeof entry.rank === 'number' ? entry.rank : 999;
              const isTop3 = rankNum <= 3;
              const rankTheme = isTop3 ? TOP_RANK_COLORS[rankNum as keyof typeof TOP_RANK_COLORS] : null;
              
              return (
                <Animated.View 
                  key={`${entry.id}-${index}`}
                  entering={FadeInDown.delay(index * 50).springify()}
                  style={[
                    styles.leaderboardRow,
                    isTop3 && { backgroundColor: rankTheme?.bg, borderColor: rankTheme?.border },
                    entry.isCurrentUser && styles.currentUserRow
                  ]}
                >
                  <View style={styles.rankContainer}>
                    <Text style={[styles.rankNumber, isTop3 && { color: rankTheme?.number, fontWeight: '900' }]}>
                      #{entry.rank}
                    </Text>
                  </View>

                  <View style={styles.nameContainer}>
                    <Text style={[styles.nameText, entry.isCurrentUser && { color: colors.primary, fontWeight: '800' }]}>
                      {entry.name}
                    </Text>
                    {entry.isCurrentUser && (
                      <View style={styles.youBadge}><Text style={styles.youBadgeText}>YOU</Text></View>
                    )}
                  </View>

                  <View style={styles.streakContainer}>
                    <Flame size={14} color={colors.textSecondary} />
                    <Text style={styles.streakNumber}>{entry.streak}</Text>
                  </View>
                </Animated.View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  flameContainer: { width: 44, alignItems: 'flex-end' },
  podiumContainer: { alignItems: 'center', paddingVertical: 20 },
  podiumText: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F3F4F6' },
  currentUserRow: { borderColor: colors.primary, backgroundColor: '#FFFBF0' },
  rankContainer: { width: 45, marginRight: 12, alignItems: 'center' },
  rankNumber: { fontSize: 16, fontWeight: '700', color: '#9CA3AF' },
  nameContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameText: { fontSize: 16, fontWeight: '600' },
  youBadge: { backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  youBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  streakContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 12 },
  streakNumber: { fontSize: 16, fontWeight: '700' }
});