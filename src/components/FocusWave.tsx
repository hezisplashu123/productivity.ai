import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  interpolate,
  Extrapolate,
  useDerivedValue,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WAVE_WIDTH = SCREEN_WIDTH - 80; // Account for padding
const WAVE_HEIGHT = 200;
const CENTER_Y = WAVE_HEIGHT / 2;
const AMPLITUDE_BASE = 60; // Base amplitude for smooth wave
const POINTS = 150; // Number of points for the wave

interface FocusWaveProps {
  distractionLevel: number; // 0-100 (reacts to prop changes)
}

export const FocusWave: React.FC<FocusWaveProps> = ({ distractionLevel }) => {
  // Continuous time value that never stops - loops infinitely
  const continuousTime = useSharedValue(0);
  
  // Breathing animation for subtle undulation
  const breathingPhase = useSharedValue(0);
  
  // Distraction level as shared value (updated from prop, morphs smoothly)
  const distraction = useSharedValue(distractionLevel);

  // Update distraction value when prop changes (morphs smoothly with spring)
  useEffect(() => {
    distraction.value = distractionLevel;
  }, [distractionLevel]);

  // Start continuous time animation - loops forever, never resets
  useEffect(() => {
    // Use a large duration to create smooth continuous motion
    // The time value increments continuously and wraps using modulo in the calculation
    continuousTime.value = withRepeat(
      withTiming(100000, { duration: 20000 }), // 20 seconds to reach 100000, then repeat
      -1, // Infinite repeat
      false // Don't reverse
    );
    
    // Breathing animation - subtle undulation even when not touching
    breathingPhase.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true // Reverse for smooth breathing
    );
  }, []);

  // Gradient colors: Cyan (#00E5FF) to Hot Pink/Orange (#FF4757)
  const gradientStartColor = '#00E5FF'; // Cyan
  const gradientEndColor = '#FF4757'; // Hot Pink/Orange

  // Generate stroke path in animatedProps (worklet context) - morphs smoothly
  const animatedStrokePath = useAnimatedProps(() => {
    'worklet';
    const dist = distraction.value;
    // Use modulo to create continuous loop without resetting
    // Slower time multiplier for slower wave movement (reduced by 80%)
    const t = (continuousTime.value % 62832) * 0.002; // Reduced from 0.01 to 0.002 for slower motion
    
    // Add breathing effect - subtle vertical shift
    const breathingOffset = Math.sin(breathingPhase.value * Math.PI * 2) * 3; // 3px breathing amplitude
    
    // Interpolate wave parameters based on distraction level
    // Monk (0%): Low amplitude, low frequency - smooth sine wave
    // Goldfish (100%): High amplitude, high frequency, plus noise
    const baseAmplitude = interpolate(
      dist,
      [0, 100],
      [AMPLITUDE_BASE, AMPLITUDE_BASE * 0.7], // Slightly lower at high distraction for visual balance
      Extrapolate.CLAMP
    );

    const frequency = interpolate(
      dist,
      [0, 100],
      [0.015, 0.12], // Low freq at 0, high freq at 100
      Extrapolate.CLAMP
    );

    // Noise/chaos factors
    const noiseAmplitude = interpolate(
      dist,
      [0, 100],
      [0, AMPLITUDE_BASE * 0.9],
      Extrapolate.CLAMP
    );

    const chaosFactor = interpolate(
      dist,
      [0, 50, 100],
      [0, 0.3, 1],
      Extrapolate.CLAMP
    );

    let path = `M 0 ${CENTER_Y}`;

    for (let i = 0; i <= POINTS; i++) {
      const x = (i / POINTS) * WAVE_WIDTH;
      let y = Math.sin(x * frequency + t) * baseAmplitude;

      if (chaosFactor > 0) {
        const noise1 = Math.sin(x * 0.3 + t * 0.5) * noiseAmplitude * chaosFactor;
        const noise2 = Math.sin(x * 1.8 + t * 0.7) * noiseAmplitude * chaosFactor * 0.6;
        y += noise1 + noise2;

        if (chaosFactor > 0.4) {
          const highFreqNoise = Math.sin(x * frequency * 6 + t * 1.2) * noiseAmplitude * chaosFactor * 0.5;
          y += highFreqNoise;
        }

        if (chaosFactor > 0.7) {
          const spikeFreq = frequency * 12;
          const spike = Math.abs(Math.sin(x * spikeFreq + t * 1.5)) * noiseAmplitude * 0.4;
          y += spike * (chaosFactor - 0.7) * 3.33;
        }

        if (chaosFactor > 0.8) {
          const randomNoise1 = Math.sin(x * 4.7 + t * 1.8) * noiseAmplitude * 0.3;
          const randomNoise2 = Math.sin(x * 8.3 + t * 2.1) * noiseAmplitude * 0.2;
          y += (randomNoise1 + randomNoise2) * (chaosFactor - 0.8) * 5;
        }
      }

      const finalY = CENTER_Y + y + breathingOffset;
      path += ` L ${x} ${finalY}`;
    }

    return { d: path };
  });

  // Generate fill path
  const animatedFillPath = useAnimatedProps(() => {
    'worklet';
    const dist = distraction.value;
    const t = (continuousTime.value % 62832) * 0.002;
    const breathingOffset = Math.sin(breathingPhase.value * Math.PI * 2) * 3;
    
    const baseAmplitude = interpolate(dist, [0, 100], [AMPLITUDE_BASE, AMPLITUDE_BASE * 0.7], Extrapolate.CLAMP);
    const frequency = interpolate(dist, [0, 100], [0.015, 0.12], Extrapolate.CLAMP);
    const noiseAmplitude = interpolate(dist, [0, 100], [0, AMPLITUDE_BASE * 0.9], Extrapolate.CLAMP);
    const chaosFactor = interpolate(dist, [0, 50, 100], [0, 0.3, 1], Extrapolate.CLAMP);

    let path = `M 0 ${CENTER_Y}`;

    for (let i = 0; i <= POINTS; i++) {
      const x = (i / POINTS) * WAVE_WIDTH;
      let y = Math.sin(x * frequency + t) * baseAmplitude;

      if (chaosFactor > 0) {
        const noise1 = Math.sin(x * 0.3 + t * 0.5) * noiseAmplitude * chaosFactor;
        const noise2 = Math.sin(x * 1.8 + t * 0.7) * noiseAmplitude * chaosFactor * 0.6;
        y += noise1 + noise2;

        if (chaosFactor > 0.4) {
          const highFreqNoise = Math.sin(x * frequency * 6 + t * 1.2) * noiseAmplitude * chaosFactor * 0.5;
          y += highFreqNoise;
        }

        if (chaosFactor > 0.7) {
          const spikeFreq = frequency * 12;
          const spike = Math.abs(Math.sin(x * spikeFreq + t * 1.5)) * noiseAmplitude * 0.4;
          y += spike * (chaosFactor - 0.7) * 3.33;
        }

        if (chaosFactor > 0.8) {
          const randomNoise1 = Math.sin(x * 4.7 + t * 1.8) * noiseAmplitude * 0.3;
          const randomNoise2 = Math.sin(x * 8.3 + t * 2.1) * noiseAmplitude * 0.2;
          y += (randomNoise1 + randomNoise2) * (chaosFactor - 0.8) * 5;
        }
      }

      const finalY = CENTER_Y + y + breathingOffset;
      path += ` L ${x} ${finalY}`;
    }
    
    path += ` L ${WAVE_WIDTH} ${WAVE_HEIGHT} L 0 ${WAVE_HEIGHT} Z`;

    return { d: path };
  });

  return (
    <View style={styles.container}>
      <Svg width={WAVE_WIDTH} height={WAVE_HEIGHT} style={styles.svg}>
        <Defs>
          <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={gradientStartColor} stopOpacity="1" />
            <Stop 
              offset="100%" 
              stopColor={gradientEndColor} 
              stopOpacity="1"
            />
          </LinearGradient>
          <LinearGradient id="waveFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={gradientStartColor} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={gradientStartColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {/* Fill under curve */}
        <AnimatedPath
          animatedProps={animatedFillPath}
          fill="url(#waveFill)"
        />
        {/* Stroke with gradient */}
        <AnimatedPath
          animatedProps={animatedStrokePath}
          strokeWidth={3}
          fill="none"
          stroke="url(#waveGradient)"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: WAVE_WIDTH,
    height: WAVE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  svg: {
    position: 'absolute',
  },
});
