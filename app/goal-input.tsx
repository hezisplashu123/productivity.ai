import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  TouchableWithoutFeedback
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react-native';
import { useApp } from '../src/context/AppContext';
import { lightColors as colors } from '../src/constants/colors';
import { TaskStagingModal, StagingTask } from '../src/components/TaskStagingModal';
import { LongTermSetupModal } from '../src/components/LongTermSetupModal';
import { BottomNav } from '../src/components/BottomNav'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const INPUT_CARD_WIDTH = Math.min(600, SCREEN_WIDTH - 40);

type InputStep = 'goal' | 'clarification' | 'processing';

export default function GoalInputScreen() {
  const { initialText, editingGoalId } = useLocalSearchParams();
  const isEditing = !!editingGoalId;
  const insets = useSafeAreaInsets();

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

  // Journey State
  const [isJourneySetupVisible, setIsJourneySetupVisible] = useState(false);
  const [journeyReason, setJourneyReason] = useState('');
  const [goalType, setGoalType] = useState<'project' | 'journey'>('project');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [committedDailyMinutes, setCommittedDailyMinutes] = useState(0);
  
  // AI Suggestions for Journey
  const [suggestedDays, setSuggestedDays] = useState(30);
  const [suggestedDailyMinutes, setSuggestedDailyMinutes] = useState(45);

  const router = useRouter();
  const { 
    user, 
    addGoal, addTasks, setCurrentGoal, updateGoal, overrideTasks, 
    generatePlan, getAiQuestion, analyzeGoal 
  } = useApp();
  
  const borderOpacity = useSharedValue(0);
  const submitButtonOpacity = useSharedValue(0);

  const helperText = useMemo(() => {
    const identity = user?.onboardingData?.identity;
    switch (identity) {
      case 'student': return 'Be specific. "Study Chapter 4 for 2 hours" gives a better plan than just "Study".';
      case 'professional': return 'Be specific. "Draft Q3 report for stakeholders" gives a better plan than just "Work".';
      case 'entrepreneur': return 'Be specific. "Cold email 20 leads" gives a better plan than just "Sales".';
      case 'maker': return 'Be specific. "Code the landing page hero section" gives a better plan than just "Build website".';
      case 'personal': return 'Be specific. "Call bank and pay bills" gives a better plan than just "Chores".';
      default: return 'Be specific. "Finish the draft by 5 PM" gives a better plan than just "Work".';
    }
  }, [user]);

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
      const question = await getAiQuestion(goalText);
      
      if (question) {
        setAiQuestion(question);
        setStep('clarification');
        setTimeout(() => submitButtonOpacity.value = withSpring(0), 100);
      } else {
        await checkGoalTypeAndProceed("");
      }
    } catch (e) {
      await checkGoalTypeAndProceed("");
    }
  };

  const handleClarificationSubmit = async () => {
    if (!answerText.trim()) return;
    await checkGoalTypeAndProceed(answerText);
  };

  const checkGoalTypeAndProceed = async (clarification: string) => {
    setStep('processing');
    try {
      const typeAnalysis = await analyzeGoal(goalText, clarification, aiQuestion);
      
      if (typeAnalysis.type === 'journey') {
        setGoalType('journey');
        setJourneyReason(typeAnalysis.reason || "Long-term effort detected.");
        if (typeAnalysis.estimatedDays) setSuggestedDays(typeAnalysis.estimatedDays);
        if (typeAnalysis.recommendedDailyMinutes) setSuggestedDailyMinutes(typeAnalysis.recommendedDailyMinutes);
        
        setIsJourneySetupVisible(true);
      } else {
        setGoalType('project'); 
        handleFinalSubmit(clarification, 0);
      }
    } catch (error) {
      setGoalType('project');
      handleFinalSubmit(clarification, 0);
    }
  };

  const handleJourneyConfirm = async (date: Date, dailyMinutes: number) => {
    setIsJourneySetupVisible(false);
    setTargetDate(date);
    setCommittedDailyMinutes(dailyMinutes);
    handleFinalSubmit(answerText, dailyMinutes);
  };

  const handleFinalSubmit = async (clarification: string, dailyMinutes: number) => {
    setStep('processing');

    try {
      const aiResult = await generatePlan(goalText, clarification, dailyMinutes);
      
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
        
        if (goalType === 'project') setAnswerText(''); 
      } else {
        Alert.alert("Error", "Could not generate plan.");
        setStep('goal');
      }
    } catch (error) {
      Alert.alert("Error", "Connection failed.");
      setStep('goal');
    }
  };

  const handleStagingRefinement = async (feedback: string) => {
    const baseContext = answerText || (goalType === 'journey' ? `Journey Goal: ${goalText}` : "");
    const fullContext = `${baseContext}. [CONSTRAINT UPDATE: ${feedback}]`;
    setAnswerText(fullContext);

    try {
      const aiResult = await generatePlan(goalText, fullContext, committedDailyMinutes);
      if (aiResult && aiResult.tasks) {
        const formattedTasks: StagingTask[] = aiResult.tasks.map((t: any, index: number) => ({
          id: `ai-refined-${Date.now()}-${index}`,
          title: t.title,
          duration: t.duration,
          description: t.description
        }));
        setAiTasks(formattedTasks);
        setAiTitle(aiResult.shortTitle);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to regenerate plan.");
    }
  };

  const handleToggleMode = () => {
    setIsStagingVisible(false); // Close staging
    
    if (goalType === 'project') {
        setGoalType('journey');
        setJourneyReason("Switched from Project");
        setSuggestedDays(30);
        setSuggestedDailyMinutes(45);
        setIsJourneySetupVisible(true);
    } else {
        setGoalType('project');
        handleFinalSubmit(answerText, 0);
    }
  };

  const handleFinalConfirm = async (finalTasks: StagingTask[], finalTitle: string) => {
    setIsStagingVisible(false);
    setStep('processing'); 
    
    try {
      if (isEditing) {
        const id = editingGoalId as string;
        updateGoal(id, { title: finalTitle });
        overrideTasks(id, finalTasks);
        router.back();
      } else {
        const newGoal = await addGoal(finalTitle, goalType, targetDate || undefined, committedDailyMinutes);
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
      {/* Used TouchableWithoutFeedback to dismiss keyboard when tapping outside */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={[styles.container, { backgroundColor: '#FFFFFF' }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <StatusBar style="dark" />

          <View style={styles.centeredContainer}>
            <AnimatePresence mode="wait">
              
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

                  <View style={styles.helperContainer}>
                    <Lightbulb size={14} color={colors.primary} style={{ marginTop: 2 }} />
                    <Text style={styles.helperText}>
                      {helperText}
                    </Text>
                  </View>
                  
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
                      textAlignVertical="top" 
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
                      textAlignVertical="top"
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
                    {goalType === 'journey' ? "Designing Day 1 Protocol..." : "Constructing Tactical Plan..."}
                  </Text>
                </MotiView>
              )}

            </AnimatePresence>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <TaskStagingModal
        visible={isStagingVisible}
        goalTitle={aiTitle || goalText}
        generatedTasks={aiTasks}
        goalType={goalType}
        onConfirm={handleFinalConfirm}
        onRefine={handleStagingRefinement}
        onToggleMode={handleToggleMode}
        onClose={() => {
            setIsStagingVisible(false);
            setStep('goal');
            setAnswerText('');
        }}
      />

      <LongTermSetupModal
        visible={isJourneySetupVisible}
        goalTitle={goalText}
        aiReason={journeyReason}
        initialDays={suggestedDays}
        initialDailyMinutes={suggestedDailyMinutes}
        onConfirm={handleJourneyConfirm}
        onCancel={() => {
            setIsJourneySetupVisible(false);
            setGoalType('project');
            handleFinalSubmit(answerText, 0); 
        }}
      />

      {!isKeyboardVisible && <BottomNav activeTab="GoalInput" />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  centeredContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    width: '100%', 
    paddingBottom: 100 
  },
  stepWrapper: { width: '100%', alignItems: 'center' },
  
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 12, color: colors.text },
  
  helperContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 8, 
    marginBottom: 24, 
    paddingHorizontal: 24,
    opacity: 0.8
  },
  helperText: { 
    fontSize: 14, 
    color: colors.textSecondary, 
    textAlign: 'left', 
    lineHeight: 20,
    flex: 1
  },

  aiMessageContainer: { marginBottom: 24, alignItems: 'center', paddingHorizontal: 20 },
  aiQuestionText: { fontSize: 20, fontWeight: '500', color: colors.primary, textAlign: 'center', lineHeight: 28 },

  inputCard: { 
    width: INPUT_CARD_WIDTH, 
    borderRadius: 24, 
    borderWidth: 2, 
    borderColor: 'rgba(245, 158, 11, 0.1)', 
    backgroundColor: '#F9F9F9', 
    position: 'relative', 
    minHeight: 140, 
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4
  },
  focusedCard: { borderColor: colors.primary, shadowColor: colors.primary },
  
  input: { 
    width: '100%', 
    padding: 20, 
    paddingBottom: 60, 
    fontSize: 18, 
    minHeight: 120, 
    color: colors.text 
  },
  
  submitButtonContainer: { position: 'absolute', bottom: 16, right: 16 },
  submitButton: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.primary, 
    elevation: 4, 
    shadowColor: colors.primary, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 4 } 
  },
  
  loadingContainer: { alignItems: 'center', marginTop: 30 },
  loadingText: { fontSize: 16, marginTop: 20, textAlign: 'center', fontWeight: '600', color: colors.textSecondary },
});