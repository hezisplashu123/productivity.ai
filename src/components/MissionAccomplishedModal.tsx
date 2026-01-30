import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Trophy, Clock, CheckCircle2, ArrowRight, X } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface MissionAccomplishedModalProps {
  visible: boolean;
  goalTitle: string;
  totalTime: number; // in minutes
  taskCount: number;
  onArchive: () => void;
  onClose: () => void;
  isHistoryView?: boolean; // New prop to toggle display mode
}

export const MissionAccomplishedModal: React.FC<MissionAccomplishedModalProps> = ({
  visible,
  goalTitle,
  totalTime,
  taskCount,
  onArchive,
  onClose,
  isHistoryView = false,
}) => {
  const scale = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      if (!isHistoryView) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.selectionAsync();
      }
      // Smoother entry animation
      scale.value = withSpring(1, { 
        damping: 18, 
        stiffness: 120, 
        mass: 1 
      });
    } else {
      scale.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handleMainAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Animate out before calling callback
    scale.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        if (isHistoryView) {
          runOnJS(onClose)();
        } else {
          runOnJS(onArchive)();
        }
      }
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Only show confetti if it's a fresh win, not history review */}
        {!isHistoryView && (
          <ConfettiCannon 
            count={200} 
            origin={{x: width/2, y: 0}} 
            fadeOut 
            fallSpeed={3000} 
          />
        )}
        
        <Animated.View style={[styles.card, containerStyle]}>
          {isHistoryView && (
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <View style={styles.iconHeader}>
            <View style={[styles.trophyCircle, isHistoryView && styles.trophyCircleHistory]}>
              <Trophy size={40} color={isHistoryView ? colors.primary : "#F59E0B"} fill={isHistoryView ? colors.primary : "#F59E0B"} />
            </View>
          </View>

          <Text style={styles.title}>
            {isHistoryView ? "MISSION LOG" : "MISSION ACCOMPLISHED"}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {goalTitle}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Clock size={24} color={colors.primary} style={{ marginBottom: 8 }} />
              <Text style={styles.statValue}>
                {(totalTime / 60).toFixed(1)}h
              </Text>
              <Text style={styles.statLabel}>Focus Time</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <CheckCircle2 size={24} color="#10B981" style={{ marginBottom: 8 }} />
              <Text style={styles.statValue}>{taskCount}</Text>
              <Text style={styles.statLabel}>Tasks Done</Text>
            </View>
          </View>

          <View style={[styles.efficiencyBadge, isHistoryView && { backgroundColor: '#F3F4F6' }]}>
            <Text style={[styles.efficiencyText, isHistoryView && { color: colors.textSecondary }]}>
              {isHistoryView ? "📂 Archived Record" : "⚡ Efficiency Rating: S-Class"}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.archiveButton, isHistoryView && styles.archiveButtonHistory]}
            onPress={handleMainAction}
            activeOpacity={0.9}
          >
            <Text style={[styles.archiveButtonText, isHistoryView && { color: colors.text }]}>
              {isHistoryView ? "CLOSE LOG" : "SEND TO PROFILE"}
            </Text>
            {!isHistoryView && <ArrowRight size={20} color="#FFFFFF" />}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    paddingBottom: 32,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 4,
  },
  iconHeader: {
    marginBottom: 20,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FDE68A',
  },
  trophyCircleHistory: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  efficiencyBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 30,
  },
  efficiencyText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 14,
  },
  archiveButton: {
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  archiveButtonHistory: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  archiveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});