import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  Switch,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import { 
  ChevronLeft, 
  Settings, 
  Zap, 
  Clock, 
  Trophy, 
  Target, 
  Archive, 
  CheckCircle2, 
  User,
  Moon,
  Sunrise,
  Coffee,
  Bell,
  LogOut,
  ChevronRight,
  X,
  Brain // Added Brain for the onboarding icon
} from 'lucide-react-native';
import { lightColors as colors } from '../src/constants/colors';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';

// --- HELPER COMPONENTS ---

const MissionHistoryCard = ({ goal, delay }: { goal: any, delay: number }) => {
  const totalTasks = goal.tasks ? goal.tasks.length : 0;
  const totalDuration = goal.tasks ? goal.tasks.reduce((sum: number, t: any) => sum + (t.duration || 0), 0) : 0;
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).springify()}
      style={styles.historyCard}
    >
      <View style={styles.historyHeader}>
        <View style={styles.historyIcon}>
          <CheckCircle2 size={20} color="#10B981" />
        </View>
        <View style={styles.historyTitleBox}>
          <Text style={styles.historyTitle} numberOfLines={1}>{goal.title}</Text>
          <Text style={styles.historyDate}>
            {new Date(goal.completedAt || goal.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.historyStats}>
        <View style={styles.historyStatItem}>
          <Clock size={12} color={colors.textSecondary} />
          <Text style={styles.historyStatText}>{(totalDuration / 60).toFixed(1)}h Focused</Text>
        </View>
        <View style={styles.historyStatItem}>
          <Target size={12} color={colors.textSecondary} />
          <Text style={styles.historyStatText}>{totalTasks} Tasks</Text>
        </View>
        <View style={styles.historyBadge}>
          <Text style={styles.historyBadgeText}>COMPLETED</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const StatBox = ({ label, value, icon: Icon, delay }: any) => (
  <Animated.View 
    entering={FadeInDown.delay(delay).springify()}
    style={styles.statBox}
  >
    <View style={styles.statIconBg}>
      <Icon size={20} color={colors.primary} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Animated.View>
);

const SettingsModal = ({ visible, onClose, onLogout, onRedoOnboarding }: any) => {
  const [notifications, setNotifications] = useState(true);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.settingsContainer}>
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.settingsContent}>
          <View style={styles.settingGroup}>
            <Text style={styles.settingGroupTitle}>PREFERENCES</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Bell size={20} color="#4F46E5" />
                </View>
                <Text style={styles.settingText}>Push Notifications</Text>
              </View>
              <Switch 
                value={notifications} 
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            {/* Redo Onboarding Option */}
            <TouchableOpacity style={styles.settingRow} onPress={onRedoOnboarding}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#FFF7ED' }]}>
                  <Brain size={20} color={colors.primary} />
                </View>
                <Text style={styles.settingText}>Update Operative Profile</Text>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingGroup}>
            <Text style={styles.settingGroupTitle}>ACCOUNT</Text>
            
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#F3F4F6' }]}>
                  <User size={20} color={colors.text} />
                </View>
                <Text style={styles.settingText}>Edit Profile</Text>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={onLogout}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#FEE2E2' }]}>
                  <LogOut size={20} color={colors.error} />
                </View>
                <Text style={[styles.settingText, { color: colors.error }]}>Log Out</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Productivity Ops v1.0.3</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// --- MAIN COMPONENT ---

export default function ProfileScreen() {
  const router = useRouter();
  const { user, goals, setUser } = useApp();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Filter for archived/completed goals
  const archivedGoals = useMemo(() => {
    return goals.filter(g => g.status === 'archived').sort((a, b) => {
      const dateA = new Date(a.completedAt || a.createdAt).getTime();
      const dateB = new Date(b.completedAt || b.createdAt).getTime();
      return dateB - dateA; // Newest first
    });
  }, [goals]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.email) {
        try {
          const data = await apiService.getUserProfile(user.email);
          setProfileData(data);
        } catch (error) {
          console.error("Failed to load profile", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Log Out", 
        style: "destructive", 
        onPress: () => {
          setSettingsVisible(false);
          setUser(null);
          router.replace('/auth');
        }
      }
    ]);
  };

  const handleRedoOnboarding = () => {
    setSettingsVisible(false);
    // Navigate to onboarding wizard. 
    // Since user is logged in, app/onboarding.tsx will update existing profile instead of creating new.
    router.push('/onboarding');
  };

  // Helper for icons based on archetype
  const getArchetypeIcon = () => {
    const arch = profileData?.onboardingData?.focusWindow;
    if (arch === 'night-owl' || arch === 'late_night') return Moon;
    if (arch === 'early-bird' || arch === 'early_morning') return Sunrise;
    return Coffee; // Default
  };
  const ArchetypeIcon = getArchetypeIcon();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ChevronLeft size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Operative Profile</Text>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => setSettingsVisible(true)}
          >
            <Settings size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Identity Card */}
          <Animated.View 
            entering={FadeInDown.delay(100).springify()}
            style={styles.identityCard}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{profileData?.name?.[0] || "U"}</Text>
            </View>
            <View style={styles.identityText}>
              <Text style={styles.userName}>{profileData?.name || "Unknown Agent"}</Text>
              <Text style={styles.userLevel}>
                Level {profileData?.stats?.level || 1} Strategist
              </Text>
            </View>
            <View style={styles.archetypeBadge}>
              <Text style={styles.archetypeText}>
                {profileData?.onboardingData?.workArchetype ? profileData.onboardingData.workArchetype.replace('_', ' ') : "Recruit"}
              </Text>
            </View>
          </Animated.View>

          {/* Efficiency Metrics */}
          <Text style={styles.sectionHeader}>Efficiency Metrics</Text>
          <View style={styles.statsGrid}>
            <StatBox label="Streak" value={`${profileData?.stats?.streak || 0} Day`} icon={Zap} delay={200} />
            <StatBox label="Hours" value={`${profileData?.stats?.hoursFocused || 0}h`} icon={Clock} delay={300} />
            <StatBox label="Tasks" value={profileData?.stats?.tasksCrushed || 0} icon={Trophy} delay={400} />
          </View>

          {/* Cognitive DNA */}
          <Text style={styles.sectionHeader}>Cognitive DNA</Text>
          <View style={styles.dnaContainer}>
            {profileData?.onboardingData?.focusWindow && (
                <Animated.View entering={FadeInDown.delay(500)} style={styles.dnaTag}>
                    <ArchetypeIcon size={14} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.dnaText, { color: colors.primary }]}>
                        {profileData.onboardingData.focusWindow.replace(/[_-]/g, ' ').toUpperCase()}
                    </Text>
                </Animated.View>
            )}
            
            {profileData?.onboardingData?.frictionVillain && (
                <Animated.View entering={FadeInDown.delay(600)} style={styles.dnaTag}>
                    <Target size={14} color="#10B981" style={{ marginRight: 6 }} />
                    <Text style={[styles.dnaText, { color: "#10B981" }]}>
                        FIGHTING: {profileData.onboardingData.frictionVillain.replace(/[_-]/g, ' ').toUpperCase()}
                    </Text>
                </Animated.View>
            )}
          </View>

          {/* Mission Archive Section */}
          <View style={styles.archiveHeaderRow}>
            <Text style={styles.sectionHeader}>Mission Archive</Text>
            <View style={styles.archiveCountBadge}>
              <Archive size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.archiveCountText}>{archivedGoals.length}</Text>
            </View>
          </View>

          {archivedGoals.length === 0 ? (
            <View style={styles.emptyArchive}>
              <Text style={styles.emptyText}>No completed missions yet.</Text>
            </View>
          ) : (
            <View style={styles.archiveList}>
              {archivedGoals.map((goal, index) => (
                <MissionHistoryCard key={goal.id} goal={goal} delay={500 + (index * 100)} />
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        <SettingsModal 
          visible={settingsVisible} 
          onClose={() => setSettingsVisible(false)}
          onLogout={handleLogout}
          onRedoOnboarding={handleRedoOnboarding}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  iconBtn: { padding: 8, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  scrollContent: { padding: 24 },
  
  identityCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: colors.border, marginBottom: 32 },
  avatarContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  identityText: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  userLevel: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  archetypeBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  archetypeText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'capitalize' },
  
  sectionHeader: { fontSize: 14, fontWeight: '800', color: colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginLeft: 4 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(245, 158, 11, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4, textAlign: 'center' },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },

  // DNA Styles
  dnaContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  dnaTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  dnaText: { fontSize: 13, fontWeight: '600' },

  // Archive Styles
  archiveHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  archiveCountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  archiveCountText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  emptyArchive: { padding: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB' },
  emptyText: { color: colors.textSecondary, fontWeight: '500' },
  archiveList: { gap: 12 },
  
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  historyIcon: { marginRight: 12 },
  historyTitleBox: { flex: 1 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  historyDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  historyStats: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  historyStatItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyStatText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  historyBadge: { marginLeft: 'auto', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  historyBadgeText: { fontSize: 10, fontWeight: '800', color: '#059669', letterSpacing: 0.5 },

  // Settings Modal Styles
  settingsContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: colors.border },
  settingsTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 4 },
  settingsContent: { padding: 24 },
  settingGroup: { marginBottom: 32 },
  settingGroupTitle: { fontSize: 12, fontWeight: '800', color: colors.textLight, marginBottom: 12, marginLeft: 4 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  settingRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  settingText: { fontSize: 16, fontWeight: '600', color: colors.text },
  versionContainer: { alignItems: 'center', marginTop: 20 },
  versionText: { color: colors.textLight, fontSize: 12 },
});