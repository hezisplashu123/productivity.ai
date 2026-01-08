import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Task } from '../types';
import { lightColors as colors } from '../constants/colors';

interface CapacityHeaderProps {
  tasks: Task[];
}

const CIRCLE_SIZE = 80;
const STROKE_WIDTH = 6;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const CapacityHeader: React.FC<CapacityHeaderProps> = ({ tasks }) => {
  const { totalQueued, totalCompleted } = useMemo(() => {
    const queued = tasks
      .filter((t) => {
        const status = t.status || (t.completed ? 'completed' : 'queued');
        return status === 'queued' || status === 'in_progress';
      })
      .reduce((sum, t) => sum + (t.duration || t.timeBudget || 0), 0);

    const completed = tasks
      .filter((t) => {
        const status = t.status || (t.completed ? 'completed' : 'queued');
        return status === 'completed';
      })
      .reduce((sum, t) => sum + (t.duration || t.timeBudget || 0), 0);

    return {
      totalQueued: queued,
      totalCompleted: completed,
    };
  }, [tasks]);

  const total = totalQueued + totalCompleted;
  const progress = total > 0 ? totalCompleted / total : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Circular Progress */}
        <View style={styles.circleContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            {/* Background Circle */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={colors.border}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
            {/* Progress Circle */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={colors.primary}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            />
          </Svg>
          <View style={styles.circleTextContainer}>
            <Text style={styles.circleText}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        </View>

        {/* Text Info */}
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>
            You have{' '}
            <Text style={styles.highlightText}>
              {formatDuration(totalQueued)}
            </Text>{' '}
            of focus queued today.
          </Text>
          {totalCompleted > 0 && (
            <Text style={styles.subText}>
              {formatDuration(totalCompleted)} completed
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  circleTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  subText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});

