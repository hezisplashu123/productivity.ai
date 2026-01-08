import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Clock } from 'lucide-react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { lightColors as colors } from '../constants/colors';

const TIMELINE_LEFT_MARGIN = 40;
const CONNECTOR_WIDTH = 20;

interface GhostGapProps {
  startTime: number;
  endTime: number;
  duration: number;
  pixelsPerMinute: number;
  onPress?: () => void;
}

export const GhostGap: React.FC<GhostGapProps> = ({
  startTime,
  endTime,
  duration,
  pixelsPerMinute,
  onPress,
}) => {
  const topPosition = startTime * pixelsPerMinute;
  const gapHeight = duration * pixelsPerMinute;
  const minHeight = 40;

  // Format time
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

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
      style={[
        styles.container,
        {
          top: topPosition,
          minHeight: Math.max(gapHeight, minHeight),
          height: Math.max(gapHeight, minHeight),
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Time Label */}
      <View style={styles.timeLabelContainer}>
        <Text style={styles.timeLabel}>{formatTime(startTime)}</Text>
      </View>

      {/* Connector Line */}
      <View style={styles.connector} />

      {/* Ghost Block with Diagonal Stripes */}
      <View style={styles.ghostBlock}>
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFill}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <Defs>
            <Pattern
              id={`diagonalHatch-${startTime}`}
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
            fill={`url(#diagonalHatch-${startTime})`}
          />
        </Svg>

        <View style={styles.ghostContent}>
          <View style={styles.ghostHeader}>
            <Clock size={16} color={colors.primary} />
            <Text style={styles.ghostLabel}>
              {formatDuration(duration)} of potential!
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addTaskButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: TIMELINE_LEFT_MARGIN,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  timeLabelContainer: {
    width: 50,
    alignItems: 'flex-end',
    paddingRight: 12,
    paddingTop: 4,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    opacity: 0.6,
  },
  connector: {
    width: CONNECTOR_WIDTH,
    height: 1,
    backgroundColor: colors.border,
    marginTop: 8,
    opacity: 0.5,
  },
  ghostBlock: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
    overflow: 'hidden',
    justifyContent: 'center',
    padding: 14,
  },
  ghostContent: {
    zIndex: 1,
    gap: 10,
  },
  ghostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ghostLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'left',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    marginTop: 4,
  },
  addTaskButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

