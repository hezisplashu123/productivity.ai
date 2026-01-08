import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FlatList } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Circle, CheckCircle2 } from 'lucide-react-native';
import { TimelineTask } from './TimelineDashboard';
import { lightColors as colors } from '../constants/colors';
import { GapIntervention } from './GapIntervention';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_HEIGHT = 80;
const CONNECTOR_LINE_WIDTH = 2;

interface UpNextListProps {
  tasks: TimelineTask[];
  currentTimeMinutes: number;
  onTaskPress?: (task: TimelineTask) => void;
  onGapPress?: (gapMinutes: number, startTime: number) => void;
}

export const UpNextList: React.FC<UpNextListProps> = ({
  tasks,
  currentTimeMinutes,
  onTaskPress,
  onGapPress,
}) => {
  // Filter out completed tasks and tasks that haven't started yet
  const upcomingTasks = tasks.filter(
    (task) => !task.completed && task.startTime > currentTimeMinutes
  );

  // Calculate gaps between tasks
  const itemsWithGaps: Array<
    | { type: 'task'; data: TimelineTask }
    | { type: 'gap'; data: { startTime: number; endTime: number; duration: number } }
  > = [];

  for (let i = 0; i < upcomingTasks.length; i++) {
    itemsWithGaps.push({ type: 'task', data: upcomingTasks[i] });
    
    // Check for gap before next task
    if (i < upcomingTasks.length - 1) {
      const currentEnd = upcomingTasks[i].endTime;
      const nextStart = upcomingTasks[i + 1].startTime;
      const gap = nextStart - currentEnd;
      
      if (gap > 15) {
        itemsWithGaps.push({
          type: 'gap',
          data: {
            startTime: currentEnd,
            endTime: nextStart,
            duration: gap,
          },
        });
      }
    }
  }

  const renderItem = ({ item, index }: { item: typeof itemsWithGaps[0]; index: number }) => {
    if (item.type === 'gap') {
      return (
        <GapIntervention
          duration={item.data.duration}
          startTime={item.data.startTime}
          onPress={() => onGapPress?.(item.data.duration, item.data.startTime)}
        />
      );
    }

    const task = item.data;
    const formatTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    return (
      <TouchableOpacity
        style={styles.taskItem}
        onPress={() => onTaskPress?.(task)}
        activeOpacity={0.7}
      >
        {/* Connector Line */}
        {index > 0 && <View style={styles.connectorLine} />}
        
        {/* Task Card */}
        <View style={styles.taskCard}>
          <View style={styles.taskContent}>
            <View style={styles.taskTextContainer}>
              <Text style={styles.taskTitle} numberOfLines={1}>
                {task.title}
              </Text>
              <Text style={styles.taskTime}>
                {formatTime(task.startTime)} - {formatTime(task.endTime)}
              </Text>
            </View>
            <View style={styles.checkboxContainer}>
              {task.completed ? (
                <CheckCircle2 size={20} color={colors.primary} fill={colors.primary} />
              ) : (
                <Circle size={20} color={colors.border} strokeWidth={2} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Vertical Connector Line */}
      <View style={styles.mainConnector} />
      
      <FlatList
        data={itemsWithGaps}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.type === 'task' ? `task-${item.data.id}` : `gap-${index}`
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        getItemLayout={(data, index) => ({
          length: ITEM_HEIGHT + 12,
          offset: (ITEM_HEIGHT + 12) * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  mainConnector: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 0,
    width: CONNECTOR_LINE_WIDTH,
    backgroundColor: colors.border,
    opacity: 0.3,
    zIndex: 0,
  },
  listContent: {
    paddingLeft: 40,
    paddingRight: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  taskItem: {
    marginBottom: 12,
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    left: -20,
    top: -12,
    width: 20,
    height: CONNECTOR_LINE_WIDTH,
    backgroundColor: colors.border,
    opacity: 0.3,
    zIndex: 1,
  },
  taskCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    opacity: 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: ITEM_HEIGHT,
  },
  taskContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  checkboxContainer: {
    padding: 4,
  },
});

