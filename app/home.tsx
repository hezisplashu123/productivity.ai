import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Flame, Heart, Layers, MessageCircle, Sparkles, Zap, HelpCircle, Users, Home, User } from 'lucide-react-native';
import { VIBE_CATEGORIES, ConversationCategory } from '../src/constants/categories';
import { useApp } from '../src/context/AppContext';
import { DepthGauge } from '../src/components/DepthGauge';
import { useThemeCrossfade } from '../src/hooks/useThemeCrossfade';
import { apiService } from '../src/services/api';
import { storage } from '../src/utils/storage';
import { Theme } from '../src/constants/colors';
import { typography } from '../src/constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = (SCREEN_WIDTH - 48) / 3;



export default function HomeScreen() {
  const router = useRouter();
  const { user, gamemode, setGamemode, theme, playerCount } = useApp();
  const styles = getStyles(theme);

  const displayCategories = VIBE_CATEGORIES[gamemode] || VIBE_CATEGORIES.friendship;
  
  const prefetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.profileId) return;

    const prefetchCategories = async () => {
      const cacheKey = `${gamemode}-${playerCount || 3}`;
      
      if (prefetchedRef.current.has(cacheKey)) return;
      prefetchedRef.current.add(cacheKey);

      for (const cat of displayCategories) {
        try {
          const cached = await storage.getCachedQueue(gamemode, cat.id);
          if (!cached || cached.length === 0) {
            const res = await apiService.getNextPrompts(user.profileId, gamemode, cat.id, 5, playerCount || 3);
            if (res && res.prompts) {
              const aiCards = res.prompts.map((p: any) => ({
                id: p.id,
                label: p.text,
                category: p.category,
              }));
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

  const { backgroundColorStyle, animatedColor } = useThemeCrossfade(theme.primary, 300);

  const handleCategoryPress = async (cat: ConversationCategory) => {
    await storage.setActiveCategory(cat.id);
    router.push({ pathname: '/deck', params: { categoryId: cat.id } });
  };

  const getCategoryIcon = (iconStr: string) => {
    const props = { size: 22, color: theme.primary };
    switch (iconStr) {
      case '✨': return <Sparkles {...props} />;
      case '🎯': return <Zap {...props} />;
      case '🎲': return <HelpCircle {...props} />;
      case '📼': return <MessageCircle {...props} />;
      case '🔥': return <Flame {...props} />;
      case '💬': return <Users {...props} />;
      case '🌌': return <Heart {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View style={styles.headlineRow}>
          <Text style={styles.headline}>Pick a Vibe</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/onboarding', params: { phase: 2 } })} style={styles.howToPlayBtn} activeOpacity={0.8}>
            <HelpCircle size={16} color={theme.text} />
            <Text style={styles.howToPlayText}>How to play</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              router.push('/account');
            }} 
            style={styles.accountBtn} 
            activeOpacity={0.8}
          >
            <User size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.lead}>
        Tap a category below. The heat adjusts automatically as you play.
      </Text>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {displayCategories.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.cardWrapper} onPress={() => handleCategoryPress(cat)} activeOpacity={0.85}>
            <View style={[styles.card, { overflow: 'hidden' }]}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryIconWrap}>
                  <View style={[StyleSheet.absoluteFill, { borderRadius: 21, opacity: 0.15, backgroundColor: theme.primary }]} />
                  {getCategoryIcon(cat.icon)}
                </View>
                {cat.intensity && (
                  <DepthGauge tier={cat.intensity} maxTier={18} color={theme.primary} />
                )}
              </View>
              <Text style={styles.cardTitle}>{cat.title}</Text>
              <Text style={styles.cardSubtitle}>{cat.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.pillWrapper}>
        <View style={styles.pillContainer}>
          {['18-21', '22-25', '26-29', '30-39', '40-49', '50+'].includes(user?.ageRange ?? '') && (
            <TouchableOpacity onPress={() => setGamemode('relationship')} style={styles.pillOption}>
              {gamemode === 'relationship' && <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 999 }, backgroundColorStyle]} />}
              <View style={styles.pillContent}>
                <Heart size={18} color={gamemode === 'relationship' ? theme.background : theme.textMuted} />
                <Text style={[styles.pillText, gamemode === 'relationship' && styles.pillTextActive]}>Lovers</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setGamemode('friendship')} style={styles.pillOption}>
            {gamemode === 'friendship' && <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 999 }, backgroundColorStyle]} />}
            <View style={styles.pillContent}>
              <Users size={18} color={gamemode === 'friendship' ? theme.background : theme.textMuted} />
              <Text style={[styles.pillText, gamemode === 'friendship' && styles.pillTextActive]}>Friends</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGamemode('family')} style={styles.pillOption}>
            {gamemode === 'family' && <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 999 }, backgroundColorStyle]} />}
            <View style={styles.pillContent}>
              <Home size={18} color={gamemode === 'family' ? theme.background : theme.textMuted} />
              <Text style={[styles.pillText, gamemode === 'family' && styles.pillTextActive]}>Family</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  headlineRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headline: { fontFamily: typography.heading, fontSize: 28, color: theme.text, letterSpacing: 0.5 },
  howToPlayBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.backgroundElevated, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, gap: 6 },
  howToPlayText: { fontFamily: typography.bodyBold, color: theme.text, fontSize: 13 },
  accountBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.backgroundElevated, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  lead: { fontFamily: typography.body, fontSize: 16, lineHeight: 24, color: theme.textSecondary, paddingHorizontal: 24, marginBottom: 24 },
  grid: { paddingHorizontal: 20, paddingBottom: 130, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 },
  cardWrapper: { width: '47%', marginBottom: 16 },
  card: { backgroundColor: '#181820', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: theme.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 12 },
  categoryIconWrap: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  
  cardTitle: { fontFamily: typography.heading, fontSize: 18, color: theme.text, marginBottom: 4 },
  cardSubtitle: { fontFamily: typography.body, fontSize: 13, lineHeight: 18, color: theme.textSecondary },
  
  pillWrapper: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 24 },
  pillContainer: { flexDirection: 'row', backgroundColor: 'rgba(0, 0, 0, 0.65)', borderRadius: 999, padding: 6, borderWidth: 1, borderColor: theme.primary, width: '100%', justifyContent: 'space-between', shadowColor: theme.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 12 },
  pillOption: { flex: 1, paddingVertical: 14, borderRadius: 999, overflow: 'hidden' },
  pillContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 },
  pillText: { fontFamily: typography.bodyBold, color: theme.textMuted, fontSize: 14 },
  pillTextActive: { color: theme.background },
});