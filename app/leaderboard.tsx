import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Flame, Trophy } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { lightColors as colors } from '../src/constants/colors';
import AnimatedStreakFlame from '../src/components/AnimatedStreakFlame';

const { width } = Dimensions.get('window');

// --- THEME COLORS FOR TOP 3 ---
const TOP_RANK_COLORS = {
  1: { number: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' }, // Goldish
  2: { number: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' }, // Silverish
  3: { number: '#B45309', bg: '#FFF7ED', border: '#FFEDD5' }, // Bronzish
};

interface LeaderboardEntry {
  rank: number;
  name: string;
  streak: number;
  isCurrentUser?: boolean;
}

export default function LeaderboardScreen() {
  const router = useRouter();

  const leaderboardData: LeaderboardEntry[] = [
    { rank: 1, name: 'Alex Vance', streak: 45 },
    { rank: 2, name: 'Sam Kovalsky', streak: 32 },
    { rank: 3, name: 'Jordan Mendoza', streak: 28 },
    { rank: 4, name: 'You', streak: 12, isCurrentUser: true },
    { rank: 5, name: 'Taylor Higgins', streak: 10 },
    { rank: 6, name: 'Casey Miller', streak: 8 },
    { rank: 7, name: 'Morgan Ross', streak: 5 },
    { rank: 8, name: 'Riley Smith', streak: 3 },
    { rank: 9, name: 'Jamie Doe', streak: 2 },
    { rank: 10, name: 'Quinn T.', streak: 1 },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        {/* Header - Line removed */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Global Streak</Text>
          <View style={styles.flameContainer}>
            <AnimatedStreakFlame onPress={() => {}} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Original Podium Text */}
          <View style={styles.podiumContainer}>
            <Trophy size={40} color={colors.primary} strokeWidth={1.5} />
            <Text style={styles.podiumText}>Keep the fire burning!</Text>
          </View>

          {leaderboardData.map((entry, index) => {
            const isTop3 = entry.rank <= 3;
            const rankTheme = isTop3 ? TOP_RANK_COLORS[entry.rank as keyof typeof TOP_RANK_COLORS] : null;
            
            return (
              <Animated.View 
                key={entry.rank}
                entering={FadeInDown.delay(index * 50).springify()}
                style={[
                  styles.leaderboardRow,
                  isTop3 && { backgroundColor: rankTheme?.bg, borderColor: rankTheme?.border },
                  entry.isCurrentUser && styles.currentUserRow
                ]}
              >
                {/* Rank Number with # */}
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

                {/* Streak Metric - High contrast */}
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
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    // Removed borderBottomWidth to remove the line
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
    backgroundColor: '#FFFBF0', // Very subtle orange tint for user
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
    color: '#1A1A1A', // Dark for visibility
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});