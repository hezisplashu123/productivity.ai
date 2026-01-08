import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { TimelineTask } from './TimelineDashboard';
import { lightColors as colors } from '../constants/colors';

const TIMELINE_LEFT_MARGIN = 40;
const PIXELS_PER_MINUTE = 1.5;
const CONNECTOR_WIDTH = 20;

interface TimelineTaskCardProps {
  task: TimelineTask;
  pixelsPerMinute: number;
  onPress?: () => void;
}

export const TimelineTaskCard: React.FC<TimelineTaskCardProps> = ({
  task,
  pixelsPerMinute,
  onPress,
}) => {
  const topPosition = task.startTime * pixelsPerMinute;
  const cardHeight = (task.endTime - task.startTime) * pixelsPerMinute;
  const minHeight = 60; // Minimum card height for visibility

  // Format time (e.g., "10:00")
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const startTimeFormatted = formatTime(task.startTime);
  const endTimeFormatted = formatTime(task.endTime);

  return (
    <View style={[styles.container, { top: topPosition }]}>
      {/* Time Label on Left */}
      <View style={styles.timeLabelContainer}>
        <Text style={styles.timeLabel}>{startTimeFormatted}</Text>
      </View>

      {/* Connector Line */}
      <View style={styles.connector} />

      {/* Task Card */}
      <TouchableOpacity
        style={[
          styles.card,
          {
            minHeight: Math.max(cardHeight, minHeight),
            height: Math.max(cardHeight, minHeight),
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTextContainer}>
              <Text style={styles.taskTitle} numberOfLines={2}>
                {task.title}
              </Text>
              {task.description && (
                <Text style={styles.taskDescription} numberOfLines={2}>
                  {task.description}
                </Text>
              )}
            </View>
            {/* Checkbox on Right */}
            <View style={styles.checkboxContainer}>
              {task.completed ? (
                <CheckCircle2 size={24} color={colors.primary} fill={colors.primary} />
              ) : (
                <Circle size={24} color={colors.border} strokeWidth={2} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: TIMELINE_LEFT_MARGIN,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timeLabelContainer: {
    width: 50,
    alignItems: 'flex-end',
    paddingRight: 12,
    paddingTop: 4,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  connector: {
    width: CONNECTOR_WIDTH,
    height: 1,
    backgroundColor: colors.border,
    marginTop: 8,
  },
  card: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 14,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  taskDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  checkboxContainer: {
    paddingTop: 2,
  },
});

