import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  SharedValue
} from 'react-native-reanimated';
import { theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const snippets = [
  "who's most likely to fake their own death to dodge a group chat?",
  "what's the pettiest revenge you've pulled off without them finding out?",
  "if we were stranded on an island, who are we sacrificing first?"
];

export function LoadingScreen() {
  const [snippetIndex, setSnippetIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Blinking cursor
  const cursorOpacity = useSharedValue(1);

  // Dots
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // Blinking cursor effect (steps(1) essentially means toggle instantly)
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 450, easing: Easing.steps(1) }),
        withTiming(1, { duration: 450, easing: Easing.steps(1) })
      ),
      -1,
      false
    );

    // Dots pulsing effect (graphite to signal and back)
    const dotDuration = 600; // Half pulse
    const animateDot = (dot: SharedValue<number>, delay: number) => {
      dot.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: dotDuration, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: dotDuration, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        )
      );
    };

    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);
  }, []);

  useEffect(() => {
    // Typing effect logic
    let timeout: ReturnType<typeof setTimeout>;
    
    const tick = () => {
      const currentFull = snippets[snippetIndex];
      
      if (!isDeleting) {
        if (charIndex < currentFull.length) {
          setCharIndex(prev => prev + 1);
          timeout = setTimeout(tick, 32); // Typing speed
        } else {
          // Pause before deleting
          timeout = setTimeout(() => setIsDeleting(true), 1600);
        }
      } else {
        if (charIndex > 0) {
          setCharIndex(prev => prev - 1);
          timeout = setTimeout(tick, 18); // Deleting speed
        } else {
          // Move to next snippet
          setIsDeleting(false);
          setSnippetIndex((prev) => (prev + 1) % snippets.length);
        }
      }
    };

    timeout = setTimeout(tick, isDeleting ? 18 : 32);
    
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, snippetIndex]);

  const currentText = snippets[snippetIndex].slice(0, charIndex);

  const getDotStyle = (dotVal: SharedValue<number>) => {
    return useAnimatedStyle(() => ({
      backgroundColor: dotVal.value > 0.5 ? theme.colors.signal : theme.colors.graphite,
      // Interpolating color for smooth transition
    }));
  };

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.wordmark}>
          <Text style={styles.quoteMark}>“</Text>
          <Text style={styles.wordmarkText}>realtalk</Text>
          <Text style={styles.quoteMark}>”</Text>
        </View>

        <View style={styles.snippetContainer}>
          <Text style={styles.snippetText}>
            <Text style={styles.promptArrow}>{'> '}</Text>
            {currentText}
            <Animated.View style={[styles.cursor, cursorStyle]} />
          </Text>
        </View>

        <View style={styles.loader}>
          <Animated.View style={[styles.dot, getDotStyle(dot1)]} />
          <Animated.View style={[styles.dot, getDotStyle(dot2)]} />
          <Animated.View style={[styles.dot, getDotStyle(dot3)]} />
        </View>
      </View>

      <Text style={styles.tagline}>KEEP IT REAL</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 22,
  },
  wordmarkText: {
    fontFamily: theme.fonts.display,
    fontSize: 34,
    color: theme.colors.paper,
    letterSpacing: -0.34,
  },
  quoteMark: {
    fontFamily: theme.fonts.display,
    fontSize: 44,
    color: theme.colors.signal,
    marginTop: -8, // visually adjust quote marks
  },
  snippetContainer: {
    minHeight: 52, // enough for 2-3 lines
    justifyContent: 'center',
    maxWidth: 240,
    marginBottom: 40,
  },
  snippetText: {
    fontFamily: theme.fonts.utility,
    fontSize: 12.5,
    color: theme.colors.fog,
    textAlign: 'center',
    lineHeight: 18.75,
  },
  promptArrow: {
    color: theme.colors.signal,
  },
  cursor: {
    width: 6,
    height: 12,
    backgroundColor: theme.colors.signal,
    marginLeft: 2,
    transform: [{ translateY: 2 }],
  },
  loader: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  tagline: {
    position: 'absolute',
    bottom: 40,
    fontFamily: theme.fonts.utility,
    fontSize: 10.5,
    letterSpacing: 1.68,
    color: theme.colors.fog,
  }
});
