import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Task } from '../types';
import { TimeCard } from './TimeCard';
import { lightColors as colors } from '../constants/colors';

interface FocusQueueProps {
  tasks: Task[];
  onPlayTask: (task: Task) => void;
}

export const FocusQueue: React.FC<FocusQueueProps> = ({
  tasks,
  onPlayTask,
}) => {
  // Filter and sort tasks
  const queueTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        const status = t.status || (t.completed ? 'completed' : 'queued');
        return status !== 'completed';
      })
      .sort((a, b) => {
        const aStatus = a.status || (a.completed ? 'completed' : 'queued');
        const bStatus = b.status || (b.completed ? 'completed' : 'queued');
        // In progress first
        if (aStatus === 'in_progress' && bStatus !== 'in_progress') return -1;
        if (bStatus === 'in_progress' && aStatus !== 'in_progress') return 1;
        // Then by order
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        // Finally by id
        return a.id.localeCompare(b.id);
      });
  }, [tasks]);

  const renderItem = ({ item }: { item: Task }) => {
    const status = item.status || (item.completed ? 'completed' : 'queued');
    // Calculate progress for in_progress tasks (this would come from a timer state)
    const progress = status === 'in_progress' ? 0.5 : 0; // TODO: Get actual progress

    return (
      <TimeCard
        task={item}
        onPlay={onPlayTask}
        progress={progress}
      />
    );
  };

  if (queueTasks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tasks in queue</Text>
        <Text style={styles.emptySubtext}>Add tasks to get started</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={queueTasks}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 12,
    paddingBottom: 20,
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

