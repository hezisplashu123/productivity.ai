import React, { useState, useEffect, useRef } from 'react';
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
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';
import { Sparkles, ArrowRight, Save, MessageSquare } from 'lucide-react-native';
import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';
import { TaskStagingModal, StagingTask } from '../src/components/TaskStagingModal';
import { BottomNav } from '../src/components/BottomNav'; 

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INPUT_CARD_WIDTH = Math.min(600, SCREEN_WIDTH - 40);

type InputStep = 'goal' | 'clarification' | 'processing';

export default function GoalInputScreen() {
  const { initialText, editingGoalId } = useLocalSearchParams();
  const isEditing = !!editingGoalId;

  // --- STATE ---
  const [step, setStep] = useState<InputStep>('goal');
  
  const [goalText, setGoalText] = useState(initialText ? (initialText as string) : '');
  const [answerText, setAnswerText] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isStagingVisible, setIsStagingVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  const [aiTasks, setAiTasks] = useState<StagingTask[]>([]);
  const [aiTitle, setAiTitle] = useState('');

  const router = useRouter();
  const { addGoal, addTasks, setCurrentGoal, updateGoal, overrideTasks, generatePlan, getAiQuestion } = useApp();
  
  // Animation Values
  const borderOpacity = useSharedValue(0);
  const submitButtonOpacity = useSharedValue(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (initialText) {
      setGoalText(initialText as string);
      submitButtonOpacity.value = withSpring(1);
    }
  }, [initialText]);

  // --- ANIMATED STYLES ---
  const borderAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.1 + borderOpacity.value * 0.4,
    shadowRadius: 12 + borderOpacity.value * 8,
    borderWidth: 1 + borderOpacity.value,
  }));

  const submitButtonStyle = useAnimatedStyle(() => ({
    opacity: submitButtonOpacity.value,
    transform: [{ scale: submitButtonOpacity.value }],
  }));

  // --- HANDLERS ---

  const handleGoalSubmit = async () => {
    if (!goalText.trim()) return;
    Keyboard.dismiss();
    setStep('processing');

    try {
      // 1. Get Clarification Question
      console.log("Asking AI to clarify:", goalText);
      const question = await getAiQuestion(goalText);
      
      if (question) {
        setAiQuestion(question);
        setStep('clarification');
        // Reset button for next step
        setTimeout(() => submitButtonOpacity.value = withSpring(0), 100);
      } else {
        // Fallback: Skip clarification if fails
        handleFinalSubmit("");
      }
    } catch (e) {
      handleFinalSubmit(""); // Proceed without clarification on error
    }
  };

  const handleClarificationSubmit = () => {
    if (!answerText.trim()) return;
    handleFinalSubmit(answerText);
  };

  const handleFinalSubmit = async (clarification: string) => {
    Keyboard.dismiss();
    setStep('processing');

    try {
      console.log("Generating plan with context:", clarification);
      const aiResult = await generatePlan(goalText, clarification);
      
      if (aiResult && aiResult.tasks && aiResult.tasks.length > 0) {
        const formattedTasks: StagingTask[] = aiResult.tasks.map((t: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          title: t.title,
          duration: t.duration,
          description: t.description
        }));
        
        setAiTasks(formattedTasks);
        setAiTitle(aiResult.shortTitle);
        setIsStagingVisible(true);
        // Reset state for when modal closes
        setStep('goal'); 
        setAnswerText('');
      } else {
        Alert.alert("Error", "Could not generate plan.");
        setStep('goal');
      }
    } catch (error) {
      Alert.alert("Error", "Connection failed.");
      setStep('goal');
    }
  };

  const handleFinalConfirm = async (finalTasks: StagingTask[], finalTitle: string) => {
    setIsStagingVisible(false);
    setStep('processing'); // Show loading while saving
    
    try {
      if (isEditing) {
        const id = editingGoalId as string;
        updateGoal(id, { title: finalTitle });
        overrideTasks(id, finalTasks);
        router.back();
      } else {
        const newGoal = await addGoal(finalTitle);
        if (newGoal && newGoal.id) {
          await addTasks(newGoal.id, finalTasks);
          setCurrentGoal(newGoal);
          if (router.canGoBack()) router.back(); 
          else router.replace('/home');
        }
      }
    } catch (error) {
      Alert.alert("Error", "Save failed.");
      setStep('goal');
    }
  };

  const handleFocus = () => {
    setIsInputFocused(true);
    borderOpacity.value = withTiming(1);
    submitButtonOpacity.value = withSpring(1);
  };

  const handleBlur = () => {
    setIsInputFocused(false);
    borderOpacity.value = withTiming(0);
    const textToCheck = step === 'goal' ? goalText : answerText;
    if (!textToCheck.trim()) {
      submitButtonOpacity.value = withSpring(0);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: '#FFFFFF' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar style="dark" />

        <View style={styles.centeredContainer}>
          <AnimatePresence mode="wait">
            
            {/* STEP 1: GOAL INPUT */}
            {step === 'goal' && (
              <MotiView
                key="step1"
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: 0, translateX: -20 }}
                style={styles.stepWrapper}
              >
                <Text style={styles.title}>
                  {isEditing ? "Refine Directive" : "What is your main goal?"}
                </Text>
                
                <Animated.View style={[styles.inputCard, borderAnimatedStyle, isInputFocused && styles.focusedCard]}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Launch my dropshipping store"
                    placeholderTextColor={colors.textLight}
                    value={goalText}
                    onChangeText={setGoalText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    multiline
                    autoFocus
                  />
                  <Animated.View style={[styles.submitButtonContainer, submitButtonStyle]}>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleGoalSubmit}
                      disabled={!goalText.trim()}
                    >
                      <ArrowRight size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              </MotiView>
            )}

            {/* STEP 2: CLARIFICATION */}
            {step === 'clarification' && (
              <MotiView
                key="step2"
                from={{ opacity: 0, translateX: 20 }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: 0, translateX: -20 }}
                style={styles.stepWrapper}
              >
                <View style={styles.aiMessageContainer}>
                  <Sparkles size={20} color={colors.primary} style={{marginBottom:8}} />
                  <Text style={styles.aiQuestionText}>{aiQuestion}</Text>
                </View>

                <Animated.View style={[styles.inputCard, borderAnimatedStyle, isInputFocused && styles.focusedCard]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Type your answer..."
                    placeholderTextColor={colors.textLight}
                    value={answerText}
                    onChangeText={(t) => {
                        setAnswerText(t);
                        if (t.length > 0) submitButtonOpacity.value = withSpring(1);
                    }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    multiline
                    autoFocus
                  />
                  <Animated.View style={[styles.submitButtonContainer, submitButtonStyle]}>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleClarificationSubmit}
                      disabled={!answerText.trim()}
                    >
                      <ArrowRight size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              </MotiView>
            )}

            {/* STEP 3: LOADING */}
            {step === 'processing' && (
              <MotiView
                key="loading"
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={styles.loadingContainer}
              >
                <MotiView
                  from={{ rotate: '0deg' }}
                  animate={{ rotate: '360deg' }}
                  transition={{ type: 'timing', duration: 2000, loop: true }}
                >
                  <Sparkles size={40} color={colors.primary} />
                </MotiView>
                <Text style={styles.loadingText}>
                  Constructing Tactical Plan...
                </Text>
              </MotiView>
            )}

          </AnimatePresence>
        </View>
      </KeyboardAvoidingView>

      <TaskStagingModal
        visible={isStagingVisible}
        goalTitle={aiTitle || goalText}
        generatedTasks={aiTasks}
        onConfirm={handleFinalConfirm}
        onClose={() => setIsStagingVisible(false)}
      />

      {!isKeyboardVisible && <BottomNav activeTab="GoalInput" />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, width: '100%', paddingBottom: 100 },
  stepWrapper: { width: '100%', alignItems: 'center' },
  
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 24, color: colors.text },
  
  aiMessageContainer: { marginBottom: 24, alignItems: 'center', paddingHorizontal: 20 },
  aiQuestionText: { fontSize: 22, fontWeight: '600', color: colors.primary, textAlign: 'center', lineHeight: 30 },

  inputCard: { width: INPUT_CARD_WIDTH, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(245, 158, 11, 0.1)', backgroundColor: '#F9F9F9', position: 'relative', minHeight: 140, overflow: 'hidden' },
  focusedCard: { borderColor: colors.primary, shadowColor: colors.primary },
  
  input: { width: '100%', padding: 20, paddingBottom: 60, fontSize: 18, minHeight: 120, color: colors.text },
  
  submitButtonContainer: { position: 'absolute', bottom: 16, right: 16 },
  submitButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary, elevation: 4, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  
  loadingContainer: { alignItems: 'center', marginTop: 30 },
  loadingText: { fontSize: 16, marginTop: 20, textAlign: 'center', fontWeight: '600', color: colors.textSecondary },
});