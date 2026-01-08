import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

interface SwitchTaxChartProps {
  height?: number;
}

// Theme colors
const DEEP_WORK_COLOR = '#00F0FF'; // Cyan/Teal for Deep Work
const GHOST_TIME_COLOR = '#FF4500'; // Safety Orange for Ghost Time
const TRANSPARENT = '#00000000'; // Transparent background

export const SwitchTaxChart: React.FC<SwitchTaxChartProps> = ({ 
  height = 200 
}) => {
  return (
    <View style={[styles.container, { height }]}>
      <LottieView
        source={require('../../assets/animations/Bar chart.json')}
        autoPlay
        loop={false}
        style={styles.animation}
        resizeMode="contain"
        colorFilters={[
          {
            keypath: 'Desktop - 1 Bg',
            color: TRANSPARENT, // Hide the white background
          },
          {
            keypath: 'Rectangle 1',
            color: DEEP_WORK_COLOR, // Deep Work - Cyan/Teal
          },
          {
            keypath: 'Rectangle 2',
            color: GHOST_TIME_COLOR, // Ghost Time - Orange
          },
          {
            keypath: 'Rectangle 3',
            color: DEEP_WORK_COLOR, // Deep Work - Cyan/Teal
          },
          {
            keypath: 'Rectangle 4',
            color: GHOST_TIME_COLOR, // Ghost Time - Orange
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});





