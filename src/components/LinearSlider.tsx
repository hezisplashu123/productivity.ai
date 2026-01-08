import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Matching dimensions with NoiseLevelSlider exactly
const SLIDER_WIDTH = SCREEN_WIDTH - 80; 
const THUMB_SIZE = 28;
const TRACK_HEIGHT = 8;

interface LinearSliderProps {
  value: number; // 0-1 normalized position
  onValueChange: (value: number) => void;
  leftLabel?: string;
  rightLabel?: string;
  minValue?: number; // e.g. 4
  maxValue?: number; // e.g. 12
}

export const LinearSlider: React.FC<LinearSliderProps> = ({
  value,
  onValueChange,
  leftLabel,
  rightLabel,
  minValue = 4,
  maxValue = 12,
}) => {
  const translateX = useSharedValue(value * (SLIDER_WIDTH - THUMB_SIZE));
  const isDragging = useSharedValue(false);
  const startX = useSharedValue(0);
  const lastHapticValue = React.useRef(value);

  // Initialize position
  useEffect(() => {
    translateX.value = value * (SLIDER_WIDTH - THUMB_SIZE);
  }, [value]);

  const updateValue = (newValue: number) => {
    onValueChange(newValue);
  };

  const triggerHaptic = (normalizedValue: number) => {
    // Trigger haptic roughly every hour step (0.125 for range of 8)
    const step = 0.125; 
    const currentStep = Math.round(normalizedValue / step);
    const lastStep = Math.round(lastHapticValue.current / step);
    
    if (currentStep !== lastStep) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      lastHapticValue.current = normalizedValue;
    }
  };

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      startX.value = translateX.value;
      runOnJS(Haptics.selectionAsync)();
    })
    .onUpdate((e) => {
      const newPosition = Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, startX.value + e.translationX));
      translateX.value = newPosition;
      const normalizedValue = newPosition / (SLIDER_WIDTH - THUMB_SIZE);
      
      runOnJS(triggerHaptic)(normalizedValue);
      runOnJS(updateValue)(normalizedValue);
    })
    .onEnd(() => {
      isDragging.value = false;
      const normalizedValue = translateX.value / (SLIDER_WIDTH - THUMB_SIZE);
      runOnJS(updateValue)(normalizedValue);
    });

  // Handle track press
  const handleTrackPress = (e: { nativeEvent: { locationX: number } }) => {
    const { locationX } = e.nativeEvent;
    const newPosition = Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, locationX - THUMB_SIZE / 2));
    translateX.value = withSpring(newPosition, { damping: 15, stiffness: 200 });
    const normalizedValue = newPosition / (SLIDER_WIDTH - THUMB_SIZE);
    updateValue(normalizedValue);
    triggerHaptic(normalizedValue);
  };

  // Animated styles
  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Color interpolation: Green (Short day) -> Yellow -> Red (Long day)
  const fillColorStyle = useAnimatedStyle(() => {
    const normalizedValue = translateX.value / (SLIDER_WIDTH - THUMB_SIZE);
    const color = interpolateColor(
      normalizedValue,
      [0, 0.5, 1],
      ['#10B981', '#FBBF24', '#EF4444'] // Green -> Yellow -> Red
    );
    return { backgroundColor: color };
  });

  const thumbInnerColorStyle = useAnimatedStyle(() => {
    const normalizedValue = translateX.value / (SLIDER_WIDTH - THUMB_SIZE);
    const color = interpolateColor(
      normalizedValue,
      [0, 0.5, 1],
      ['#10B981', '#FBBF24', '#EF4444'] // Green -> Yellow -> Red
    );
    return { backgroundColor: color };
  });

  const fillStyle = useAnimatedStyle(() => {
    const fillWidth = translateX.value + THUMB_SIZE / 2;
    return { width: fillWidth };
  });

  return (
    <View style={styles.container}>
      {/* Slider Track */}
      <View style={styles.sliderContainer}>
        <TouchableOpacity
          style={styles.trackPressable}
          onPress={handleTrackPress}
          activeOpacity={1}
        >
          {/* Background Track (Light Gray) */}
          <View style={styles.trackBackground} />
          
          {/* Filled Track (Dynamic Color) */}
          <Animated.View style={[styles.trackFill, fillStyle, fillColorStyle]} />
        </TouchableOpacity>

        {/* Draggable Thumb (White Circle with Dynamic Color Dot) */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sliderThumb, thumbStyle]}>
            <Animated.View style={[styles.sliderThumbInner, thumbInnerColorStyle]} />
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Labels below slider */}
      <View style={styles.labelsContainer}>
        <Text style={styles.label}>{leftLabel || `${minValue}h`}</Text>
        <Text style={styles.label}>{rightLabel || `${maxValue}h`}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SLIDER_WIDTH,
    marginVertical: 16,
  },
  sliderContainer: {
    height: THUMB_SIZE,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  trackPressable: {
    width: '100%',
    height: TRACK_HEIGHT * 3, // Larger touch area
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    position: 'absolute',
    width: '100%',
    height: TRACK_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: TRACK_HEIGHT / 2,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    left: 0, // Thumb starts at 0 relative to its container
  },
  sliderThumbInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  label: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
});