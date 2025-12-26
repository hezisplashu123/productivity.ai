import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { lightColors as colors } from '../constants/colors';

const Star: React.FC<{ x: number; y: number; delay: number; colors: any }> = ({ x, y, delay, colors }) => {
  return (
    <MotiView
      style={[styles.star, { left: `${x}%`, top: `${y}%`, backgroundColor: colors.primary }]}
      from={{ opacity: 0.3 }}
      animate={{
        opacity: [0.3, 1, 0.3],
        scale: [1, 1.2, 1],
      }}
      transition={{
        type: 'timing',
        duration: 2000 + Math.random() * 2000,
        delay,
        loop: true,
      }}
    />
  );
};

export const StarBackground: React.FC = () => {
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2000,
  }));

  return (
    <View style={styles.container}>
      {stars.map((star) => (
        <Star key={star.id} x={star.x} y={star.y} delay={star.delay} colors={colors} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
  },
});

