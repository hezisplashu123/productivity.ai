import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Share 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Search, UserPlus, Users, Share2, Flame, User, Inbox, Check, X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { lightColors as colors } from '../src/constants/colors';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';
import { UserProfileModal } from '../src/components/UserProfileModal';

export default function SocialScreen() {
  const router = useRouter();
  const { user, refreshData, pendingRequestsCount } = useApp();
  
  const [activeTab, setActiveTab] = useState<'squad' | 'requests' | 'search'>('squad');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Load data based on tab
  useEffect(() => {
    if (activeTab === 'squad') fetchFriends();
    if (activeTab === 'requests') fetchRequests();
  }, [activeTab]);

  // Search Debounce
  useEffect(() => {
    if (activeTab === 'search') {
      const delayDebounceFn = setTimeout(() => {
        if (searchQuery.trim().length > 0) {
          performSearch(searchQuery);
        } else {
          setSearchResults([]);
          setLoading(false);
        }
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery, activeTab]);

  const fetchFriends = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await apiService.getFriends(user.id);
      setFriends(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const fetchRequests = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await apiService.getFriendRequests(user.id);
      setRequests(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const results = await apiService.searchUsers(query);
      setSearchResults(results.filter((u: any) => u.id !== user?.id));
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleInvite = async () => {
    try {
      await Share.share({ message: "Join me on ProdAI." });
    } catch (error) { console.error(error); }
  };

  const handleRespond = async (requestId: string, action: 'accept' | 'decline') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiService.respondToRequest(requestId, action);
      // Remove from local list immediately
      setRequests(prev => prev.filter(r => r.requestId !== requestId));
      // Trigger global refresh to update badge count
      refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity 
        style={styles.userCard}
        onPress={() => {
          Haptics.selectionAsync();
          setSelectedUserId(item.id);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name?.[0] || 'U'}</Text>
        </View>
        
        <View style={styles.userInfo}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Text style={styles.userName}>{item.name}</Text>
            {/* RED DOT for Pending Requests */}
            {activeTab === 'requests' && <View style={styles.redDot} />}
          </View>
          <View style={styles.statsRow}>
            <Flame size={12} color={colors.primary} />
            <Text style={styles.streakText}>{item.streak || 0} Day Streak</Text>
          </View>
        </View>

        {/* Dynamic Action Buttons */}
        {activeTab === 'requests' ? (
          <View style={styles.requestActions}>
            <TouchableOpacity 
                style={[styles.iconBtn, { backgroundColor: '#FEE2E2' }]} 
                onPress={() => handleRespond(item.requestId, 'decline')}
            >
                <X size={18} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.iconBtn, { backgroundColor: '#DCFCE7' }]} 
                onPress={() => handleRespond(item.requestId, 'accept')}
            >
                <Check size={18} color="#16A34A" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.actionBtn}>
            {activeTab === 'search' ? (
              <UserPlus size={20} color={colors.primary} />
            ) : (
              <User size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Command Center</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'squad' && styles.activeTab]} 
            onPress={() => setActiveTab('squad')}
          >
            <Users size={16} color={activeTab === 'squad' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'squad' && styles.activeTabText]}>Squad</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]} 
            onPress={() => setActiveTab('requests')}
          >
            <Inbox size={16} color={activeTab === 'requests' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>Requests</Text>
            {pendingRequestsCount > 0 && <View style={styles.tabBadge} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, activeTab === 'search' && styles.activeTab]} 
            onPress={() => setActiveTab('search')}
          >
            <Search size={16} color={activeTab === 'search' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>Search</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'search' && (
            <View style={styles.searchBox}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search operatives..."
                placeholderTextColor={colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {loading && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
          )}

          {loading && activeTab !== 'search' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={activeTab === 'squad' ? friends : activeTab === 'requests' ? requests : searchResults}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Users size={48} color={colors.textLight} />
                  <Text style={styles.emptyText}>
                    {activeTab === 'squad' ? "No friends yet." : 
                     activeTab === 'requests' ? "No pending requests." : "No agents found."}
                  </Text>
                  {activeTab === 'squad' && (
                    <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite}>
                      <Share2 size={16} color="#FFF" />
                      <Text style={styles.inviteText}>Invite Friends</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          )}
        </View>

        <UserProfileModal 
          visible={!!selectedUserId} 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { padding: 8, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F3F4F6' },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: 1 },
  
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#FFF', gap: 6, borderWidth: 1, borderColor: '#F3F4F6', position: 'relative' },
  activeTab: { borderColor: colors.primary, backgroundColor: '#FFFBEB' },
  tabText: { fontWeight: '600', color: colors.textSecondary, fontSize: 13 },
  activeTabText: { color: colors.primary },
  tabBadge: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },

  content: { flex: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16, backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: colors.text },
  
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 20, fontWeight: '700', color: colors.textSecondary },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  redDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  
  actionBtn: { padding: 8 },
  requestActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.7 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  inviteBtn: { marginTop: 24, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, gap: 8, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  inviteText: { color: '#FFF', fontWeight: '700' }
});