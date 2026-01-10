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
import { lightColors as colors } from '../src/constants/colors';
import { TaskStagingModal } from '../src/components/TaskStagingModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INPUT_CARD_WIDTH = Math.min(600, SCREEN_WIDTH - 40);

export default function GoalInputScreen() {
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isStagingVisible, setIsStagingVisible] = useState(false);
  
  const router = useRouter();
  const { addGoal, addTasks, setCurrentGoal } = useApp();
  
  const borderOpacity = useSharedValue(0);
  const submitButtonOpacity = useSharedValue(0);

  const borderAnimatedStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: 0.1 + borderOpacity.value * 0.4,
      shadowRadius: 12 + borderOpacity.value * 8,
      borderWidth: 1 + borderOpacity.value,
    };
  });

  const submitButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: submitButtonOpacity.value,
      transform: [{ scale: submitButtonOpacity.value }],
    };
  });

  const handleSubmit = async () => {
    if (!goal.trim()) return;
    setIsLoading(true);
    Keyboard.dismiss();

    // Simulate AI Generation phase
    setTimeout(() => {
      setIsLoading(false);
      setIsStagingVisible(true);
    }, 1500);
  };

  const handleFinalConfirm = (finalTasks: any[]) => {
    setIsStagingVisible(false);
    
    // 1. Create the mission first
    const newGoal = addGoal(goal.trim());
    
    // 2. Link the verified tasks to that mission ID
    addTasks(newGoal.id, finalTasks);
    
    // 3. Set as current and go home
    setCurrentGoal(newGoal);
    router.replace('/home');
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    borderOpacity.value = withTiming(1, { duration: 300 });
    submitButtonOpacity.value = withSpring(1, { damping: 20, stiffness: 100 });
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    borderOpacity.value = withTiming(0, { duration: 300 });
    if (!goal.trim()) {
      submitButtonOpacity.value = withSpring(0, { damping: 20, stiffness: 100 });
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: '#FFFFFF' }]} // FIXED: Background set to White
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., Launch my dropshipping store"
                  placeholderTextColor={colors.textLight}
                  value={goal}
                  onChangeText={setGoal}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  multiline
                  editable={!isLoading}
                  textAlignVertical="top"
                />
              </View>
              
              <Animated.View style={[styles.submitButtonContainer, submitButtonStyle]}>
                <TouchableOpacity
                  style={[
                    styles.submitButton, 
                    { backgroundColor: colors.primary, shadowColor: colors.primary },
                    (!goal.trim() || isLoading) && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={!goal.trim() || isLoading}
                  activeOpacity={0.8}
                >
                  <ArrowRight size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </MotiView>

          {isLoading && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.loadingContainer}
            >
              <MotiView
                from={{ rotate: '0deg' }}
                animate={{ rotate: '360deg' }}
                transition={{ type: 'timing', duration: 2000, loop: true }}
              >
                <Sparkles size={32} color={colors.primary} />
              </MotiView>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Analyzing mission parameters...
              </Text>
            </MotiView>
          )}
        </View>
      </KeyboardAvoidingView>

      <TaskStagingModal
        visible={isStagingVisible}
        goalTitle={goal}
        onConfirm={handleFinalConfirm}
        onClose={() => setIsStagingVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputCard: {
    width: INPUT_CARD_WIDTH,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.2)', // Light amber border
    backgroundColor: '#F9F9F9', // Very light grey to separate from pure white bg
    position: 'relative',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    minHeight: 140,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  inputWrapper: {
    width: '100%',
  },
  input: {
    width: '100%',
    padding: 20,
    paddingBottom: 60,
    fontSize: 18,
    borderWidth: 0,
    backgroundColor: 'transparent',
    minHeight: 120,
    maxHeight: 250,
  },
  submitButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  submitButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});