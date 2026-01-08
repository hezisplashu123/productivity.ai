import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedReaction,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 80;
const THUMB_SIZE = 40;
const TRACK_HEIGHT = 8;
const CURVE_DEPTH = 12; // Depth of the curve (positive = convex/upward)

// Archetype snap points (0 = Monk, 50 = Human, 100 = Goldfish)
const ARCHETYPE_POINTS = [0, 50, 100];
const SNAP_THRESHOLD = 8; // Distance in percentage points to snap

// Dynamic habit descriptions
const HABIT_DESCRIPTIONS = [
  {
    range: [0, 20],
    label: 'Monk Mode',
    description: 'I can focus for 2+ hours without checking my phone.',
  },
  {
    range: [21, 70],
    label: 'Normal',
    description: 'I check notifications every 30 minutes.',
  },
  {
    range: [71, 100],
    label: 'Goldfish Mode',
    description: 'I check my phone constantly / get distracted easily.',
  },
];

interface FluidDistractionSliderProps {
  value: number; // 0-100
  onValueChange: (value: number) => void;
}

export const FluidDistractionSlider: React.FC<FluidDistractionSliderProps> = ({
  value,
  onValueChange,
}) => {
  // Shared values for UI thread operations
  const translateX = useSharedValue((value / 100) * (SLIDER_WIDTH - THUMB_SIZE));
  const isDragging = useSharedValue(false);
  
  // Track previous value to detect changes for haptics
  const lastSnappedValue = useSharedValue(value);
  const lastThreshold = useSharedValue(Math.floor(value / 10));
  
  // Function to trigger haptics on threshold crossings
  const triggerThresholdHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  // Initialize position
  useEffect(() => {
    translateX.value = (value / 100) * (SLIDER_WIDTH - THUMB_SIZE);
  }, []);

  // Update JS state (runs on JS thread via runOnJS)
  const updateValue = (newValue: number) => {
    onValueChange(newValue);
  };

  // Find nearest archetype for magnetic snap
  const findNearestArchetype = (position: number): number => {
    'worklet';
    const percentage = (position / (SLIDER_WIDTH - THUMB_SIZE)) * 100;
    
    let nearest = ARCHETYPE_POINTS[0];
    let minDistance = Math.abs(percentage - ARCHETYPE_POINTS[0]);
    
    for (let i = 1; i < ARCHETYPE_POINTS.length; i++) {
      const distance = Math.abs(percentage - ARCHETYPE_POINTS[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = ARCHETYPE_POINTS[i];
      }
    }
    
    // Only snap if within threshold
    if (minDistance <= SNAP_THRESHOLD) {
      return nearest;
    }
    return percentage; // Return free position if not close enough
  };

  // Store starting position for pan gesture
  const startX = useSharedValue(0);

  // Pan gesture - runs entirely on UI thread
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      startX.value = translateX.value; // Store starting position
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((e) => {
      'worklet';
      // Calculate new position from start position + translation
      const newPosition = Math.max(
        0,
        Math.min(SLIDER_WIDTH - THUMB_SIZE, startX.value + e.translationX)
      );
      translateX.value = newPosition;
      
      // Calculate and update value in real-time (runs on JS thread)
      const percentage = (newPosition / (SLIDER_WIDTH - THUMB_SIZE)) * 100;
      const currentThreshold = Math.floor(percentage / 10);
      
      // Trigger haptics on 10% threshold crossings
      if (currentThreshold !== lastThreshold.value) {
        runOnJS(triggerThresholdHaptic)();
        lastThreshold.value = currentThreshold;
      }
      
      runOnJS(updateValue)(Math.round(percentage));
    })
    .onEnd(() => {
      isDragging.value = false;
      
      // Magnetic snap to nearest archetype
      const finalPosition = translateX.value;
      const snappedValue = findNearestArchetype(finalPosition);
      
      // Calculate snapped position
      const snappedPosition = (snappedValue / 100) * (SLIDER_WIDTH - THUMB_SIZE);
      
      // Animate to snapped position with spring
      translateX.value = withSpring(snappedPosition, {
        damping: 15,
        stiffness: 200,
      });
      
      // Update final value
      runOnJS(updateValue)(Math.round(snappedValue));
      
      // Haptic feedback on snap
      if (snappedValue !== lastSnappedValue.value) {
        runOnJS(Haptics.selectionAsync)();
        lastSnappedValue.value = snappedValue;
      }
    });

  // Handle track press (tap to jump) - runs on JS thread
  const handleTrackPress = (locationX: number) => {
    const newPosition = Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, locationX));
    
    translateX.value = withSpring(newPosition, {
      damping: 15,
      stiffness: 200,
    });
    
    const snappedValue = findNearestArchetype(newPosition);
    onValueChange(Math.round(snappedValue));
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Sync with external value changes (when not dragging)
  useAnimatedReaction(
    () => value,
    (newValue) => {
      if (!isDragging.value) {
        const newPosition = (newValue / 100) * (SLIDER_WIDTH - THUMB_SIZE);
        translateX.value = withSpring(newPosition, {
          damping: 15,
          stiffness: 200,
        });
      }
    }
  );

  // Generate curved path for slider track
  const generateCurvedPath = (fillPercentage: number = 1): { fullPath: string; fillPath: string } => {
    'worklet';
    const curveControl = CURVE_DEPTH;
    const midY = TRACK_HEIGHT / 2 + curveControl;
    
    // Full track path (convex/upward curve)
    const fullPath = `M 0 ${TRACK_HEIGHT / 2} Q ${SLIDER_WIDTH / 2} ${midY} ${SLIDER_WIDTH} ${TRACK_HEIGHT / 2}`;
    
    // Filled portion path
    const fillWidth = SLIDER_WIDTH * fillPercentage;
    const fillMidY = CURVE_DEPTH;
    const fillPath = `M 0 ${TRACK_HEIGHT / 2} Q ${fillWidth / 2} ${TRACK_HEIGHT / 2 + fillMidY * (fillWidth / SLIDER_WIDTH) * 2} ${fillWidth} ${TRACK_HEIGHT / 2}`;
    
    return { fullPath, fillPath };
  };

  // Calculate Y position along curve for thumb
  const getCurveY = (x: number): number => {
    'worklet';
    const normalizedX = x / SLIDER_WIDTH;
    const curveControl = CURVE_DEPTH;
    // Quadratic bezier calculation
    const t = normalizedX;
    const y0 = TRACK_HEIGHT / 2;
    const y1 = TRACK_HEIGHT / 2 + curveControl;
    const y2 = TRACK_HEIGHT / 2;
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2;
    return y;
  };

  const fullPath = generateCurvedPath(1).fullPath;

  // Animated path props for filled track
  const fillPathProps = useAnimatedProps(() => {
    'worklet';
    const fillPercentage = (translateX.value + THUMB_SIZE / 2) / SLIDER_WIDTH;
    const { fillPath } = generateCurvedPath(Math.max(0, Math.min(1, fillPercentage)));
    return {
      d: fillPath,
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    'worklet';
    const x = translateX.value + THUMB_SIZE / 2;
    const y = getCurveY(x) - THUMB_SIZE / 2;
    return {
      transform: [{ translateX: translateX.value }, { translateY: y }],
    };
  });

  // Get current habit description based on value
  const currentDescription = useMemo(() => {
    for (const desc of HABIT_DESCRIPTIONS) {
      if (value >= desc.range[0] && value <= desc.range[1]) {
        return desc;
      }
    }
    return HABIT_DESCRIPTIONS[1]; // Default to Normal
  }, [value]);

  // Animated opacity for description text (smooth transitions)
  const descriptionOpacity = useSharedValue(1);
  const prevDescriptionRef = useRef(currentDescription.label);

  useEffect(() => {
    if (prevDescriptionRef.current !== currentDescription.label) {
      // Fade out, change text, fade in
      descriptionOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          prevDescriptionRef.current = currentDescription.label;
          descriptionOpacity.value = withTiming(1, { duration: 200 });
        }
      });
    }
  }, [currentDescription.label, descriptionOpacity]);

  const descriptionStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Dynamic Habit Description */}
      <Animated.View style={[styles.descriptionContainer, descriptionStyle]}>
        <Text style={styles.descriptionText}>{currentDescription.description}</Text>
      </Animated.View>

      {/* Curved Slider Track (convex/upward) */}
      <View style={styles.sliderContainer}>
        <TouchableOpacity
          style={styles.trackPressable}
          onPress={(e) => {
            const { locationX } = e.nativeEvent;
            handleTrackPress(locationX);
          }}
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
              stroke="#F59E0B"
              strokeWidth={TRACK_HEIGHT}
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>
        
        {/* Draggable Thumb */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sliderThumb, thumbStyle]}>
            <View style={styles.sliderThumbInner} />
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Labels */}
      <View style={styles.labelsContainer}>
        <Text style={styles.label}>Monk</Text>
        <Text style={styles.labelCenter}>{currentDescription.label}</Text>
        <Text style={styles.label}>Goldfish</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SLIDER_WIDTH,
    marginVertical: 20,
  },
  descriptionContainer: {
    marginBottom: 24,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontWeight: '500',
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
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    // Increase hit slop
    minWidth: THUMB_SIZE + 20,
    minHeight: THUMB_SIZE + 20,
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
  },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  labelCenter: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
});

