import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { X, Trophy, Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { height } = Dimensions.get('window');

interface LeaderboardEntry {
  rank: number;
  name: string;
  streak: number;
  isCurrentUser?: boolean;
}

interface LeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
  currentStreak?: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  visible,
  onClose,
  currentStreak = 12,
}) => {
  // Dummy leaderboard data
  const leaderboardData: LeaderboardEntry[] = [
    { rank: 1, name: 'Alex', streak: 45 },
    { rank: 2, name: 'Sam', streak: 32 },
    { rank: 3, name: 'Jordan', streak: 28 },
    { rank: 4, name: 'You', streak: currentStreak, isCurrentUser: true },
    { rank: 5, name: 'Taylor', streak: 10 },
    { rank: 6, name: 'Casey', streak: 8 },
    { rank: 7, name: 'Morgan', streak: 5 },
  ];

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  // Ensure we don't render anything if not visible to save resources
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlayContainer}>
        {/* Dark Overlay Background */}
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(200)}
          style={styles.backdrop} 
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            onPress={handleClose} 
            activeOpacity={1} 
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View 
          entering={ZoomIn.duration(300).damping(15)} 
          exiting={ZoomOut.duration(200)}
          style={styles.modalContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Flame size={24} color="#FF4500" fill="#FF4500" />
              <Text style={styles.headerTitle}>Global Streak</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Leaderboard List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {leaderboardData.map((entry) => (
              <View
                key={entry.rank}
                style={[
                  styles.leaderboardRow,
                  entry.isCurrentUser && styles.currentUserRow,
                ]}
              >
                <View style={styles.rankContainer}>
                  {getRankIcon(entry.rank) ? (
                    <Text style={styles.rankIcon}>{getRankIcon(entry.rank)}</Text>
                  ) : (
                    <Text style={styles.rankNumber}>{entry.rank}</Text>
                  )}
                </View>

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
                    <Text style={styles.currentUserLabel}>You</Text>
                  )}
                </View>

                <View style={styles.streakContainer}>
                  <Flame size={14} color="#FF4500" />
                  <Text style={styles.streakNumber}>{entry.streak}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🔥 Keep your streak alive to climb the ranks!
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    // On Android, we want the modal to sit at the bottom but not cover the whole screen
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: height * 0.75, // Take up 75% of screen
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  currentUserRow: {
    backgroundColor: 'rgba(255, 69, 0, 0.1)', // Orange tint
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 0, 0.3)',
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankIcon: {
    fontSize: 20,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  nameContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  currentUserName: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  currentUserLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF4500',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF4500',
    fontFamily: 'monospace',
  },
  footer: {
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
});