import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing
} from 'react-native-reanimated';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  Target, 
  Brain, 
  Clock, 
  Cpu, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Zap
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { lightColors as colors } from '../src/constants/colors';

const { width } = Dimensions.get('window');

// High-resolution tactical demo data with universally relatable goals
const DEMO_PROTOCOLS: Record<string, any[]> = {
  student: [
    { 
      title: "Conquer Final Exams", 
      subtitle: "A structured study sprint to prevent cramming.",
      insight: "Combats 'Brain Fog' using active recall and structured breaks.",
      tasks: [
        { title: "Scope Triage", duration: 15, desc: "Identify the 3 highest-weight topics on the syllabus. Ignore the rest for now.", inDepth: "The 'Pareto Principle' applies here. 80% of your grade comes from 20% of the material. Identify high-yield topics by reviewing past exams and syllabus weights. Ignore the rabbit holes." },
        { title: "Active Recall Sprint", duration: 45, desc: "Close the textbook. Write down everything you know about Topic 1. Grade yourself.", inDepth: "Reading is passive and creates a false sense of fluency. By forcing your brain to retrieve the information blank-page style, you build actual, durable neural pathways." },
        { title: "Gap Fill", duration: 30, desc: "Open the book. Fill in the missing information in red ink.", inDepth: "Now that you've exposed exactly what you don't know, use red ink to fill in the blanks. This creates a visual anchor for your brain to remember the missing pieces during the exam." }
      ]
    },
    { 
      title: "Write a 10-Page Paper", 
      subtitle: "Break the blank-page paralysis.",
      insight: "Bypasses 'Perfectionism' by forcing a terrible first draft.",
      tasks: [
        { title: "Vomit Draft", duration: 45, desc: "Write without editing. Do not stop typing. Bullet points are acceptable.", inDepth: "Your inner critic is forbidden here. Write poorly. Write out of order. The goal is solely to put ink on the page to defeat the extreme friction of a blank document." },
        { title: "Structure Assembly", duration: 30, desc: "Organize the brain dump into Intro, Body Paragraphs, and Conclusion.", inDepth: "Now put on your editor hat. Group your random, messy thoughts into logical buckets. Create the structured skeleton of your argument." },
        { title: "Citation Hunt", duration: 25, desc: "Find 5 academic sources that back up your core arguments.", inDepth: "Instead of stopping your writing flow every 5 minutes to find a quote, do it all at once now. Batching this task saves enormous cognitive load." }
      ]
    }
  ],
  professional: [
    { 
      title: "Inbox Zero & Admin Clear", 
      subtitle: "Eliminate the low-level noise.",
      insight: "Defeats 'Side Quests' by grouping shallow work into one aggressive block.",
      tasks: [
        { title: "The Purge", duration: 15, desc: "Delete, archive, or delegate all non-essential emails. Do not reply yet.", inDepth: "Use the 'Touch It Once' rule. If you open an email, make a decision immediately. Archive it, delete it, or leave it for step 2. Clear the visual clutter first." },
        { title: "Rapid Fire Responses", duration: 30, desc: "Reply to all emails that take less than 2 minutes. Timebox this strictly.", inDepth: "Set a 2-minute timer per email in your head. If it takes longer, it becomes a scheduled task for later. Be concise, direct, and ruthless." },
        { title: "Deep Work Setup", duration: 15, desc: "Block your calendar for tomorrow's main project. Close email client.", inDepth: "Context switching is your enemy. Block 90 minutes on your calendar for tomorrow's most critical task. Close Slack and Teams so you can actually disconnect." }
      ]
    },
    { 
      title: "Overhaul Your Career Profile", 
      subtitle: "Position yourself for the next big step.",
      insight: "Combats 'Imposter Syndrome' by focusing purely on objective, undeniable data.",
      tasks: [
        { title: "The Brag Sheet", duration: 20, desc: "Brain dump every win, metric, and successful project from the last year.", inDepth: "Do not edit yourself. Write down every dollar saved, hour reduced, or project shipped. Facts don't care about your imposter syndrome." },
        { title: "Resume Translation", duration: 45, desc: "Convert your brag sheet into sharp, action-oriented bullet points.", inDepth: "Use the XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'. Keep it strictly formatted and easily scannable for recruiters." },
        { title: "Network Activation", duration: 25, desc: "Send brief 'catch up' messages to 3 former colleagues or industry peers.", inDepth: "Opportunities come from loose ties. Don't ask for a job; just ask how they are doing. Reactivate your dormant network to plant seeds for the future." }
      ]
    }
  ],
  entrepreneur: [
    { 
      title: "Launch a Side Hustle", 
      subtitle: "Turn your idea into something real.",
      insight: "Bypasses 'Analysis Paralysis' by forcing you to create a tangible offer today.",
      tasks: [
        { title: "Define the Offer", duration: 20, desc: "Write down exactly what you are selling and who it is for in one simple sentence.", inDepth: "Clarity creates momentum. If you can't explain your idea in one sentence, you're overcomplicating it. Strip away the fluff." },
        { title: "Build a Basic Storefront", duration: 45, desc: "Set up a simple one-page site or social profile. Do not buy a custom domain yet.", inDepth: "Perfectionism is a delay tactic. Use a free tool like Linktree or Carrd. The goal is to have a single place to send people, not to win a design award." },
        { title: "The First 5 Reaches", duration: 25, desc: "Send a direct message to 5 people who might be interested. Hit send and close the app.", inDepth: "Fear of rejection causes 'rotting'. Draft a simple, honest message. Send it to 5 people. Do not wait for replies—just break the ice." }
      ]
    },
    { 
      title: "Plan a Major Launch", 
      subtitle: "Map out the steps to put your work into the world.",
      insight: "Action-biased protocol. Prioritizes momentum over perfect strategy.",
      tasks: [
        { title: "Brain Dump", duration: 20, desc: "List every single tiny task required to go live. Don't organize them yet.", inDepth: "Get the swirl of panic out of your head and onto paper. When tasks live in your brain, they feel 10x larger than they actually are." },
        { title: "Timeline Assembly", duration: 40, desc: "Group the tasks into 'This Week', 'Next Week', and 'Post-Launch'.", inDepth: "You can't do everything today. Forcing items into sequential buckets stops you from trying to multitask and failing at all of them." },
        { title: "First Domino", duration: 30, desc: "Pick the single easiest task on the 'This Week' list and complete it right now.", inDepth: "Momentum is a physics problem. It's hardest at the beginning. Knocking over the easiest domino proves to your brain that progress is possible." }
      ]
    }
  ],
  maker: [
    { 
      title: "Kickstart a Creative Project", 
      subtitle: "Get your ideas out of your head and into reality.",
      insight: "Defeats 'Overwhelm' by forcing you to make something ugly first.",
      tasks: [
        { title: "Mind Map Dump", duration: 15, desc: "Write down every idea, feature, or concept floating in your head.", inDepth: "Your brain is for generating ideas, not storing them. Get everything onto paper so you can actually see the real scope of the project." },
        { title: "The 'Ugly' Prototype", duration: 60, desc: "Build the worst possible version of your idea. A messy sketch or a bad draft.", inDepth: "The blank canvas is intimidating. Make it dirty immediately. Once you have an 'ugly' version, you're no longer creating—you're just editing, which is much easier." },
        { title: "Define Tomorrow's Step", duration: 15, desc: "Write down the exact, single action you need to take tomorrow.", inDepth: "Never leave a creative session without deciding exactly what you'll do next. It eliminates startup friction for your next session." }
      ]
    },
    { 
      title: "Master a New Skill", 
      subtitle: "Accelerate your learning curve.",
      insight: "Bypasses 'Tutorial Hell' by requiring immediate, active practice.",
      tasks: [
        { title: "Resource Curation", duration: 20, desc: "Pick ONE tutorial, book, or course. Close all other tabs.", inDepth: "Option paralysis kills progress. Pick one teacher or method and commit to it for today. You can evaluate if it's the 'best' one later." },
        { title: "Active Consumption", duration: 40, desc: "Consume the material, but pause every 10 minutes to summarize out loud.", inDepth: "Passive watching feels like learning, but it's just entertainment. Forcing yourself to explain the concept solidifies the neural pathways." },
        { title: "Messy Application", duration: 30, desc: "Try to apply the skill from memory. Let yourself fail.", inDepth: "You learn more from 5 minutes of failing to do it yourself than 50 minutes of watching an expert. Struggle is where the learning happens." }
      ]
    }
  ],
  personal: [
    { 
      title: "Total Life Reset", 
      subtitle: "Clear the physical and digital clutter.",
      insight: "Uses 'Micro-Activations' to build momentum safely.",
      tasks: [
        { title: "Surface Clear", duration: 20, desc: "Clear your desk and floor. Put everything in a basket to sort later.", inDepth: "Visual clutter equals mental clutter. Do not organize yet—just clear the surfaces into a laundry basket to instantly reduce environmental stress." },
        { title: "Financial Triage", duration: 30, desc: "Log into bank. Pay overdue bills. Cancel 1 unused subscription.", inDepth: "Look at your runway. Knowing is better than guessing. Pay the immediate threats and cut the 'vampire' subscriptions draining your accounts." },
        { title: "Schedule Defense", duration: 15, desc: "Look at next week's calendar. Cancel or decline 1 draining obligation.", inDepth: "Protect your time. Find the one meeting, coffee date, or obligation next week that you are dreading, and cancel it gracefully. Take your hours back." }
      ]
    },
    { 
      title: "Build a Fitness Habit", 
      subtitle: "Stop planning. Start moving.",
      insight: "Lowers the barrier to entry to defeat 'Procrastination'.",
      tasks: [
        { title: "Environment Design", duration: 10, desc: "Put gym clothes and shoes directly next to your bed or desk.", inDepth: "Reduce friction to absolute zero. If your running shoes are literally in the way of your morning coffee, you are 80% more likely to put them on." },
        { title: "The 15-Minute Minimum", duration: 15, desc: "Do anything that raises your heart rate. Stretching, walking, or pushups.", inDepth: "The goal right now is habit formation, not physical exhaustion. Give yourself permission to stop after 15 minutes. (Spoiler: You rarely will)." },
        { title: "Tracking Protocol", duration: 5, desc: "Mark a giant X on your calendar. Do not break the chain.", inDepth: "Visual momentum is highly powerful. Put a big red X on a physical calendar on your wall. Don't break the chain. Jerry Seinfeld used this exact method." }
      ]
    }
  ],
};

export default function DemoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const onboardingDataString = params.onboardingData as string;
  const onboardingData = onboardingDataString ? JSON.parse(onboardingDataString) : {};
  const identity = onboardingData?.identity || 'professional';
  
  const protocolOptions = DEMO_PROTOCOLS[identity] || DEMO_PROTOCOLS['professional'];

  const [selectedProtocolIndex, setSelectedProtocolIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [expandedTaskIndex, setExpandedTaskIndex] = useState<number | null>(null);

  // Animations
  const scanLineY = useSharedValue(0);
  
  useEffect(() => {
    if (isGenerating) {
      scanLineY.value = withRepeat(
        withTiming(150, { duration: 1000, easing: Easing.linear }),
        -1,
        true
      );
    }
  }, [isGenerating]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }]
  }));

  const handleGenerate = () => {
    if (selectedProtocolIndex === null) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);

    // Simulate AI Generation
    setTimeout(() => {
      setIsGenerating(false);
      setShowResult(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2800);
  };

  const handleCreateAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: '/auth',
      params: { mode: 'signup', onboardingData: onboardingDataString }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <View style={styles.iconCircle}>
              <Cpu size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>System Initialization</Text>
            <Text style={styles.subtitle}>
              Select a sample objective below. We will demonstrate how the AI generates a customized tactical protocol for your archetype.
            </Text>
          </Animated.View>

          {!showResult ? (
            // --- SELECTION STATE ---
            <Animated.View entering={FadeIn.delay(300)}>
              <View style={styles.optionsContainer}>
                {protocolOptions.map((item, index) => {
                  const isSelected = selectedProtocolIndex === index;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionCard, 
                        isSelected && styles.optionCardSelected
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedProtocolIndex(index);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.optionHeader}>
                        <View style={[styles.optionIconBox, isSelected && { backgroundColor: colors.primary }]}>
                            <Target size={18} color={isSelected ? "#FFF" : colors.textSecondary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.optionTitle, isSelected && { color: colors.primary }]}>
                            {item.title}
                            </Text>
                            <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                        </View>
                      </View>
                      <View style={[styles.radio, isSelected && styles.radioActive]}>
                          {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {isGenerating ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.scanBox}>
                    <Animated.View style={[styles.scanLine, scanLineStyle]} />
                    <Brain size={40} color={colors.primary} opacity={0.5} />
                  </View>
                  <Text style={styles.loadingText}>Compiling tactical execution plan...</Text>
                  <Text style={styles.loadingSubtext}>Applying Cognitive Profiling rules</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.primaryButton, selectedProtocolIndex === null && styles.primaryButtonDisabled]} 
                  disabled={selectedProtocolIndex === null}
                  onPress={handleGenerate}
                >
                  <Sparkles size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Generate Protocol Preview</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          ) : (
            // --- RESULT STATE (High-Tech Dark Card) ---
            <Animated.View entering={FadeInDown.duration(600)}>
              <View style={styles.tacticalCard}>
                
                <View style={styles.tacticalHeader}>
                    <View style={styles.liveIndicatorRow}>
                      <View style={styles.liveIndicator}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveText}>PROTOCOL GENERATED</Text>
                      </View>
                      <Text style={styles.tapHint}>(Tap steps to expand)</Text>
                    </View>
                    <Text style={styles.tacticalGoal}>{protocolOptions[selectedProtocolIndex!].title}</Text>
                </View>

                <View style={styles.insightBox}>
                    <ShieldCheck size={16} color="#10B981" />
                    <Text style={styles.insightText}>{protocolOptions[selectedProtocolIndex!].insight}</Text>
                </View>
                
                <View style={styles.tacticalList}>
                  {protocolOptions[selectedProtocolIndex!].tasks.map((task: any, idx: number) => {
                    const isExpanded = expandedTaskIndex === idx;
                    return (
                      <Animated.View 
                          key={idx} 
                          entering={FadeInDown.delay(200 + (idx * 150))} 
                      >
                        <TouchableOpacity 
                          style={[styles.tacticalTask, isExpanded && styles.tacticalTaskExpanded]}
                          activeOpacity={0.8}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setExpandedTaskIndex(isExpanded ? null : idx);
                          }}
                        >
                          <View style={styles.taskHeaderRow}>
                              <Text style={styles.taskStepNum}>0{idx + 1}</Text>
                              <Text style={styles.taskTitle}>{task.title}</Text>
                              <View style={styles.taskRightItems}>
                                <View style={styles.taskDurationBox}>
                                    <Clock size={10} color="#F59E0B" />
                                    <Text style={styles.taskDurationText}>{task.duration}m</Text>
                                </View>
                                {isExpanded ? (
                                  <ChevronUp size={16} color="#64748B" />
                                ) : (
                                  <ChevronDown size={16} color="#64748B" />
                                )}
                              </View>
                          </View>
                          <Text style={styles.taskDesc}>{task.desc}</Text>

                          {/* EXPANDED CONTENT */}
                          {isExpanded && (
                            <Animated.View entering={FadeInDown.duration(300)} style={styles.expandedContent}>
                              <View style={styles.expandedDivider} />
                              <View style={styles.inDepthHeader}>
                                <Zap size={12} color="#00F0FF" />
                                <Text style={styles.inDepthLabel}>AI TACTICAL INSIGHT</Text>
                              </View>
                              <Text style={styles.inDepthText}>{task.inDepth}</Text>
                            </Animated.View>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity style={styles.unlockButton} onPress={handleCreateAccount}>
                <Text style={styles.unlockButtonText}>Save Profile & Create Account</Text>
                <ArrowRight size={20} color="#000" />
              </TouchableOpacity>
            </Animated.View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: 24, paddingBottom: 60 },
  
  header: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  iconCircle: { width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(245, 158, 11, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },

  optionsContainer: { gap: 16, marginBottom: 32 },
  optionCard: { 
    backgroundColor: '#FFFFFF', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 2, 
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2
  },
  optionCardSelected: { borderColor: colors.primary, backgroundColor: '#FFFBEB' },
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, paddingRight: 16 },
  optionIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  optionSubtitle: { fontSize: 13, color: colors.textSecondary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  // Loader
  loadingContainer: { alignItems: 'center', paddingVertical: 30 },
  scanBox: { width: 100, height: 100, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  scanLine: { position: 'absolute', top: -50, width: '100%', height: 4, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOffset: {width:0, height:0}, shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
  loadingText: { fontSize: 15, color: colors.text, fontWeight: '700', marginBottom: 4 },
  loadingSubtext: { fontSize: 13, color: colors.textSecondary },

  primaryButton: { 
    backgroundColor: colors.text, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 18, 
    borderRadius: 20, 
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  primaryButtonDisabled: { backgroundColor: '#E5E7EB', shadowOpacity: 0, elevation: 0 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  // Tactical Result Card (Dark Mode)
  tacticalCard: {
    backgroundColor: '#0F172A', // Slate 900
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155', // Slate 700
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  tacticalHeader: { marginBottom: 20 },
  liveIndicatorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', shadowColor: '#10B981', shadowOpacity: 0.8, shadowRadius: 5 },
  liveText: { fontSize: 10, fontWeight: '800', color: '#10B981', letterSpacing: 1.5 },
  tapHint: { fontSize: 10, fontWeight: '600', color: '#64748B', fontStyle: 'italic' },
  tacticalGoal: { fontSize: 22, fontWeight: '800', color: '#F8FAFC' },

  insightBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 12, borderRadius: 12, gap: 10, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  insightText: { fontSize: 13, color: '#34D399', fontWeight: '600', flex: 1 },

  tacticalList: { gap: 16 },
  tacticalTask: { backgroundColor: '#1E293B', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  tacticalTaskExpanded: { borderColor: '#475569', backgroundColor: '#1e293b' },
  taskHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  taskStepNum: { fontSize: 12, fontWeight: '800', color: '#94A3B8', marginRight: 10 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', flex: 1 },
  taskRightItems: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskDurationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  taskDurationText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
  taskDesc: { fontSize: 13, color: '#94A3B8', lineHeight: 20, paddingLeft: 25 },

  expandedContent: {
    marginTop: 12,
    paddingLeft: 25, // Align with description text
  },
  expandedDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 12,
  },
  inDepthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  inDepthLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00F0FF',
    letterSpacing: 1,
  },
  inDepthText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 22,
    fontWeight: '500',
  },

  unlockButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 20,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 8
  },
  unlockButtonText: { color: '#000', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }
});