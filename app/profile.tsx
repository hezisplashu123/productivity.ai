import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { 
  ChevronLeft, 
  Settings, 
  Zap, 
  Clock, 
  Target, // <--- Added missing import
  Trophy, 
  Moon, 
  ChevronRight, 
  LogOut, 
  User, 
  Bell, 
  Sunrise, 
  Coffee
} from 'lucide-react-native';
import { lightColors as colors } from '../src/constants/colors';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useApp();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    setUser(null);
    router.replace('/auth');
  };

  // Helper to map onboarding data to icons
  const getArchetypeIcon = () => {
    const arch = profileData?.onboardingData?.workArchetype;
    if (arch === 'night-owl') return Moon;
    if (arch === 'early-bird') return Sunrise;
    return Coffee; // Default
  };

  const ArchetypeIcon = getArchetypeIcon();

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

  const MenuRow = ({ label, icon: Icon, isDestructive = false, hasToggle = false, onPress }: any) => (
    <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.menuRowLeft}>
        <View style={[styles.menuIconBg, isDestructive && { backgroundColor: '#FEE2E2' }]}>
          <Icon size={20} color={isDestructive ? colors.error : colors.text} />
        </View>
        <Text style={[styles.menuText, isDestructive && { color: colors.error }]}>{label}</Text>
      </View>
      {hasToggle ? (
        <Switch 
          trackColor={{ false: "#E5E7EB", true: colors.primary }}
          thumbColor={"#FFFFFF"}
          value={true}
        />
      ) : (
        <ChevronRight size={20} color={colors.textLight} />
      )}
    </TouchableOpacity>
  );

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
          <TouchableOpacity style={styles.iconBtn}>
            <Settings size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* User Identity Card */}
          <Animated.View 
            entering={FadeInDown.delay(100).springify()}
            style={styles.identityCard}
          >
            <View style={styles.avatarContainer}>
              <User size={40} color={colors.primary} />
            </View>
            <View style={styles.identityText}>
              <Text style={styles.userName}>{profileData?.name || "Unknown Agent"}</Text>
              <Text style={styles.userLevel}>
                Level {profileData?.stats?.level || 1} Strategist
              </Text>
            </View>
            <View style={styles.archetypeBadge}>
              <Text style={styles.archetypeText}>
                {profileData?.onboardingData?.workArchetype || "Recruit"}
              </Text>
            </View>
          </Animated.View>

          {/* Efficiency Metrics */}
          <Text style={styles.sectionHeader}>Efficiency Metrics</Text>
          <View style={styles.statsGrid}>
            <StatBox 
              label="Current Streak" 
              value={`${profileData?.stats?.streak || 0} Days`} 
              icon={Zap} 
              delay={200} 
            />
            <StatBox 
              label="Hours Focused" 
              value={`${profileData?.stats?.hoursFocused || 0}h`} 
              icon={Clock} 
              delay={300} 
            />
            <StatBox 
              label="Tasks Crushed" 
              value={profileData?.stats?.tasksCrushed || 0} 
              icon={Trophy} 
              delay={400} 
            />
          </View>

          {/* Cognitive DNA */}
          <Text style={styles.sectionHeader}>Cognitive DNA</Text>
          <View style={styles.dnaContainer}>
            {/* Primary Focus Window */}
            {profileData?.onboardingData?.focusWindow && (
                <Animated.View entering={FadeInRight.delay(500)} style={styles.dnaTag}>
                    <ArchetypeIcon size={14} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.dnaText, { color: colors.primary }]}>
                        {profileData.onboardingData.focusWindow.replace('-', ' ').toUpperCase()}
                    </Text>
                </Animated.View>
            )}
            
            {/* Distraction Type */}
            {profileData?.onboardingData?.distraction && (
                <Animated.View entering={FadeInRight.delay(600)} style={styles.dnaTag}>
                    <Target size={14} color="#10B981" style={{ marginRight: 6 }} />
                    <Text style={[styles.dnaText, { color: "#10B981" }]}>
                        FIGHTING: {profileData.onboardingData.distraction.toUpperCase()}
                    </Text>
                </Animated.View>
            )}
          </View>

          {/* Settings & Preferences */}
          <Text style={styles.sectionHeader}>System Preferences</Text>
          <View style={styles.menuContainer}>
            <MenuRow label="Push Notifications" icon={Bell} hasToggle />
            <View style={styles.divider} />
            <MenuRow label="Account Details" icon={User} />
            <View style={styles.divider} />
            <MenuRow label="Log Out" icon={LogOut} isDestructive onPress={handleLogout} />
          </View>

          <Text style={styles.versionText}>Productivity AI v1.0.0 (Beta)</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    padding: 24,
  },
  identityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 32,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  identityText: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userLevel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  archetypeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  archetypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dnaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  dnaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dnaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 32,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 70, 
  },
  versionText: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '500',
  },
});