import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Task } from '../types';
import { lightColors as colors } from '../constants/colors';
import { TimeCursor } from './TimeCursor';
import { TimelineTaskCard } from './TimelineTaskCard';
import { GhostGap } from './GhostGap';

export interface TimelineTask extends Task {
  startTime: number; // Minutes from midnight (0-1440)
  endTime: number; // Minutes from midnight
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TIMELINE_LEFT_MARGIN = 40;
const MINUTES_PER_DAY = 24 * 60; // 1440 minutes
const PIXELS_PER_MINUTE = 1.5; // Adjust for visual spacing
const TOTAL_TIMELINE_HEIGHT = MINUTES_PER_DAY * PIXELS_PER_MINUTE;


interface TimelineDashboardProps {
  tasks: TimelineTask[];
  onGhostGapPress?: (gapMinutes: number, startTime: number) => void;
}

export const TimelineDashboard: React.FC<TimelineDashboardProps> = ({
  tasks,
  onGhostGapPress,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Calculate current time position
  const currentTimeMinutes = useMemo(() => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return hours * 60 + minutes;
  }, [currentTime]);

  // Sort tasks by start time
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => a.startTime - b.startTime);
  }, [tasks]);

  // Calculate ghost gaps
  const ghostGaps = useMemo(() => {
    const gaps: Array<{ startTime: number; endTime: number; duration: number }> = [];
    
    // Check gap before first task
    if (sortedTasks.length > 0 && sortedTasks[0].startTime > 15) {
      gaps.push({
        startTime: 0,
        endTime: sortedTasks[0].startTime,
        duration: sortedTasks[0].startTime,
      });
    }

    // Check gaps between tasks
    for (let i = 0; i < sortedTasks.length - 1; i++) {
      const currentEnd = sortedTasks[i].endTime;
      const nextStart = sortedTasks[i + 1].startTime;
      const gap = nextStart - currentEnd;

      if (gap > 15) {
        gaps.push({
          startTime: currentEnd,
          endTime: nextStart,
          duration: gap,
        });
      }
    }

    return gaps;
  }, [sortedTasks]);

  // Combine tasks and gaps, sorted by time
  const timelineItems = useMemo(() => {
    const items: Array<
      | { type: 'task'; data: TimelineTask }
      | { type: 'ghost'; data: { startTime: number; endTime: number; duration: number } }
    > = [];

    // Add tasks
    sortedTasks.forEach((task) => {
      items.push({ type: 'task', data: task });
    });

    // Add ghost gaps
    ghostGaps.forEach((gap) => {
      items.push({ type: 'ghost', data: gap });
    });

    // Sort by start time
    return items.sort((a, b) => {
      const aStart = a.type === 'task' ? a.data.startTime : a.data.startTime;
      const bStart = b.type === 'task' ? b.data.startTime : b.data.startTime;
      return aStart - bStart;
    });
  }, [sortedTasks, ghostGaps]);

  // Generate dashed line for timeline spine using SVG
  const DashedTimelineLine = () => (
    <Svg height={TOTAL_TIMELINE_HEIGHT} width="2" style={styles.timelineSvg}>
      <Line
        x1="1"
        y1="0"
        x2="1"
        y2={TOTAL_TIMELINE_HEIGHT}
        stroke="#E5E5E5"
        strokeWidth="2"
        strokeDasharray="4,4"
      />
    </Svg>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: TOTAL_TIMELINE_HEIGHT },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Vertical Timeline Spine - Dashed Line */}
        <View style={styles.timelineSpineContainer}>
          <DashedTimelineLine />
        </View>

        {/* Time Cursor */}
        <TimeCursor
          currentTimeMinutes={currentTimeMinutes}
          totalDayMinutes={MINUTES_PER_DAY}
        />

        {/* Timeline Items */}
        {timelineItems.map((item, index) => {
          if (item.type === 'task') {
            return (
              <TimelineTaskCard
                key={`task-${item.data.id}`}
                task={item.data}
                pixelsPerMinute={PIXELS_PER_MINUTE}
              />
            );
          } else {
            return (
              <GhostGap
                key={`ghost-${index}`}
                startTime={item.data.startTime}
                endTime={item.data.endTime}
                duration={item.data.duration}
                pixelsPerMinute={PIXELS_PER_MINUTE}
                onPress={() =>
                  onGhostGapPress?.(item.data.duration, item.data.startTime)
                }
              />
            );
          }
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingLeft: TIMELINE_LEFT_MARGIN,
    paddingRight: 20,
    paddingTop: 20,
    paddingBottom: 40,
    position: 'relative',
  },
  timelineSpineContainer: {
    position: 'absolute',
    left: TIMELINE_LEFT_MARGIN - 1,
    top: 0,
    width: 2,
    height: TOTAL_TIMELINE_HEIGHT,
  },
  timelineSvg: {
    position: 'absolute',
  },
});

