import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { Sparkles } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';

interface GapInterventionProps {
  duration: number; // in minutes
  startTime: number; // minutes from midnight
  onPress?: () => void;
}

export const GapIntervention: React.FC<GapInterventionProps> = ({
  duration,
  startTime,
  onPress,
}) => {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.gapCard}>
        {/* Diagonal Stripes Background */}
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFill}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <Defs>
            <Pattern
              id={`diagonalHatch-gap-${startTime}`}
              patternUnits="userSpaceOnUse"
              width="8"
              height="8"
              patternTransform="rotate(45)"
            >
              <Rect width="4" height="8" fill="rgba(245, 158, 11, 0.1)" />
              <Rect x="4" width="4" height="8" fill="transparent" />
            </Pattern>
          </Defs>
          <Rect
            width="100"
            height="100"
            fill={`url(#diagonalHatch-gap-${startTime})`}
          />
        </Svg>

        <View style={styles.content}>
          <View style={styles.header}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={styles.label}>
              Ghost Time Detected ({formatDuration(duration)})
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.aiButton}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <Text style={styles.aiButtonText}>Fill with Recommendation</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  gapCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    padding: 16,
    minHeight: 80,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    zIndex: 1,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  aiButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  aiButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});