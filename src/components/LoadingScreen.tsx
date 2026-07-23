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
  SharedValue,
  FadeIn
} from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const snippets = [
  "who's most likely to fake their own death to dodge a group chat?",
  "what's the pettiest revenge you've pulled off without them finding out?",
  "if we were stranded on an island, who are we sacrificing first?"
];

interface LoadingScreenProps {
  showGetStarted?: boolean;
  onGetStarted?: () => void;
}

let globalSnippetIndex = 0;
let globalCharIndex = 0;
let globalIsDeleting = false;

export function LoadingScreen({ showGetStarted = false, onGetStarted }: LoadingScreenProps) {
  const [snippetIndex, setSnippetIndex] = useState(globalSnippetIndex);
  const [charIndex, setCharIndex] = useState(globalCharIndex);
  const [isDeleting, setIsDeleting] = useState(globalIsDeleting);

  useEffect(() => {
    globalSnippetIndex = snippetIndex;
    globalCharIndex = charIndex;
    globalIsDeleting = isDeleting;
  }, [snippetIndex, charIndex, isDeleting]);

  // Blinking cursor
  const cursorOpacity = useSharedValue(1);

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
      </View>

      {showGetStarted && (
        <View style={styles.bottomContainer}>
          <Animated.View entering={FadeIn.delay(600).duration(800)} style={{ width: '100%' }}>
            <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={onGetStarted}>
              <Text style={styles.buttonText}>Get Started</Text>
              <ArrowRight size={20} color={theme.colors.ink} strokeWidth={3} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
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
  bottomContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 24,
  },
  button: {
    backgroundColor: theme.colors.signal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    borderRadius: 32,
    gap: 12,
    width: '100%',
    shadowColor: theme.colors.signal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.ink,
    fontSize: 20,
    letterSpacing: 0.5,
  }
});
