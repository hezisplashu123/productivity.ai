import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
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

const { width } = Dimensions.get('window');

// --- THEME COLORS FOR TOP 3 ---
const TOP_RANK_COLORS = {
  1: { number: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' }, // Goldish
  2: { number: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' }, // Silverish
  3: { number: '#B45309', bg: '#FFF7ED', border: '#FFEDD5' }, // Bronzish
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
      // 1. Fetch Top 10 from API
      const apiData = await apiService.getLeaderboard();
      
      // 2. Format Data
      const formattedData: LeaderboardEntry[] = apiData.map((item: any, index: number) => {
        const isMe = user ? item.id === user.id : false;
        return {
          id: item.id,
          rank: index + 1,
          // Use local context name if it's the current user (ensures it matches Profile)
          name: isMe && user?.name ? user.name : (item.name || 'Unknown Agent'),
          streak: item.streak,
          isCurrentUser: isMe
        };
      });

      // 3. Check if Current User is in Top 10
      const isUserInTop10 = formattedData.some(item => item.isCurrentUser);

      // 4. If not in Top 10, fetch user stats specifically and append
      if (!isUserInTop10 && user?.email) {
        try {
          const myProfile = await apiService.getUserProfile(user.email);
          formattedData.push({
            id: user.id,
            rank: '--', // Outside top 10
            name: user.name || 'Me',
            streak: myProfile.stats?.streak || 0,
            isCurrentUser: true
          });
        } catch (e) {
          console.log("Could not fetch user specific rank", e);
        }
      }

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
        
        {/* Header */}
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
                  {/* Rank Number */}
                  <View style={styles.rankContainer}>
                    <Text style={[
                      styles.rankNumber,
                      isTop3 && { color: rankTheme?.number, fontWeight: '900' }
                    ]}>
                      #{entry.rank}
                    </Text>
                  </View>

                  {/* Name */}
                  <View style={styles.nameContainer}>
                    <Text style={[
                      styles.nameText,
                      entry.isCurrentUser && { color: colors.primary, fontWeight: '800' }
                    ]}>
                      {entry.name}
                    </Text>
                    {entry.isCurrentUser && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>YOU</Text>
                      </View>
                    )}
                  </View>

                  {/* Streak Metric */}
                  <View style={styles.streakContainer}>
                    <Flame size={14} color={colors.textSecondary} />
                    <Text style={styles.streakNumber}>
                      {entry.streak}
                    </Text>
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  flameContainer: {
    width: 44,
    alignItems: 'flex-end',
  },
  podiumContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  podiumText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  currentUserRow: {
    borderColor: colors.primary,
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
  },
  rankContainer: {
    width: 45,
    marginRight: 12,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  youBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});