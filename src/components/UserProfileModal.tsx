import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert, Dimensions, ScrollView, Switch, Linking } from 'react-native';
import Animated, { FadeIn, ZoomIn, FadeOut } from 'react-native-reanimated';
import { X, UserPlus, UserCheck, Flag, Zap, Clock, Trophy, Moon, Sunrise, Coffee, Bell, Brain, User, LogOut, FileText, ShieldCheck, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apiService } from '../services/api';
import { lightColors as colors } from '../constants/colors';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

interface UserProfileModalProps {
  visible: boolean;
  userId: string | null;
  onClose: () => void;
}

const getArchetypeIcon = (arch: string) => {
  if (arch === 'night-owl' || arch === 'late_night') return Moon;
  if (arch === 'early-bird' || arch === 'early_morning') return Sunrise;
  return Coffee;
};

// --- SETTINGS MODAL COMPONENT ---
const SettingsModal = ({ visible, onClose, onLogout, onRedoOnboarding, onEditProfile }: any) => {
  const [notifications, setNotifications] = useState(true);

  const openLegal = (url: string) => Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open link."));

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
            
            <TouchableOpacity style={styles.settingRow} onPress={onEditProfile}>
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

          <View style={styles.settingGroup}>
            <Text style={styles.settingGroupTitle}>LEGAL</Text>
            
            {/* TERMS OF SERVICE LINK - UPDATED */}
            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={() => openLegal('https://docs.google.com/document/d/e/2PACX-1vRWHAlFYsD7whJGjq5uAUm7bWFS9YgqofzaIOFR-GCIflrtgiW4kkTNrA42cCp7ng0jo3Lh-J_pCT1d/pub')}
            >
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#F9FAFB' }]}>
                  <FileText size={20} color={colors.textSecondary} />
                </View>
                <Text style={styles.settingText}>Terms of Service</Text>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </TouchableOpacity>

            {/* PRIVACY POLICY LINK - UPDATED */}
            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={() => openLegal('https://docs.google.com/document/d/e/2PACX-1vTOwIb-0iHE2b5HNT8tLRPIXNVPCmqlGJtmpplqdEIABPM6X56e5jw2oW6E_IpTrky00fJVosTo-zLB/pub')}
            >
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#F9FAFB' }]}>
                  <ShieldCheck size={20} color={colors.textSecondary} />
                </View>
                <Text style={styles.settingText}>Privacy Policy</Text>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>ProdAI v1.0.3</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export { SettingsModal }; // Export for use in Profile screen

// --- MAIN USER PROFILE MODAL ---
export const UserProfileModal: React.FC<UserProfileModalProps> = ({ visible, userId, onClose }) => {
  const { user: currentUser } = useApp();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (visible && userId && currentUser) {
      loadProfile();
    }
  }, [visible, userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      if (!userId || !currentUser) return;
      const data = await apiService.getPublicProfile(userId, currentUser.id);
      setProfile(data);
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not load operative data.");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser || !userId) return;
    setFollowLoading(true);
    Haptics.selectionAsync();
    try {
      await apiService.toggleFollow(currentUser.id, userId);
      setIsFollowing(prev => !prev);
    } catch (error) {
      Alert.alert("Error", "Action failed.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleReport = () => {
    Alert.alert(
      "Report Operative",
      "Is this user violating community protocols?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report as Spam",
          onPress: () => submitReport("Spam"),
          style: "destructive"
        },
        {
          text: "Report for Abuse",
          onPress: () => submitReport("Abuse"),
          style: "destructive"
        }
      ]
    );
  };

  const submitReport = async (reason: string) => {
    if (!currentUser || !userId) return;
    try {
      await apiService.reportUser(currentUser.id, userId, reason);
      Alert.alert("Report Sent", "Command HQ has received your report.");
      onClose();
    } catch (e) {
      Alert.alert("Error", "Could not send report.");
    }
  };

  if (!visible) return null;

  const ArchetypeIcon = profile?.habits?.focusWindow ? getArchetypeIcon(profile.habits.focusWindow) : Coffee;
  const isMe = currentUser?.id === userId;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.backdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        {/* CENTERED POPUP CARD */}
        <Animated.View entering={ZoomIn.duration(250).springify()} style={styles.card}>
          
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : (
            <>
              {/* Header Profile Section */}
              <View style={styles.headerSection}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{profile?.name?.[0]}</Text>
                </View>
                <Text style={styles.name}>{profile?.name}</Text>
                <Text style={styles.subtext}>Operative • {profile?.followersCount || 0} Allies</Text>
                
                <TouchableOpacity onPress={onClose} style={styles.absoluteCloseBtn}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* DNA / Habits Pill */}
              {profile?.habits?.focusWindow && (
                <View style={styles.dnaBox}>
                  <ArchetypeIcon size={14} color={colors.primary} />
                  <Text style={styles.dnaText}>
                    OPERATING WINDOW: {profile.habits.focusWindow.replace('-', ' ').toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              {/* Stats Grid */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{profile?.streak}</Text>
                  <Text style={styles.statLabel}>STREAK</Text>
                </View>
                <View style={styles.verticalLine} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{profile?.stats?.hoursFocused}</Text>
                  <Text style={styles.statLabel}>HOURS</Text>
                </View>
                <View style={styles.verticalLine} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{profile?.stats?.tasksCrushed}</Text>
                  <Text style={styles.statLabel}>TASKS</Text>
                </View>
              </View>

              {/* Actions */}
              {!isMe && (
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={[styles.btn, isFollowing ? styles.followingBtn : styles.followBtn]} 
                    onPress={handleToggleFollow}
                    disabled={followLoading}
                  >
                    {followLoading ? (
                      <ActivityIndicator color={isFollowing ? colors.text : "#FFF"} size="small" />
                    ) : (
                      <>
                        {isFollowing ? <UserCheck size={18} color={colors.text} /> : <UserPlus size={18} color="#FFF" />}
                        <Text style={[styles.btnText, isFollowing && styles.followingText]}>
                          {isFollowing ? "FOLLOWING" : "ADD TO SQUAD"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.reportBtn} onPress={handleReport}>
                    <Flag size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 999 
  },
  backdrop: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.6)' 
  },
  card: { 
    width: width * 0.85,
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 24, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  },
  loadingBox: { 
    height: 200, 
    justifyContent: 'center', 
    alignItems: 'center',
    width: '100%' 
  },
  
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%'
  },
  absoluteCloseBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 4,
    borderColor: '#FFF3CD'
  },
  avatarText: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: '#FFF' 
  },
  name: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: colors.text,
    textAlign: 'center'
  },
  subtext: { 
    fontSize: 14, 
    color: colors.textSecondary, 
    marginTop: 4,
    fontWeight: '500'
  },

  dnaBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#F0F9FF', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 20, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0F2FE'
  },
  dnaText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: '#0284C7', 
    letterSpacing: 0.5 
  },

  divider: {
    height: 1,
    width: '100%',
    backgroundColor: '#F3F4F6',
    marginBottom: 20
  },

  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 10
  },
  statItem: { 
    alignItems: 'center',
    flex: 1
  },
  verticalLine: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB'
  },
  statVal: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: colors.text 
  },
  statLabel: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: colors.textSecondary, 
    marginTop: 4,
    letterSpacing: 1
  },

  actions: { 
    flexDirection: 'row', 
    gap: 12,
    width: '100%'
  },
  btn: { 
    flex: 1, 
    height: 50, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8 
  },
  followBtn: { 
    backgroundColor: colors.primary, 
    shadowColor: colors.primary, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 4 
  },
  followingBtn: { 
    backgroundColor: '#F3F4F6', 
    borderWidth: 1, 
    borderColor: '#E5E7EB' 
  },
  btnText: { 
    fontWeight: '700', 
    color: '#FFF', 
    fontSize: 14 
  },
  followingText: { 
    color: colors.text 
  },
  reportBtn: { 
    width: 50, 
    height: 50, 
    borderRadius: 16, 
    backgroundColor: '#FFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E5E7EB' 
  },

  // Settings Modal specific styles
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