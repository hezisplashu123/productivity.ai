import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Flame, Heart, Layers, MessageCircle, Sparkles, Zap, HelpCircle } from 'lucide-react-native';
import { colors } from '../src/constants/colors';
import { CONVERSATION_CATEGORIES } from '../src/constants/categories';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';
import { storage } from '../src/utils/storage';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useApp();

  const startCategory = async (categoryId: string, seedWeights: Record<string, number>) => {
    await storage.setActiveCategory(categoryId);
    router.push({ pathname: '/deck', params: { categoryId } });

    if (!user?.profileId) return;

    apiService.resetProfileWeights(user.profileId, seedWeights).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headlineRow}>
          <Text style={styles.headline}>Pick a vibe</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => router.push('/onboarding')} 
            style={styles.howToPlayBtn}
            activeOpacity={0.8}
          >
            <HelpCircle size={16} color={colors.text} />
            <Text style={styles.howToPlayText}>How to play</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.lead}>
        Every category is open—no locks, no coins. Tap one and pass the phone.
      </Text>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {CONVERSATION_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.card}
            onPress={() => startCategory(cat.id, cat.seedWeights)}
            activeOpacity={0.85}
          >
            <View style={styles.categoryIconWrap}>{getCategoryIcon(cat.id)}</View>
            <Text style={styles.cardTitle}>{cat.title}</Text>
            <Text style={styles.cardSubtitle}>{cat.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function getCategoryIcon(categoryId: string) {
  const iconProps = { size: 24, color: colors.primary };
  switch (categoryId) {
    case 'deep-talk':
      return <Layers {...iconProps} />;
    case 'icebreakers':
      return <Sparkles {...iconProps} />;
    case 'what-ifs':
      return <Zap {...iconProps} />;
    case 'relationships':
      return <MessageCircle {...iconProps} />;
    case 'nostalgia':
      return <Heart {...iconProps} />;
    default:
      return <Flame {...iconProps} />;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headlineRow: { flexDirection: 'row', alignItems: 'center' },
  headline: { fontSize: 32, fontWeight: '800', color: colors.text },
  howToPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  howToPlayText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  grid: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  card: {
    width: '47%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 160,
  },
  categoryIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 6 },
  cardSubtitle: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});