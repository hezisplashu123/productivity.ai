import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator
} from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { X, Flame } from 'lucide-react-native';
import { apiService } from '../services/api';
import { useApp } from '../context/AppContext';

const { height } = Dimensions.get('window');

interface LeaderboardEntry {
  id: string;
  name: string;
  streak: number;
  rank: number;
  isCurrentUser: boolean;
}

interface LeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ visible, onClose }) => {
  const { user } = useApp();
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchData();
    }
  }, [visible]);

  const fetchData = async () => {
    try {
      // 1. Fetch Global Leaderboard
      const leaderboard = await apiService.getLeaderboard();
      
      // 2. Map and Rank data
      const rankedData: LeaderboardEntry[] = leaderboard.map((item: any, index: number) => {
        const isMe = user ? item.id === user.id : false;
        return {
          id: item.id,
          // FIX: Use context name if it's me, otherwise use server name
          name: isMe && user?.name ? user.name : item.name,
          streak: item.streak,
          rank: index + 1,
          isCurrentUser: isMe
        };
      });

      // 3. Check if current user is in top 10
      const meInTop10 = rankedData.find(d => d.isCurrentUser);

      // 4. If not in top 10, fetch my own profile to display my stats at bottom
      if (!meInTop10 && user?.email) {
        const myProfile = await apiService.getUserProfile(user.email);
        setCurrentUserEntry({
          id: user.id,
          name: user.name || 'Me', // Use local name
          streak: myProfile.stats?.streak || 0, // Get fresh streak from profile stats
          rank: 0, 
          isCurrentUser: true
        });
      } else {
        setCurrentUserEntry(null);
      }

      setData(rankedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlayContainer}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View entering={ZoomIn} exiting={ZoomOut} style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Flame size={24} color="#FF4500" fill="#FF4500" />
              <Text style={styles.headerTitle}>Global Streak</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FF4500" size="large" />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {data.map((entry) => (
                  <View key={entry.id} style={[styles.leaderboardRow, entry.isCurrentUser && styles.currentUserRow]}>
                    <View style={styles.rankContainer}>
                      {getRankIcon(entry.rank) ? (
                        <Text style={styles.rankIcon}>{getRankIcon(entry.rank)}</Text>
                      ) : (
                        <Text style={styles.rankNumber}>{entry.rank}</Text>
                      )}
                    </View>
                    <View style={styles.nameContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {/* FIX: Displays Real Name */}
                        <Text style={[styles.nameText, entry.isCurrentUser && styles.currentUserName]}>
                          {entry.name}
                        </Text>
                        
                        {/* Badge says "YOU" separately */}
                        {entry.isCurrentUser && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youText}>YOU</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.streakContainer}>
                      <Flame size={14} color="#FF4500" />
                      <Text style={styles.streakNumber}>{entry.streak}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Sticky User Row (If not in top 10) */}
              {currentUserEntry && (
                <View style={styles.stickyUserContainer}>
                  <View style={[styles.leaderboardRow, styles.currentUserRow, { marginBottom: 0 }]}>
                    <View style={styles.rankContainer}>
                      <Text style={styles.rankNumber}>--</Text>
                    </View>
                    <View style={styles.nameContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[styles.nameText, styles.currentUserName]}>
                          {currentUserEntry.name}
                        </Text>
                        <View style={styles.youBadge}>
                          <Text style={styles.youText}>YOU</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.streakContainer}>
                      <Flame size={14} color="#FF4500" />
                      <Text style={styles.streakNumber}>{currentUserEntry.streak}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: { flex: 1, justifyContent: 'flex-end', zIndex: 1000 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  modalContainer: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: height * 0.75, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 }, // Extra padding for sticky footer
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, marginBottom: 8, backgroundColor: 'rgba(255, 255, 255, 0.03)' },
  currentUserRow: { backgroundColor: 'rgba(255, 69, 0, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 69, 0, 0.3)' },
  rankContainer: { width: 30, alignItems: 'center', marginRight: 12 },
  rankIcon: { fontSize: 20 },
  rankNumber: { fontSize: 16, fontWeight: '700', color: '#6B7280', fontFamily: 'monospace' },
  nameContainer: { flex: 1 },
  nameText: { fontSize: 16, fontWeight: '600', color: '#E5E7EB' },
  currentUserName: { color: '#FFFFFF', fontWeight: '700' },
  youBadge: { backgroundColor: '#FF4500', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  youText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  streakContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  streakNumber: { fontSize: 16, fontWeight: '700', color: '#FF4500', fontFamily: 'monospace' },
  
  // Sticky footer style
  stickyUserContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 10,
  }
});