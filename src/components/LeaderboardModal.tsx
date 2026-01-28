import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { X, Flame, Trophy, Shield, Zap, Target } from 'lucide-react-native';
import { apiService } from '../services/api';
import { useApp } from '../context/AppContext';
import * as Haptics from 'expo-haptics';
import { lightColors as colors } from '../constants/colors';

const { height } = Dimensions.get('window');

// --- TIERS CONFIGURATION ---
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

// --- INTERACTIVE FIRE BUTTON ---
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

// --- MAIN COMPONENT ---
interface LeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ visible, onClose }) => {
  const { user } = useApp();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myEntry, setMyEntry] = useState<any | null>(null);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchData();
    }
  }, [visible]);

  const fetchData = async () => {
    try {
      const leaderboard = await apiService.getLeaderboard();
      
      const rankedData = leaderboard.map((item: any, index: number) => {
        const isMe = user ? item.id === user.id : false;
        const tier = getTier(item.streak).name;
        return {
          id: item.id,
          name: isMe && user?.name ? user.name : item.name,
          streak: item.streak,
          rank: index + 1,
          isCurrentUser: isMe,
          tier
        };
      });

      let me = rankedData.find(d => d.isCurrentUser);
      if (!me && user?.email) {
        const myProfile = await apiService.getUserProfile(user.email);
        const streak = myProfile.stats?.streak || 0;
        me = {
          id: user.id,
          name: user.name || 'Me',
          streak: streak,
          rank: 0,
          isCurrentUser: true,
          tier: getTier(streak).name
        };
      }
      setMyEntry(me || null);
      setData(rankedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespect = () => {
    // Visual feedback handled by component
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlayContainer}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View entering={SlideInUp.springify()} exiting={FadeOut} style={styles.modalContainer}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>GLOBAL STREAK</Text>
              <Text style={styles.headerSubtitle}>Top Operatives</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <>
              <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Podium Section */}
                <View style={styles.podiumContainer}>
                  {data.slice(0, 3).map((entry) => {
                    const isFirst = entry.rank === 1;
                    return (
                      <View key={entry.id} style={[styles.podiumItem, isFirst && styles.podiumFirst]}>
                        <View style={[styles.podiumAvatar, isFirst && { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]}>
                          <Text style={[styles.podiumRank, isFirst && { color: '#F59E0B' }]}>{entry.rank}</Text>
                        </View>
                        <Text style={styles.podiumName} numberOfLines={1}>{entry.name}</Text>
                        <View style={[styles.podiumBadge, isFirst && { backgroundColor: '#FFF7ED' }]}>
                          <Flame size={10} color={isFirst ? "#F59E0B" : "#9CA3AF"} />
                          <Text style={[styles.podiumStreak, isFirst && { color: '#F59E0B' }]}>{entry.streak}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* List Section */}
                <View style={styles.listSection}>
                  <Text style={styles.listHeader}>RANKINGS</Text>
                  {data.slice(3).map((entry, index) => (
                    <Animated.View 
                      key={entry.id} 
                      entering={FadeIn.delay(index * 50)}
                      style={[styles.row, entry.isCurrentUser && styles.rowMe]}
                    >
                      <Text style={styles.rowRank}>{entry.rank}</Text>
                      <View style={styles.rowInfo}>
                        <Text style={[styles.rowName, entry.isCurrentUser && { color: colors.primary }]}>
                          {entry.name}
                        </Text>
                        <Text style={styles.rowTier}>{entry.tier}</Text>
                      </View>
                      
                      {/* UPDATED: Uses Flame Icon instead of Emoji */}
                      <View style={styles.rowRight}>
                        <View style={styles.streakBadge}>
                          <Flame size={12} color={colors.textSecondary} />
                          <Text style={styles.rowStreak}>{entry.streak}</Text>
                        </View>
                        {!entry.isCurrentUser && <InteractiveFire onPress={handleRespect} />}
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </ScrollView>

              {/* My Stats Footer */}
              {myEntry && (
                <View style={styles.footer}>
                  <View style={styles.footerTop}>
                    <View>
                        <Text style={styles.footerLabel}>YOUR STATUS</Text>
                        <Text style={styles.footerTierName}>{getTier(myEntry.streak).name}</Text>
                    </View>
                    <View style={styles.streakBigBox}>
                        <Text style={styles.streakBigNum}>{myEntry.streak}</Text>
                        <Flame size={20} color={colors.primary} fill={colors.primary} />
                    </View>
                  </View>
                  
                  {getNextTier(myEntry.streak) ? (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressText}>Next Rank: {getNextTier(myEntry.streak)?.name}</Text>
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
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: { flex: 1, justifyContent: 'flex-end', zIndex: 1000 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: height * 0.85, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1.5, marginBottom: 4 },
  headerSubtitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.backgroundLight, justifyContent: 'center', alignItems: 'center' },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 140 },

  // Podium
  podiumContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', height: 160, marginBottom: 20, paddingHorizontal: 20, marginTop: 10 },
  podiumItem: { alignItems: 'center', width: '30%', marginBottom: 10 },
  podiumFirst: { width: '35%', height: 160, justifyContent: 'flex-end' },
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
  
  // New Streak Badge Style
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