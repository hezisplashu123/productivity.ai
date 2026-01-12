import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Flame, Trophy } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { lightColors as colors } from '../src/constants/colors';
import AnimatedStreakFlame from '../src/components/AnimatedStreakFlame'; // Import the animation

const { height } = Dimensions.get('window');

interface LeaderboardEntry {
  rank: number;
  name: string;
  streak: number;
  isCurrentUser?: boolean;
}

export default function LeaderboardScreen() {
  const router = useRouter();

  // Dummy data
  const leaderboardData: LeaderboardEntry[] = [
    { rank: 1, name: 'Alex', streak: 45 },
    { rank: 2, name: 'Sam', streak: 32 },
    { rank: 3, name: 'Jordan', streak: 28 },
    { rank: 4, name: 'You', streak: 12, isCurrentUser: true },
    { rank: 5, name: 'Taylor', streak: 10 },
    { rank: 6, name: 'Casey', streak: 8 },
    { rank: 7, name: 'Morgan', streak: 5 },
    { rank: 8, name: 'Riley', streak: 3 },
    { rank: 9, name: 'Jamie', streak: 2 },
    { rank: 10, name: 'Quinn', streak: 1 },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={28} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Global Streak</Text>
            {/* Replaced static icon with AnimatedStreakFlame */}
            <View style={styles.animationWrapper}>
                <AnimatedStreakFlame onPress={() => {}} />
            </View>
          </View>
          
          <View style={{ width: 44 }} /> 
        </View>

        {/* Top 3 Podium Graphic */}
        <View style={styles.podiumContainer}>
            <Trophy size={40} color={colors.primary} />
            <Text style={styles.podiumText}>Keep the fire burning!</Text>
        </View>

        {/* List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {leaderboardData.map((entry, index) => (
            <Animated.View 
              key={entry.rank}
              entering={FadeInDown.delay(index * 50).springify()}
              style={[
                styles.leaderboardRow,
                entry.isCurrentUser && styles.currentUserRow,
              ]}
            >
              {/* Rank Column */}
              <View style={styles.rankContainer}>
                {getRankIcon(entry.rank) ? (
                  <Text style={styles.rankIcon}>{getRankIcon(entry.rank)}</Text>
                ) : (
                  <Text style={styles.rankNumber}>#{entry.rank}</Text>
                )}
              </View>

              {/* Name Column */}
              <View style={styles.nameContainer}>
                <Text
                  style={[
                    styles.nameText,
                    entry.isCurrentUser && styles.currentUserName,
                  ]}
                >
                  {entry.name}
                </Text>
                {entry.isCurrentUser && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>YOU</Text>
                  </View>
                )}
              </View>

              {/* Streak Column */}
              <View style={[
                  styles.streakContainer, 
                  entry.isCurrentUser && styles.currentUserStreakContainer
                ]}>
                <Flame size={14} color={entry.isCurrentUser ? colors.primary : colors.textSecondary} fill={entry.isCurrentUser ? colors.primary : "transparent"} />
                <Text style={[
                    styles.streakNumber,
                    entry.isCurrentUser && { color: colors.primary }
                ]}>
                    {entry.streak}
                </Text>
              </View>
            </Animated.View>
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Removed gap to let animation wrapper handle spacing
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  animationWrapper: {
    transform: [{ scale: 0.8 }], // Scale down slightly to fit header
    marginLeft: 0, 
  },
  podiumContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 8,
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
    padding: 24,
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
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  currentUserRow: {
    borderColor: colors.primary,
    backgroundColor: '#FFFBF0',
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankIcon: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
    fontFamily: 'monospace',
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
  currentUserName: {
    fontWeight: '800',
    color: colors.primary,
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
  },
  currentUserStreakContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
});