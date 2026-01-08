import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { X, Trophy, Flame } from 'lucide-react-native';

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
  const [showContent, setShowContent] = useState(false);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

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

  useEffect(() => {
    if (visible) {
      setShowContent(true);
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0, { duration: 200 }, () => {
        'worklet';
        if (!visible) {
          setShowContent(false);
        }
      });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const modalStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value * 0.9,
    };
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (!showContent) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View style={[styles.modalContainer, modalStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Flame size={24} color="#FF4500" />
              <Text style={styles.headerTitle}>Streak Leaderboard</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Leaderboard List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {leaderboardData.map((entry, index) => (
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
                  <Flame size={16} color="#FF4500" />
                  <Text style={styles.streakNumber}>{entry.streak}</Text>
                  <Text style={styles.streakLabel}>days</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Your current streak highlight */}
          <View style={styles.footer}>
            <View style={styles.footerContent}>
              <Flame size={20} color="#FF4500" />
              <Text style={styles.footerText}>
                Your current streak: <Text style={styles.footerHighlight}>{currentStreak} days</Text>
              </Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 12,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  currentUserRow: {
    backgroundColor: 'rgba(255, 69, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 0, 0.3)',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankIcon: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'monospace',
  },
  nameContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentUserName: {
    fontWeight: '700',
  },
  currentUserLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF4500',
    marginTop: 2,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF4500',
    fontFamily: 'monospace',
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 69, 0, 0.05)',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  footerHighlight: {
    fontWeight: '700',
    color: '#FF4500',
  },
});





