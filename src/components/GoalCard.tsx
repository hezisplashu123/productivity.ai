import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { Goal } from '../types';
import { Target } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
  showGlow?: boolean;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress, showGlow = false }) => {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 300 }}
    >
      <TouchableOpacity
        style={[
          styles.container, 
          { 
            backgroundColor: colors.backgroundCard,
            borderColor: colors.border,
            shadowColor: colors.primary,
          },
          showGlow && [styles.glowContainer, { borderColor: colors.glow }]
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {showGlow && (
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{
              type: 'timing',
              duration: 2000,
              loop: true,
            }}
            style={[styles.glow, { backgroundColor: colors.primary }]}
          />
        )}
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.glow }]}>
            <Target size={24} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]}>{goal.title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {goal.status === 'active' ? 'In Progress' : 'Completed'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  glowContainer: {
  },
  glow: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    borderRadius: 100,
    opacity: 0.1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
});

