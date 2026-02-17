import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  AppState, 
  Switch,
  Alert,
  Platform,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake'; 
import { Accelerometer } from 'expo-sensors';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  interpolateColor
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { 
  X, 
  Pause, 
  Play, 
  Check, 
  SmartphoneNfc, 
  ScanFace,
  ShieldAlert,
  Lock,
  ExternalLink
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { lightColors as colors } from '../src/constants/colors';
import { useApp } from '../src/context/AppContext';
import { SessionDebrief } from '../src/components/SessionDebrief';

// --- IMPORT NATIVE MODULE ---
import * as ScreenTime from '../modules/screen-time-control';

const MOVEMENT_THRESHOLD = 0.15; 

export default function FocusSessionScreen() {
  useKeepAwake(); // Prevents screen from sleeping
  const router = useRouter();
  const { taskId, duration } = useLocalSearchParams();
  const { tasks, completeTask, updateTask } = useApp();
  
  // Find task data
  const task = tasks.find(t => t.id === taskId) || { title: 'Deep Work Protocol', duration: Number(duration) || 25, link: undefined };

  // --- STATE ---
  const [isSetup, setIsSetup] = useState(true); // Setup phase
  const [timeLeft, setTimeLeft] = useState((Number(duration) || 25) * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionState, setSessionState] = useState<'focus' | 'paused' | 'compromised'>('focus');
  const [phoneRequired, setPhoneRequired] = useState(false); 
  const [showDebrief, setShowDebrief] = useState(false); 
  const [isLocked, setIsLocked] = useState(false); // Track if Screen Time API is active
  
  // --- ANIMATIONS ---
  const pulse = useSharedValue(1);
  const bgProgress = useSharedValue(0); // 0 = Black, 1 = Red (Compromised)

  // --- REFS ---
  const appState = useRef(AppState.currentState);
  const subscription = useRef<any>(null);

  // --- 1. HANDLERS ---

  const handleStartMission = async () => {
    // If phone is NOT required, lock it using Native Module
    if (!phoneRequired) {
      try {
        // 1. Request Authorization (iOS will show popup, Android returns true)
        const authorized = await ScreenTime.requestAuthorization();
        
        if (authorized) {
          // 2. Engage Lock
          await ScreenTime.startRestriction();
          setIsLocked(true);
          console.log("🔒 Native Lock Engaged");
        } else {
          Alert.alert(
            "Permission Required", 
            "To use Hard Mode, please allow Screen Time / Admin access when prompted."
          );
          return; // Stop if they refused permissions
        }
      } catch (e) {
        console.error("Lock Error:", e);
        // Fallback: let them proceed without lock if error
      }
    } else {
      console.log("⚠️ Soft Mode: Screen Time Controls bypassed");
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSetup(false);
    setIsActive(true);
  };

  const unlockDevice = async () => {
    if (isLocked) {
      try {
        await ScreenTime.stopRestriction();
        setIsLocked(false);
        console.log("🔓 Native Lock Released");
      } catch (e) {
        console.error("Unlock Error:", e);
      }
    }
  };

  const handleTimerEnd = async () => {
    setIsActive(false);
    await unlockDevice();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowDebrief(true);
  };

  const handleOpenLink = () => {
    if (task.link?.url) {
      Haptics.selectionAsync();
      Linking.openURL(task.link.url);
    }
  };

  // --- DEBRIEF LOGIC ---
  const handleDebriefComplete = (data: { completed: boolean; distraction?: string; addedMinutes?: number }) => {
    if (taskId) {
      if (data.completed) {
        completeTask(taskId as string);
      } else if (data.addedMinutes) {
        updateTask(taskId as string, {
          duration: data.addedMinutes,
          status: 'queued'
        });
      }
    }
    router.back();
  };

  const handleAbort = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Abort Mission?",
      "Giving up now will break your streak.",
      [
        { text: "Stay Focused", style: "cancel" },
        { 
          text: "I Give Up", 
          style: "destructive", 
          onPress: async () => {
            await unlockDevice();
            router.back();
          } 
        }
      ]
    );
  };

  const handleResume = () => {
    setSessionState('focus');
    setIsActive(true);
    bgProgress.value = withTiming(0, { duration: 500 });
  };

  // --- 2. SENSORS LOGIC ---

  // App State Monitoring
  useEffect(() => {
    const appStateSub = AppState.addEventListener('change', nextAppState => {
      if (isSetup || phoneRequired) return; 
      
      // If user manages to leave app while locked (or hard mode enabled), trigger compromise
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        triggerCompromised();
      }
      appState.current = nextAppState;
    });
    return () => appStateSub.remove();
  }, [phoneRequired, isSetup]);

  // Accelerometer Monitoring
  useEffect(() => {
    const enableSensors = async () => {
      if (isSetup || phoneRequired || !isActive || sessionState !== 'focus') {
        if (subscription.current) {
          subscription.current.remove();
          subscription.current = null;
        }
        return;
      }
      Accelerometer.setUpdateInterval(500); 
      let lastData = { x: 0, y: 0, z: 0 };
      subscription.current = Accelerometer.addListener(data => {
        const delta = Math.abs(data.x - lastData.x) + Math.abs(data.y - lastData.y) + Math.abs(data.z - lastData.z);
        if (lastData.x !== 0 && delta > MOVEMENT_THRESHOLD) triggerCompromised();
        lastData = data;
      });
    };
    enableSensors();
    return () => { if (subscription.current) subscription.current.remove(); };
  }, [phoneRequired, isActive, sessionState, isSetup]);

  const triggerCompromised = () => {
    if (sessionState === 'compromised') return;
    setSessionState('compromised');
    setIsActive(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    bgProgress.value = withTiming(1, { duration: 300 });
  };

  // --- 3. TIMER LOGIC ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0 && !isSetup) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      pulse.value = withRepeat(
        withSequence(withTiming(1.02, { duration: 1500 }), withTiming(1, { duration: 1500 })), 
        -1, true
      );
    } else if (timeLeft <= 0 && !isSetup && isActive) {
      handleTimerEnd();
    } else if (timeLeft <= 0 && !isSetup) {
      pulse.value = withTiming(1, { duration: 300 });
    } else {
      pulse.value = withTiming(1, { duration: 300 });
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isSetup]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Animated Styles
  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(bgProgress.value, [0, 1], ['#000000', '#450a0a'])
  }));

  const timerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: sessionState === 'compromised' ? 0.3 : 1,
    color: interpolateColor(bgProgress.value, [0, 1], ['#FFFFFF', '#EF4444'])
  }));

  // --- RENDER SETUP ---
  if (isSetup) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.setupContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={router.back} style={styles.closeBtn}>
              <X size={24} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
            <Text style={styles.setupHeaderTitle}>MISSION BRIEF</Text>
            <View style={{ width: 40 }} />
          </View>

          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={styles.setupContent}>
            <Text style={styles.setupTaskTitle} numberOfLines={2}>{task.title}</Text>
            <Text style={styles.setupDuration}>{Math.floor(timeLeft / 60)} Minutes</Text>

            <View style={styles.configCard}>
              <View style={styles.configHeader}>
                {phoneRequired ? 
                  <SmartphoneNfc size={24} color="#10B981" /> : 
                  <Lock size={24} color="#F59E0B" /> 
                }
                <Text style={styles.configTitle}>Distraction Block</Text>
                <Switch 
                  value={!phoneRequired} 
                  onValueChange={(val) => { setPhoneRequired(!val); Haptics.selectionAsync(); }}
                  trackColor={{ false: "#333", true: "rgba(245, 158, 11, 0.3)" }}
                  thumbColor={!phoneRequired ? "#10B981" : "#F59E0B"}
                />
              </View>
              <Text style={styles.configDescription}>
                {!phoneRequired 
                  ? "HARD MODE: App Pinning/Screen Time & Sensors Active." 
                  : "SOFT MODE: Sensors disabled for phone use."}
              </Text>
              
              <View style={[styles.warningBox, { borderColor: !phoneRequired ? '#F59E0B' : '#10B981' }]}>
                <Text style={[styles.warningTitle, { color: !phoneRequired ? '#F59E0B' : '#10B981' }]}>
                  {!phoneRequired ? 'HARD LOCK ENABLED' : 'SOFT LOCK ONLY'}
                </Text>
                <Text style={styles.warningText}>
                  {!phoneRequired 
                    ? 'Do not leave the app. Do not move the phone.' 
                    : 'Background tracking only. You can use other apps.'}
                </Text>
              </View>
            </View>
          </MotiView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.engageBtn} onPress={handleStartMission} activeOpacity={0.8}>
              <ScanFace size={24} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.engageText}>ENGAGE</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // --- RENDER ACTIVE SESSION ---
  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <StatusBar style="light" hidden={sessionState === 'focus'} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleAbort} style={styles.closeBtn}>
            <X size={24} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
          <View style={[styles.statusBadge, sessionState === 'compromised' ? styles.statusBadgeCompromised : null]}>
            <View style={[styles.dot, { backgroundColor: sessionState === 'focus' ? '#10B981' : sessionState === 'compromised' ? '#EF4444' : '#F59E0B' }]} />
            <Text style={styles.statusText}>
              {sessionState === 'focus' 
                ? (isLocked ? 'SYSTEM LOCKED' : phoneRequired ? 'SENTINEL (LITE)' : 'SENTINEL ACTIVE') 
                : sessionState === 'compromised' ? 'BREACH DETECTED' : 'PAUSED'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {sessionState === 'compromised' && (
          <View style={styles.compromisedContainer}>
            <ShieldAlert size={64} color="#EF4444" style={{ marginBottom: 20 }} />
            <Text style={styles.compromisedTitle}>MISSION COMPROMISED</Text>
            <Text style={styles.compromisedSubtitle}>Movement or distraction detected.</Text>
            <TouchableOpacity style={styles.resumeBtn} onPress={handleResume}>
              <Text style={styles.resumeText}>I'M BACK ON TASK</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.taskContainer}>
            <Text style={styles.taskLabel}>CURRENT OBJECTIVE</Text>
            <Text style={styles.taskTitle} numberOfLines={3}>{task.title}</Text>
            
            {/* LINK BUTTON */}
            {task.link && (
                <TouchableOpacity 
                    style={styles.linkButton} 
                    onPress={handleOpenLink}
                    activeOpacity={0.8}
                >
                    <ExternalLink size={16} color="#F59E0B" />
                    <Text style={styles.linkText}>OPEN RESOURCE</Text>
                </TouchableOpacity>
            )}
          </View>
          <Animated.Text style={[styles.timer, timerStyle]}>{formatTime(timeLeft)}</Animated.Text>
        </View>

        <View style={styles.footer}>
            {sessionState !== 'compromised' && (
                <View style={styles.controls}>
                <TouchableOpacity style={styles.controlBtn} onPress={() => setIsActive(!isActive)}>
                    {isActive ? <Pause size={32} color="#FFFFFF" /> : <Play size={32} color="#FFFFFF" />}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.controlBtn, styles.completeBtn]} onPress={handleTimerEnd}>
                    <Check size={32} color="#000000" />
                </TouchableOpacity>
                </View>
            )}
        </View>
      </SafeAreaView>

      <SessionDebrief visible={showDebrief} onComplete={handleDebriefComplete} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  setupContainer: { flex: 1, paddingHorizontal: 24 },
  setupHeaderTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  setupContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  setupTaskTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  setupDuration: { fontSize: 16, color: '#F59E0B', fontWeight: '600', marginBottom: 40, textTransform: 'uppercase', letterSpacing: 1 },
  configCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  configHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  configTitle: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginLeft: 12 },
  configDescription: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  warningBox: { padding: 16, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, borderLeftWidth: 3 },
  warningTitle: { fontSize: 12, fontWeight: '800', marginBottom: 6, letterSpacing: 1 },
  warningText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 18 },
  engageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F59E0B', width: '100%', paddingVertical: 18, borderRadius: 30, shadowColor: '#F59E0B', shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
  engageText: { color: '#000000', fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10, zIndex: 10 },
  closeBtn: { padding: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statusBadgeCompromised: { borderColor: 'rgba(239, 68, 68, 0.5)', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  taskContainer: { alignItems: 'center', marginBottom: 60 },
  taskLabel: { color: '#F59E0B', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' },
  taskTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', textAlign: 'center', lineHeight: 34 },
  timer: { fontSize: 90, fontWeight: '800', color: '#FFFFFF', fontVariant: ['tabular-nums'], letterSpacing: -2 },
  footer: { paddingBottom: 50, alignItems: 'center', paddingHorizontal: 30 },
  controls: { flexDirection: 'row', gap: 40 },
  controlBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  completeBtn: { backgroundColor: '#F59E0B', borderColor: '#F59E0B', shadowColor: '#F59E0B', shadowOpacity: 0.4, shadowRadius: 20 },
  
  compromisedContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 20, padding: 40 },
  compromisedTitle: { color: '#EF4444', fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
  compromisedSubtitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  resumeBtn: { backgroundColor: '#FFFFFF', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30 },
  resumeText: { color: '#000000', fontWeight: '800', fontSize: 14, letterSpacing: 1 },

  linkButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  linkText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});