import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { CheckCircle2, Circle, GripVertical } from 'lucide-react-native';
import { Task, TimeBlock } from '../types';
import { TIME_BLOCKS, TIME_BLOCK_ORDER } from '../constants/timeBlocks';
import { lightColors as colors } from '../constants/colors';
import { TaskCard } from './TaskCard';
import * as Haptics from 'expo-haptics';

interface BucketListProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  onTaskReorder?: (taskId: string, newOrder: number, timeBlock: TimeBlock) => void;
}

interface TaskSection {
  title: string;
  data: Task[];
  timeBlock: TimeBlock;
}

export const BucketList: React.FC<BucketListProps> = ({
  tasks,
  onTaskComplete,
  onTaskReorder,
}) => {
  // Group tasks by time block
  const sections = useMemo(() => {
    const grouped: Record<TimeBlock, Task[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      anytime: [],
    };

    // Group tasks by time block, defaulting to 'anytime' if not set
    tasks.forEach((task) => {
      const block = task.timeBlock || 'anytime';
      grouped[block].push(task);
    });

    // Sort tasks within each block by order (if set), then by id
    Object.keys(grouped).forEach((block) => {
      grouped[block as TimeBlock].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return a.id.localeCompare(b.id);
      });
    });

    // Create sections in order, only including blocks with tasks
    const sections: TaskSection[] = TIME_BLOCK_ORDER.map((blockId) => {
      const blockConfig = TIME_BLOCKS[blockId];
      const blockTasks = grouped[blockId].filter((t) => !t.completed);
      const completedCount = grouped[blockId].filter((t) => t.completed).length;
      const remainingCount = blockTasks.length;

      return {
        title: `${blockConfig.emoji} ${blockConfig.name}${remainingCount > 0 ? ` (${remainingCount} Tasks Remaining)` : completedCount > 0 ? ' (Completed)' : ''}`,
        data: blockTasks,
        timeBlock: blockId,
      };
    }).filter((section) => section.data.length > 0 || tasks.some((t) => t.timeBlock === section.timeBlock));

    return sections;
  }, [tasks]);

  const renderSectionHeader = useCallback(({ section }: { section: TaskSection }) => {
    const blockConfig = TIME_BLOCKS[section.timeBlock];
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionDescription}>{blockConfig.description}</Text>
      </View>
    );
  }, []);

  const renderItem = useCallback(
    ({ item, index, section }: { item: Task; index: number; section: TaskSection }) => {
      return (
        <TaskCard
          key={item.id}
          task={item}
          onComplete={() => onTaskComplete(item.id)}
          index={index}
        />
      );
    },
    [onTaskComplete]
  );

  const renderSectionFooter = useCallback(() => {
    return <View style={styles.sectionFooter} />;
  }, []);

  if (sections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tasks scheduled</Text>
        <Text style={styles.emptySubtext}>Add tasks to get started</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      renderSectionFooter={renderSectionFooter}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: colors.backgroundLight,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sectionFooter: {
    height: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});









