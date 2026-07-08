import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { User, LogOut, Trash2, ArrowLeft } from 'lucide-react-native';
import { useApp } from '../src/context/AppContext';
import { Theme } from '../src/constants/colors';
import { typography } from '../src/constants/typography';

export default function AccountScreen() {
  const router = useRouter();
  const { user, theme, logout } = useApp();
  const styles = getStyles(theme);

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    router.push('/auth?mode=delete_reauth');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton} activeOpacity={0.7}>
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <User size={40} color={theme.primary} />
          </View>
          <Text style={styles.name}>{user?.name || 'Player'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSignOut} activeOpacity={0.8}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconContainer, { backgroundColor: theme.backgroundElevated }]}>
                <LogOut size={20} color={theme.text} />
              </View>
              <Text style={styles.actionText}>Sign Out</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleDeleteAccount} activeOpacity={0.8}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#FEF2F2' }]}>
                <Trash2 size={20} color={theme.error} />
              </View>
              <Text style={[styles.actionText, { color: theme.error }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  iconButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.backgroundElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  headerTitle: { fontFamily: typography.heading, fontSize: 20, color: theme.text },
  content: { padding: 24 },
  profileSection: { alignItems: 'center', marginBottom: 48, marginTop: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: theme.backgroundElevated, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: theme.border },
  name: { fontFamily: typography.heading, fontSize: 28, color: theme.text, marginBottom: 4 },
  email: { fontFamily: typography.body, fontSize: 16, color: theme.textSecondary },
  actionSection: { gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.backgroundCard, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontFamily: typography.bodyBold, fontSize: 16, color: theme.text },
});
