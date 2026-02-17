import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Flame, Users, Globe, Info, X, Trophy, Shield, Zap, Target } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';
import { lightColors as colors } from '../src/constants/colors';
import { UserProfileModal } from '../src/components/UserProfileModal';

const { width } = Dimensions.get('window');

// --- STANDARD PROGRESSION TIERS ---
const TIERS = [
  { name: 'Recruit', min: 0, color: '#94A3B8', icon: Shield },
  { name: 'Agent', min: 3, color: '#3B82F6', icon: Zap },
  { name: 'Veteran', min: 7, color: '#8B5CF6', icon: Target },
  { name: 'Elite', min: 14, color: '#F59E0B', icon: Trophy },
  { name: 'Legend', min: 30, color: '#EF4444', icon: Flame },
];

const getTier = (streak: number) => {
  return [...TIERS].reverse().find(t => streak >= t.min) || TIERS[0];
};

const getNextTier = (streak: number) => {
  return TIERS.find(t => t.min > streak) || null;
};

// --- INTERACTIVE FIRE COMPONENT ---
const InteractiveFire = ({ onPress }: { onPress: () => void }) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(1.5, { damping: 10, stiffness: 200 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} hitSlop={{top:10,bottom:10,left:10,right:10}}>
      <Animated.View style={[styles.fireButton, animatedStyle]}>
        <Flame size={16} color={colors.primary} fill={colors.primary} />
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- MAIN SCREEN ---
export default function LeaderboardScreen() {
  const router = useRouter();
  const { user } = useApp();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myEntry, setMyEntry] = useState<any | null>(null);
  const [mode, setMode] = useState<'global' | 'friends'>('global');
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [user, mode]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const apiData = await apiService.getLeaderboard(mode, user?.id);
      
      const formattedData = apiData.map((item: any, index: number) => {
        const isMe = user ? item.id === user.id : false;
        const tier = getTier(item.streak);
        return {
          id: item.id,
          rank: index + 1,
          name: isMe && user?.name ? user.name : (item.name || 'Operative'),
          streak: item.streak,
          isCurrentUser: isMe,
          tier
        };
      });

      let me = formattedData.find((d: any) => d.isCurrentUser);
      if (!me && user?.email) {
        const myProfile = await apiService.getUserProfile(user.email);
        const streak = myProfile.stats?.streak || 0;
        me = {
          id: user.id,
          name: user.name || 'Me',
          streak: streak,
          rank: 0, 
          isCurrentUser: true,
          tier: getTier(streak)
        };
      }
      setMyEntry(me || null);
      setData(formattedData);
    } catch (error) {
      console.error("Failed to load leaderboard", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (userId: string) => {
    Haptics.selectionAsync();
    setSelectedUserId(userId);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>INTELLIGENCE</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleBtn, mode === 'global' && styles.toggleBtnActive]}
                onPress={() => { Haptics.selectionAsync(); setMode('global'); }}
              >
                <Globe size={14} color={mode === 'global' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.toggleText, mode === 'global' && styles.toggleTextActive]}>Global</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, mode === 'friends' && styles.toggleBtnActive]}
                onPress={() => { Haptics.selectionAsync(); setMode('friends'); }}
              >
                <Users size={14} color={mode === 'friends' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.toggleText, mode === 'friends' && styles.toggleTextActive]}>Friends</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {data.length === 0 ? (
                <View style={styles.emptyState}>
                  <Users size={48} color={colors.textLight} />
                  <Text style={styles.emptyText}>No operatives found.</Text>
                  <Text style={styles.emptySubtext}>Add friends to compete.</Text>
                </View>
              ) : (
                <>
                  {/* Podium Section */}
                  <View style={styles.podiumContainer}>
                    {data.slice(0, 3).map((entry) => {
                      const isFirst = entry.rank === 1;
                      return (
                        <TouchableOpacity 
                          key={entry.id} 
                          onPress={() => handleUserPress(entry.id)}
                          activeOpacity={0.9}
                          style={[styles.podiumItem, isFirst && styles.podiumFirst]}
                        >
                          <Animated.View entering={FadeInDown.delay(200).springify()} style={{alignItems: 'center'}}>
                            <View style={[styles.podiumAvatar, isFirst && { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]}>
                              <Text style={[styles.podiumRank, isFirst && { color: '#F59E0B' }]}>{entry.rank}</Text>
                            </View>
                            <Text style={styles.podiumName} numberOfLines={1}>{entry.name}</Text>
                            <View style={[styles.podiumBadge, isFirst && { backgroundColor: '#FFF7ED' }]}>
                              <entry.tier.icon size={10} color={entry.tier.color} />
                              <Text style={[styles.podiumStreak, { color: entry.tier.color }]}>{entry.streak} Days</Text>
                            </View>
                          </Animated.View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* List Section */}
                  <View style={styles.listSection}>
                    <Text style={styles.listHeader}>RANKINGS</Text>
                    {data.slice(3).map((entry, index) => (
                      <Animated.View 
                        key={entry.id}
                        entering={FadeInDown.delay(index * 50 + 300)}
                      >
                        <TouchableOpacity 
                          style={[styles.row, entry.isCurrentUser && styles.rowMe]}
                          onPress={() => handleUserPress(entry.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.rowRank}>{entry.rank}</Text>
                          
                          <View style={styles.rowInfo}>
                            <Text style={[styles.rowName, entry.isCurrentUser && { color: colors.primary }]}>
                              {entry.name}
                            </Text>
                            <Text style={[styles.rowTier, { color: entry.tier.color }]}>{entry.tier.name}</Text>
                          </View>
                          
                          <View style={styles.rowRight}>
                            <View style={styles.streakBadge}>
                              <Flame size={12} color={colors.textSecondary} />
                              <Text style={styles.rowStreak}>{entry.streak}</Text>
                            </View>
                            {!entry.isCurrentUser && <InteractiveFire onPress={() => {}} />}
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Sticky Footer */}
            {myEntry && (
              <View style={styles.footer}>
                <View style={styles.footerTop}>
                  <View>
                      <Text style={styles.footerLabel}>YOUR STATUS</Text>
                      <Text style={[styles.footerTierName, { color: myEntry.tier.color }]}>
                        {myEntry.tier.name}
                      </Text>
                  </View>
                  <View style={styles.streakBigBox}>
                      <Text style={styles.streakBigNum}>{myEntry.streak}</Text>
                      <Flame size={20} color={colors.primary} fill={colors.primary} />
                  </View>
                </View>
                
                {getNextTier(myEntry.streak) ? (
                  <View style={styles.progressContainer}>
                      <View style={styles.progressHeader}>
                          <Text style={styles.progressText}>Next: {getNextTier(myEntry.streak)?.name}</Text>
                          <Text style={styles.progressText}>
                              {myEntry.streak} / {getNextTier(myEntry.streak)?.min} Days
                          </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                          <View 
                              style={[
                                  styles.progressBarFill, 
                                  { width: `${(myEntry.streak / (getNextTier(myEntry.streak)?.min || 1)) * 100}%` }
                              ]} 
                          />
                      </View>
                  </View>
                ) : (
                  <View style={styles.maxRankContainer}>
                      <Trophy size={16} color="#FFF" />
                      <Text style={styles.maxRankText}>MAX RANK ACHIEVED</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        <UserProfileModal 
          visible={!!selectedUserId} 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1.5, marginBottom: 8 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 20, padding: 4 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, gap: 6 },
  toggleBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: colors.primary },

  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },

  scrollView: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 160 },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 100, opacity: 0.5 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '700', color: colors.text },
  emptySubtext: { fontSize: 14, color: colors.textSecondary },

  // Podium
  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', height: 200, marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  podiumItem: { alignItems: 'center', width: '30%', marginBottom: 10 },
  podiumFirst: { width: '35%', height: 200, justifyContent: 'flex-end' },
  podiumAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 2, borderColor: '#E5E7EB' },
  podiumRank: { color: '#9CA3AF', fontWeight: '800', fontSize: 18 },
  podiumName: { color: colors.text, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  podiumBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  podiumStreak: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },

  // List
  listSection: { paddingHorizontal: 20 },
  listHeader: { color: colors.textLight, fontSize: 12, fontWeight: '800', marginBottom: 16, letterSpacing: 1, marginLeft: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  rowMe: { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  rowRank: { color: colors.textSecondary, fontWeight: '700', width: 30, fontSize: 14 },
  rowInfo: { flex: 1 },
  rowName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  rowTier: { color: colors.textSecondary, fontSize: 11, marginTop: 2, fontWeight: '500' },
  
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F9FAFB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  rowStreak: { color: colors.text, fontWeight: '700', fontSize: 14 },
  fireButton: { padding: 8, backgroundColor: '#FFF7ED', borderRadius: 8 },

  // Footer
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: '#FFFFFF', padding: 24, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10
  },
  footerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  footerLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  footerTierName: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 2 },
  streakBigBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakBigNum: { color: colors.primary, fontSize: 28, fontWeight: '800' },
  progressContainer: { width: '100%' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  progressBarBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  maxRankContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: colors.primary, borderRadius: 12 },
  maxRankText: { color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 1 }
});