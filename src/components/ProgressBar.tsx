import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { lightColors as colors } from '../constants/colors';

interface ProgressBarProps {
  progress: number; // 0-1
  total: number;
  completed: number;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total,
  completed,
  animated = true,
}) => {
  const width = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      width.value = withSpring(progress, {
        damping: 15,
        stiffness: 100,
      });
    } else {
      width.value = withTiming(progress, { duration: 300 });
    }
  }, [progress, animated]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${width.value * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>Progress</Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {completed}/{total} Tasks
        </Text>
      </View>
      <View style={[styles.barContainer, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.bar, animatedStyle, { backgroundColor: colors.primary }]}>
          <MotiView
            from={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{
              type: 'timing',
              duration: 1000,
              loop: true,
            }}
            style={[styles.glow, { backgroundColor: colors.primaryLight }]}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  count: {
    fontSize: 14,
    fontWeight: '500',
  },
  barContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
  },
});

