import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WAVE_WIDTH = SCREEN_WIDTH - 80; 
const WAVE_HEIGHT = 200;
const CENTER_Y = WAVE_HEIGHT / 2;
const AMPLITUDE_BASE = 60; 
const POINTS = 150; 

interface FocusWaveProps {
  distractionLevel: number; 
}

export const FocusWave: React.FC<FocusWaveProps> = ({ distractionLevel }) => {
  const continuousTime = useSharedValue(0);
  const breathingPhase = useSharedValue(0);
  const distraction = useSharedValue(distractionLevel);

  useEffect(() => {
    distraction.value = distractionLevel;
  }, [distractionLevel]);

  useEffect(() => {
    continuousTime.value = withRepeat(
      withTiming(100000, { duration: 20000 }), 
      -1, 
      false 
    );
    
    breathingPhase.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true 
    );
  }, []);

  const gradientStartColor = '#00E5FF'; 
  const gradientEndColor = '#FF4757'; 

  const animatedStrokePath = useAnimatedProps(() => {
    'worklet';
    const dist = distraction.value;
    const t = (continuousTime.value % 62832) * 0.002; 
    
    const breathingOffset = Math.sin(breathingPhase.value * Math.PI * 2) * 3; 
    
    const baseAmplitude = interpolate(
      dist,
      [0, 100],
      [AMPLITUDE_BASE, AMPLITUDE_BASE * 0.7], 
      Extrapolate.CLAMP
    );

    const frequency = interpolate(
      dist,
      [0, 100],
      [0.015, 0.12], 
      Extrapolate.CLAMP
    );

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
        <AnimatedPath
          animatedProps={animatedFillPath}
          fill="url(#waveFill)"
        />
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
    marginVertical: 10, // Reduced from 40
  },
  svg: {
    position: 'absolute',
  },
});