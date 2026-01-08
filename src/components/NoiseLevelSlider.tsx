import React, { useEffect, useMemo, useRef } from 'react';
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
import { Bell, Circle, VolumeX, Volume2 } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 80;
const THUMB_SIZE = 28;
const TRACK_HEIGHT = 8;
const AVERAGE_MARKER_POSITION = 0.8; // 80%

// Dynamic feedback text based on value
const getFeedbackText = (value: number): { text: string; label: string; color: string } => {
  const percentage = value * 100;
  
  if (percentage <= 20) {
    return { 
      label: 'Deep Work Haven',
      text: 'I work in total silence. Zero interruptions.',
      color: '#10B981' // Green
    };
  } else if (percentage <= 50) {
    return { 
      label: 'Flow Friendly',
      text: 'I get a few emails/slacks, but mostly focus.',
      color: '#34D399' // Light Green
    };
  } else if (percentage <= 80) {
    return { 
      label: 'The Modern Worker', 
      text: 'Constant pings. It\'s hard to find a rhythm.',
      color: '#F59E0B' // Orange
    };
  } else {
    return { 
      label: 'Survival Mode', 
      text: 'It\'s chaos. I\'m fighting for every minute.',
      color: '#EF4444' // Red
    };
  }
};

interface NoiseLevelSliderProps {
  value: number; // 0-1 normalized position
  onValueChange: (value: number) => void;
}

export const NoiseLevelSlider: React.FC<NoiseLevelSliderProps> = ({
  value,
  onValueChange,
}) => {
  const translateX = useSharedValue(value * (SLIDER_WIDTH - THUMB_SIZE));
  const isDragging = useSharedValue(false);
  const startX = useSharedValue(0);
  const lastHapticValue = useRef(value);
  const lastHapticTime = useRef(Date.now());

  // Initialize position
  useEffect(() => {
    translateX.value = value * (SLIDER_WIDTH - THUMB_SIZE);
  }, [value]);

  const updateValue = (newValue: number) => {
    onValueChange(newValue);
  };

  // Get haptic intensity based on position
  const getHapticIntensity = (normalizedValue: number): Haptics.ImpactFeedbackStyle => {
    if (normalizedValue < 0.3) {
      return Haptics.ImpactFeedbackStyle.Light;
    } else if (normalizedValue < 0.7) {
      return Haptics.ImpactFeedbackStyle.Medium;
    } else {
      return Haptics.ImpactFeedbackStyle.Heavy;
    }
  };

  // Trigger haptic with crescendo effect
  const triggerHaptic = (normalizedValue: number, isRapid: boolean = false) => {
    const intensity = getHapticIntensity(normalizedValue);
    const now = Date.now();
    
    if (isRapid && normalizedValue > 0.7) {
      const timeSinceLastHaptic = now - lastHapticTime.current;
      if (timeSinceLastHaptic > 50) { 
        Haptics.impactAsync(intensity).catch(() => {});
        lastHapticTime.current = now;
      }
    } else if (!isRapid) {
      const valueDiff = Math.abs(normalizedValue - lastHapticValue.current);
      if (valueDiff > 0.05) {
        Haptics.impactAsync(intensity).catch(() => {});
        lastHapticValue.current = normalizedValue;
      }
    }
  };

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      startX.value = translateX.value;
      const normalizedValue = translateX.value / (SLIDER_WIDTH - THUMB_SIZE);
      runOnJS(triggerHaptic)(normalizedValue, false);
    })
    .onUpdate((e) => {
      const newPosition = Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, startX.value + e.translationX));
      translateX.value = newPosition;
      const normalizedValue = newPosition / (SLIDER_WIDTH - THUMB_SIZE);
      
      const isRapid = normalizedValue > 0.7;
      runOnJS(triggerHaptic)(normalizedValue, isRapid);
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
    triggerHaptic(normalizedValue, false);
  };

  // Animated styles
  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

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
      ['#10B981', '#FBBF24', '#EF4444'] 
    );
    return { backgroundColor: color };
  });

  const fillStyle = useAnimatedStyle(() => {
    const fillWidth = translateX.value + THUMB_SIZE / 2;
    return { width: fillWidth };
  });

  // Get feedback text
  const feedback = useMemo(() => getFeedbackText(value), [value]);

  // Average marker position
  const averageMarkerPosition = AVERAGE_MARKER_POSITION * (SLIDER_WIDTH - THUMB_SIZE) + (THUMB_SIZE / 2);

  return (
    <View style={styles.container}>
      {/* Icons and Labels */}
      <View style={styles.iconsContainer}>
        <View style={styles.iconWrapper}>
          <VolumeX size={20} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.iconLabel}>Silence</Text>
        </View>
        <View style={styles.iconWrapper}>
          <Volume2 size={20} color="rgba(255, 255, 255, 0.6)" />
          <Text style={styles.iconLabel}>Chaos</Text>
        </View>
      </View>

      {/* Slider Track */}
      <View style={styles.sliderContainer}>
        <TouchableOpacity
          style={styles.trackPressable}
          onPress={handleTrackPress}
          activeOpacity={1}
        >
          {/* Background Track */}
          <View style={styles.trackBackground} />
          
          {/* Filled Track (Color Interpolated) */}
          <Animated.View style={[styles.trackFill, fillStyle, fillColorStyle]} />

          {/* Average Marker (Now more visible) */}
          <View style={[styles.averageMarker, { left: averageMarkerPosition }]}>
            <View style={styles.averageTick} />
            <Text style={styles.averageLabel}>Average</Text>
          </View>
        </TouchableOpacity>

        {/* Draggable Thumb */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.sliderThumb, thumbStyle]}>
            <Animated.View style={[styles.sliderThumbInner, thumbInnerColorStyle]} />
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Dynamic Feedback Text */}
      <View style={styles.feedbackContainer}>
        <Text style={[styles.feedbackLabel, { color: feedback.color }]}>
          {feedback.label}
        </Text>
        <Text style={styles.feedbackText}>{feedback.text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SLIDER_WIDTH,
    marginVertical: 16,
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  iconWrapper: {
    alignItems: 'center',
    gap: 4,
    flexDirection: 'row',
  },
  iconLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    marginLeft: 6,
  },
  sliderContainer: {
    height: THUMB_SIZE + 20, 
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  trackPressable: {
    width: '100%',
    height: TRACK_HEIGHT * 3, // Larger touch target
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
  
  // Updated Average Marker Styles
  averageMarker: {
    position: 'absolute',
    top: -12, // Moved up to clear the track
    alignItems: 'center',
    transform: [{ translateX: -1 }], 
    zIndex: 0, // Behind thumb
  },
  averageTick: {
    width: 2,
    height: 36, // Longer line cutting through
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    borderRadius: 1,
  },
  averageLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
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
    left: 0,
    zIndex: 10,
  },
  sliderThumbInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  feedbackContainer: {
    marginTop: 16,
    alignItems: 'center',
    minHeight: 50,
  },
  feedbackLabel: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  feedbackText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
});