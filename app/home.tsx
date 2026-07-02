import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Flame, Heart, Layers, MessageCircle, Sparkles, Zap, HelpCircle, Users, Home } from 'lucide-react-native';
import { VIBE_CATEGORIES, ConversationCategory } from '../src/constants/categories';
import { useApp } from '../src/context/AppContext';
import { apiService } from '../src/services/api';
import { storage } from '../src/utils/storage';
import { Theme } from '../src/constants/colors';
import { typography } from '../src/constants/typography';

export default function HomeScreen() {
  const router = useRouter();
  const { user, gamemode, setGamemode, theme, playerCount } = useApp();
  const styles = getStyles(theme);

  const displayCategories = VIBE_CATEGORIES[gamemode] || VIBE_CATEGORIES.friendship;
  
  // Track what we've prefetched so we don't spam the backend on re-renders
  const prefetchedRef = useRef<Set<string>>(new Set());

  // PREFETCH LOGIC: Silently load the first 5 cards for each category as soon as the home screen loads
  useEffect(() => {
    if (!user?.profileId) return;

    const prefetchCategories = async () => {
      const cacheKey = `${gamemode}-${playerCount || 3}`;
      
      // If we already prefetched this setup during this session, skip
      if (prefetchedRef.current.has(cacheKey)) return;
      prefetchedRef.current.add(cacheKey);

      // Fetch sequentially to avoid hammering the backend
      for (const cat of displayCategories) {
        try {
          const cached = await storage.getCachedQueue(gamemode, cat.id);
          // Only fetch if the queue is empty
          if (!cached || cached.length === 0) {
            const res = await apiService.getNextPrompts(user.profileId, gamemode, cat.id, 5, playerCount || 3);
            if (res && res.prompts) {
              const aiCards = res.prompts.map((p: any) => ({
                id: p.id,
                label: p.text,
                category: p.category,
              }));
              // Silently save to cache so it's ready instantly when tapped
              await storage.saveCachedQueue(gamemode, cat.id, aiCards);
            }
          }
        } catch (e) {
          console.log(`Background prefetch failed for ${cat.id}`);
        }
      }
    };

    prefetchCategories();
  }, [user?.profileId, gamemode, playerCount, displayCategories]);

  const handleCategoryPress = async (cat: ConversationCategory) => {
    await storage.setActiveCategory(cat.id);
    
    // We intentionally DO NOT clear the cache here anymore, so the deck loads 
    // instantly using the prefetched cards from the background!
    router.push({ pathname: '/deck', params: { categoryId: cat.id } });
  };

  const getCategoryIcon = (iconName: string) => {
    const iconProps = { size: 24, color: theme.primary };
    switch (iconName) {
      case '🌌': return <Layers {...iconProps} />;
      case '✨': return <Sparkles {...iconProps} />;
      case '🎲': return <Zap {...iconProps} />;
      case '💬': return <MessageCircle {...iconProps} />;
      case '📼': return <Heart {...iconProps} />;
      case '🎯': return <Users {...iconProps} />;
      default: return <Flame {...iconProps} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View style={styles.headlineRow}>
          <Text style={styles.headline}>Pick a Vibe</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/onboarding')} style={styles.howToPlayBtn} activeOpacity={0.8}>
          <HelpCircle size={16} color={theme.text} />
          <Text style={styles.howToPlayText}>How to play</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.lead}>
        Tap a category below. The AI adjusts the heat as you play.
      </Text>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {displayCategories.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.card} onPress={() => handleCategoryPress(cat)} activeOpacity={0.85}>
            <View style={styles.categoryIconWrap}>{getCategoryIcon(cat.icon)}</View>
            <Text style={styles.cardTitle}>{cat.title}</Text>
            <Text style={styles.cardSubtitle}>{cat.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* GAMEMODE PILL */}
      <View style={styles.pillWrapper}>
        <View style={styles.pillContainer}>
          <TouchableOpacity onPress={() => setGamemode('relationship')} style={[styles.pillOption, gamemode === 'relationship' && styles.pillActive]}>
            <Heart size={18} color={gamemode === 'relationship' ? theme.primary : theme.textMuted} />
            <Text style={[styles.pillText, gamemode !== 'relationship' && { color: theme.textMuted, fontWeight: '600' }]}>Lovers</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGamemode('friendship')} style={[styles.pillOption, gamemode === 'friendship' && styles.pillActive]}>
            <Users size={18} color={gamemode === 'friendship' ? theme.primary : theme.textMuted} />
            <Text style={[styles.pillText, gamemode !== 'friendship' && { color: theme.textMuted, fontWeight: '600' }]}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGamemode('family')} style={[styles.pillOption, gamemode === 'family' && styles.pillActive]}>
            <Home size={18} color={gamemode === 'family' ? theme.primary : theme.textMuted} />
            <Text style={[styles.pillText, gamemode !== 'family' && { color: theme.textMuted, fontWeight: '600' }]}>Family</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  headlineRow: { flexDirection: 'row', alignItems: 'center' },
  headline: { fontFamily: typography.heading, fontSize: 32, color: theme.text, letterSpacing: 0.5 },
  howToPlayBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.backgroundElevated, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, gap: 6 },
  howToPlayText: { fontFamily: typography.bodyBold, color: theme.text, fontSize: 13 },
  lead: { fontFamily: typography.body, fontSize: 16, lineHeight: 24, color: theme.textSecondary, paddingHorizontal: 24, marginBottom: 24 },
  grid: { paddingHorizontal: 20, paddingBottom: 130, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 },
  card: { width: '47%', backgroundColor: theme.backgroundCard, borderRadius: 24, padding: 20, minHeight: 160 },
  categoryIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.backgroundElevated, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontFamily: typography.heading, fontSize: 18, color: theme.text, marginBottom: 6 },
  cardSubtitle: { fontFamily: typography.body, fontSize: 13, lineHeight: 18, color: theme.textSecondary },
  
  pillWrapper: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 24 },
  pillContainer: { flexDirection: 'row', backgroundColor: 'rgba(0, 0, 0, 0.65)', borderRadius: 999, padding: 6, borderWidth: 1, borderColor: theme.border, width: '100%', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  pillOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 14, borderRadius: 999, gap: 6 },
  pillActive: { backgroundColor: theme.backgroundCardHover },
  pillText: { fontFamily: typography.bodyBold, color: theme.primary, fontSize: 14 },
});