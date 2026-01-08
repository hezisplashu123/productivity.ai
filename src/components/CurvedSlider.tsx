import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 80;
const THUMB_SIZE = 32;
const TRACK_HEIGHT = 8;
const CURVE_DEPTH = 12; // Depth of the curve (positive = convex/upward, negative = concave/inward)

interface CurvedSliderProps {
  value: number; // 0-1 normalized position
  onValueChange: (value: number) => void;
  curveType?: 'concave' | 'convex'; // 'concave' = inward (hours), 'convex' = upward (distraction)
  leftLabel?: string;
  rightLabel?: string;
  color?: string;
}

// Generate curved path for slider track - MUST be a worklet if called from useAnimatedProps
const generateCurvedPath = (
  width: number,
  height: number,
  curveType: 'concave' | 'convex',
  fillPercentage: number = 1
): { fullPath: string; fillPath: string } => {
  'worklet';
  const curveControl = curveType === 'convex' ? CURVE_DEPTH : -CURVE_DEPTH;
  const midY = height / 2 + curveControl;
  
  // Create a curved path using quadratic bezier
  // Full track path
  const fullPath = `M 0 ${height / 2} Q ${width / 2} ${midY} ${width} ${height / 2}`;
  
  // Filled portion path
  const fillWidth = width * fillPercentage;
  const fillMidY = curveType === 'convex' ? CURVE_DEPTH : -CURVE_DEPTH;
  const fillPath = `M 0 ${height / 2} Q ${fillWidth / 2} ${height / 2 + fillMidY * (fillWidth / width) * 2} ${fillWidth} ${height / 2}`;
  
  return { fullPath, fillPath };
};

// Calculate Y position along curve for thumb - MUST be a worklet if called from useAnimatedStyle
const getCurveY = (
  x: number,
  width: number,
  curveType: 'concave' | 'convex'
): number => {
  'worklet';
  const normalizedX = x / width;
  const curveControl = curveType === 'convex' ? CURVE_DEPTH : -CURVE_DEPTH;
  // Quadratic bezier calculation: y = (1-t)^2 * y0 + 2*(1-t)*t * y1 + t^2 * y2
  // For our case: start at height/2, control at midY, end at height/2
  const t = normalizedX;
  const y0 = TRACK_HEIGHT / 2;
  const y1 = TRACK_HEIGHT / 2 + curveControl;
  const y2 = TRACK_HEIGHT / 2;
  const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2;
  return y;
};

export const CurvedSlider: React.FC<CurvedSliderProps> = ({
  value,
  onValueChange,
  curveType = 'convex',
  leftLabel,
  rightLabel,
  color = '#F59E0B',
}) => {
  const translateX = useSharedValue(value * SLIDER_WIDTH);
  const isDragging = useSharedValue(false);
  const startX = useSharedValue(value * SLIDER_WIDTH);

  // Initialize position
  useEffect(() => {
    translateX.value = value * SLIDER_WIDTH;
  }, []);

  const updateValue = (newValue: number) => {
    onValueChange(newValue);
  };

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      startX.value = translateX.value;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((e) => {
      const newPosition = Math.max(0, Math.min(SLIDER_WIDTH, startX.value + e.translationX));
      translateX.value = newPosition;
      const normalizedValue = newPosition / SLIDER_WIDTH;
      runOnJS(updateValue)(normalizedValue);
    })
    .onEnd(() => {
      isDragging.value = false;
      const normalizedValue = translateX.value / SLIDER_WIDTH;
      runOnJS(updateValue)(normalizedValue);
    });

  // Handle track press
  const handleTrackPress = (e: { nativeEvent: { locationX: number } }) => {
    const { locationX } = e.nativeEvent;
    const newPosition = Math.max(0, Math.min(SLIDER_WIDTH, locationX));
    translateX.value = withSpring(newPosition, { damping: 15, stiffness: 200 });
    updateValue(newPosition / SLIDER_WIDTH);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Animated styles
  const thumbStyle = useAnimatedStyle(() => {
    'worklet';
    const x = translateX.value;
    const y = getCurveY(x, SLIDER_WIDTH, curveType) - THUMB_SIZE / 2;
    return {
      transform: [{ translateX: x - THUMB_SIZE / 2 }, { translateY: y }],
    };
  });

  // Animated path props for filled track
  const fillPathProps = useAnimatedProps(() => {
    'worklet';
    const fillPercentage = translateX.value / SLIDER_WIDTH;
    const { fillPath } = generateCurvedPath(SLIDER_WIDTH, TRACK_HEIGHT, curveType, fillPercentage);
    return {
      d: fillPath,
    };
  });

  const fullPath = generateCurvedPath(SLIDER_WIDTH, TRACK_HEIGHT, curveType, 1).fullPath;

  return (
    <View style={styles.container}>
      <View style={styles.sliderContainer}>
        <TouchableOpacity
          style={styles.trackPressable}
          onPress={handleTrackPress}
          activeOpacity={1}
        >
          <Svg width={SLIDER_WIDTH} height={TRACK_HEIGHT + 20} style={styles.svg}>
            {/* Background track */}
            <Path
              d={fullPath}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth={TRACK_HEIGHT}
              fill="none"
              strokeLinecap="round"
            />
            {/* Filled track */}
            <AnimatedPath
              animatedProps={fillPathProps}
              stroke={color}
              strokeWidth={TRACK_HEIGHT}
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
        
        {/* Draggable Thumb */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sliderThumb, { backgroundColor: color }, thumbStyle]}>
            <View style={styles.sliderThumbInner} />
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Labels */}
      {(leftLabel || rightLabel) && (
        <View style={styles.labelsContainer}>
          {leftLabel && <Text style={styles.label}>{leftLabel}</Text>}
          {rightLabel && <Text style={styles.label}>{rightLabel}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SLIDER_WIDTH,
    marginVertical: 20,
  },
  sliderContainer: {
    height: TRACK_HEIGHT + 20 + THUMB_SIZE,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  trackPressable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: THUMB_SIZE / 2,
    left: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sliderThumbInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
});

