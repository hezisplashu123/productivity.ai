import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { RefreshCw, ArrowLeft, FileText, Info } from 'lucide-react-native';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';
import { Theme } from '../src/constants/colors';
import { typography } from '../src/constants/typography';

const PRIVACY_POLICY_URL = "https://docs.google.com/document/d/e/2PACX-1vSPAtSLuOobWyjVFamz8iWoAPRAAy-_9B1CgmImqHc4xNPo4hRG5OWGfryXSFJw4_w1fWsWq8MfwOa-/pub";

export default function AccountScreen() {
  const router = useRouter();
  const { user, theme, logout } = useApp();
  const styles = getStyles(theme);

  const handleSignOut = async () => {
    Alert.alert(
      "Reset App Data",
      "This will clear all your history and generate a fresh profile. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleOpenPrivacyPolicy = async () => {
    await WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
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
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSignOut} activeOpacity={0.8}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconContainer, { backgroundColor: theme.backgroundElevated }]}>
                <RefreshCw size={20} color={theme.text} />
              </View>
              <Text style={styles.actionText}>Reset Profile Data</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Info size={16} color={theme.textSecondary} style={{ marginTop: 2 }} />
            <Text style={styles.infoText}>This resets the algorithm for question selection so be careful because this is your profile.</Text>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleOpenPrivacyPolicy} activeOpacity={0.8}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconContainer, { backgroundColor: theme.backgroundElevated }]}>
                <FileText size={20} color={theme.text} />
              </View>
              <Text style={styles.actionText}>Privacy Policy</Text>
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
  content: { padding: 24, paddingTop: 40 },
  actionSection: { gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.backgroundCard, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontFamily: typography.bodyBold, fontSize: 16, color: theme.text },
  infoBox: { flexDirection: 'row', backgroundColor: theme.backgroundElevated, padding: 16, borderRadius: 16, gap: 12, marginTop: 8 },
  infoText: { fontFamily: typography.body, fontSize: 13, color: theme.textSecondary, flex: 1, lineHeight: 18 },
});
