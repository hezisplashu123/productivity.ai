import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { useApp } from '../src/context/AppContext';
import { mockTasks } from '../src/data/mockData';
import { lightColors as colors } from '../src/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INPUT_CARD_WIDTH = Math.min(600, SCREEN_WIDTH - 40); // Fixed width with padding

export default function GoalInputScreen() {
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const router = useRouter();
  const { addGoal, addTasks, setCurrentGoal } = useApp();
  
  // All hooks must be called before any conditional returns
  const borderOpacity = useSharedValue(0);
  const submitButtonOpacity = useSharedValue(0);

  const borderAnimatedStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: 0.1 + borderOpacity.value * 0.4,
      shadowRadius: 12 + borderOpacity.value * 8,
      borderWidth: 1 + borderOpacity.value, // Animate border width
    };
  });

  const submitButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: submitButtonOpacity.value,
      transform: [
        { scale: submitButtonOpacity.value },
      ],
    };
  });

  React.useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        // Minimal adjustment - just enough to see input over keyboard
        // The KeyboardAvoidingView handles most of the work
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Return to center when keyboard closes
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleSubmit = async () => {
    if (!goal.trim()) return;

    setIsLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      const newGoal = addGoal(goal.trim());
      addTasks(newGoal.id, mockTasks);
      setCurrentGoal(newGoal);
      setIsLoading(false);
      router.push('/home');
    }, 2000);
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    // Enhance border visibility on focus
    borderOpacity.value = withTiming(1, { duration: 300 });
    // Show submit button
    submitButtonOpacity.value = withSpring(1, {
      damping: 20,
      stiffness: 100,
    });
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    // Reduce border visibility on blur
    borderOpacity.value = withTiming(0, { duration: 300 });
    // Hide submit button
    submitButtonOpacity.value = withSpring(0, {
      damping: 20,
      stiffness: 100,
    });
  };


  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#FFFFFF' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar style="dark" />

      <View style={styles.centeredContainer}>
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <Text style={[styles.title, { color: colors.text }]}>What is your main goal right now?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter a goal and we'll break it down into actionable steps
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 600, delay: 200 }}
        >
          {/* Light card wrapper with border */}
          <Animated.View 
            style={[
              styles.inputCard, 
              borderAnimatedStyle,
              isInputFocused && { 
                borderColor: colors.primary,
                shadowColor: colors.primary,
              }
            ]}
          >
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { 
                  color: colors.text,
                }]}
                placeholder="e.g., Launch my dropshipping store"
                placeholderTextColor={colors.textLight}
                value={goal}
                onChangeText={setGoal}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                multiline
                editable={!isLoading}
                textAlign="left"
                textAlignVertical="top"
                scrollEnabled={true}
              />
            </View>
            
            {/* Submit button - inside the card, bottom-right */}
            <Animated.View style={[styles.submitButtonContainer, submitButtonStyle]}>
              <TouchableOpacity
                style={[
                  styles.submitButton, 
                  { 
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                  },
                  (!goal.trim() || isLoading) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!goal.trim() || isLoading}
                activeOpacity={0.8}
              >
                <ArrowRight size={20} color={colors.background} />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </MotiView>

        {isLoading && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 300 }}
          >
            <View style={styles.loadingContainer}>
              <MotiView
                from={{ rotate: '0deg' }}
                animate={{ rotate: '360deg' }}
                transition={{
                  type: 'timing',
                  duration: 2000,
                  loop: true,
                }}
              >
                <Sparkles size={32} color={colors.primary} />
              </MotiView>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Breaking down your goal into actionable tasks...
              </Text>
            </View>
          </MotiView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1,
    width: '100%', // Ensure full width
    maxWidth: '100%', // Prevent expansion beyond screen
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  // Light card wrapper matching onboarding style
  inputCard: {
    width: INPUT_CARD_WIDTH, // Fixed pixel width - prevents horizontal expansion
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border, // Light gold border
    backgroundColor: colors.backgroundCard, // White card background
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 120,
    alignSelf: 'center', // Center the card
    // Prevent horizontal expansion - lock the width
    flexShrink: 0,
    flexGrow: 0,
    overflow: 'hidden', // Prevent content from expanding the container
  },
  inputWrapper: {
    width: '100%', // Fill the card width
    flexShrink: 1,
    flexGrow: 0,
  },
  input: {
    width: '100%', // Fill the wrapper width
    padding: 20,
    paddingBottom: 60, // Space for submit button
    fontSize: 18,
    borderWidth: 0,
    backgroundColor: 'transparent',
    minHeight: 120,
    maxHeight: 300, // Limit max height for very long text
    textAlign: 'left', // Start text from left
    textAlignVertical: 'top', // Start text from top
    // Allow natural text flow
    flexShrink: 1,
    flexGrow: 0,
  },
  submitButtonContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 10,
  },
  submitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  button: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});





