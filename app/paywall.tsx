import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeIn,
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence 
} from 'react-native-reanimated';
import { ShieldCheck, Zap, Check } from 'lucide-react-native';
import { lightColors as colors } from '../src/constants/colors';
import * as Haptics from 'expo-haptics';
import { useApp } from '../src/context/AppContext';

const MONTHLY_PRODUCT_ID = 'hb_pro_monthly';
const YEARLY_PRODUCT_ID = 'hb_pro_yearly';

const BENEFITS = [
  { text: "Save 7+ hours every week" },
  { text: "Scientifically proven focus methods" },
  { text: "Advanced AI Task Breakdown" },
  { text: "Unlimited Projects & Journeys" },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { purchasePackage, restorePurchases, packages, isPro } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Pulse animation for the badge
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 800 }), 
        withTiming(1, { duration: 800 })
      ), 
      -1, 
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }]
  }));

  const handlePurchase = async () => {
    setIsPurchasing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      let packageToBuy;
      
      // 1. Attempt to find the correct package from RevenueCat
      if (packages.length > 0) {
        packageToBuy = packages.find(
          (p) => p.product.identifier === (selectedPlan === 'yearly' ? YEARLY_PRODUCT_ID : MONTHLY_PRODUCT_ID)
        );
      }

      // 2. Execute Purchase (Production Logic)
      if (packageToBuy) {
        await purchasePackage(packageToBuy);
      } else {
        // If packages are empty, it means RevenueCat failed to load products from Apple/Google.
        // This usually means the device isn't signed into the App Store Sandbox, 
        // or the keys/products aren't configured correctly in RevenueCat dashboard.
        Alert.alert(
          "Connection Error", 
          "Could not load subscription details from the App Store. Please check your internet connection or try again later."
        );
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert("Purchase Failed", e.message);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    await restorePurchases();
    setIsPurchasing(false);
  };

  // Redirect home automatically if they become Pro
  useEffect(() => {
    if (isPro) {
      router.replace('/home');
    }
  }, [isPro]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Graphic - Subtle Watermark */}
      <View style={styles.backgroundGraphic}>
        <Zap size={300} color={colors.primary} opacity={0.08} />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* Nav Bar - No X button, only Restore */}
        <View style={styles.navBar}>
          <View style={{ width: 60 }} />
          <TouchableOpacity onPress={handleRestore}>
            <Text style={styles.restoreText}>Restore</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Header Animation */}
          <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.headerContainer}>
            <View style={styles.iconCircle}>
                <Zap size={32} color="#FFF" fill={colors.primary} />
            </View>
            <Text style={styles.title}>Unlock Full Access</Text>
            <Text style={styles.subtitle}>Supercharge your productivity with AI-driven focus tools.</Text>
          </Animated.View>

          {/* Benefits List */}
          <View style={styles.benefitsContainer}>
            {BENEFITS.map((benefit, index) => (
              <Animated.View 
                key={index} 
                entering={FadeInDown.delay(400 + (index * 100)).springify()} 
                style={styles.benefitRow}
              >
                <Check size={20} color={colors.primary} strokeWidth={3} />
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </Animated.View>
            ))}
          </View>

          {/* Plans */}
          <Animated.View entering={FadeIn.delay(600).duration(500)} style={styles.plansContainer}>
            
            {/* YEARLY PLAN CARD */}
            <TouchableOpacity 
              style={[styles.planCard, selectedPlan === 'yearly' && styles.selectedPlanCard]}
              onPress={() => { Haptics.selectionAsync(); setSelectedPlan('yearly'); }}
              activeOpacity={0.9}
            >
              <Animated.View style={[styles.badge, pulseStyle]}>
                <Text style={styles.badgeText}>BEST VALUE</Text>
              </Animated.View>
              
              <View style={styles.planContent}>
                <View style={styles.planHeader}>
                    <Text style={styles.planName}>Yearly</Text>
                    <View style={[styles.radio, selectedPlan === 'yearly' && styles.radioSelected]}>
                        {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
                    </View>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>$2.99</Text>
                    <Text style={styles.planPeriod}>/ mo</Text>
                </View>
                <Text style={styles.planBilled}>Billed $35.99 yearly</Text>
                <Text style={styles.trialLabel}>3 DAYS FREE</Text>
              </View>
            </TouchableOpacity>

            {/* MONTHLY PLAN CARD */}
            <TouchableOpacity 
              style={[styles.planCard, selectedPlan === 'monthly' && styles.selectedPlanCard]}
              onPress={() => { Haptics.selectionAsync(); setSelectedPlan('monthly'); }}
              activeOpacity={0.9}
            >
              <View style={styles.planContent}>
                <View style={styles.planHeader}>
                    <Text style={styles.planName}>Monthly</Text>
                    <View style={[styles.radio, selectedPlan === 'monthly' && styles.radioSelected]}>
                        {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
                    </View>
                </View>
                <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>$3.99</Text>
                    <Text style={styles.planPeriod}>/ mo</Text>
                </View>
                <Text style={styles.planBilled}>Billed monthly</Text>
                <Text style={styles.trialLabel}>3 DAYS FREE</Text>
              </View>
            </TouchableOpacity>

          </Animated.View>

          <View style={styles.guaranteeContainer}>
            <ShieldCheck size={14} color="#94A3B8" />
            <Text style={styles.guaranteeText}>No commitment. Cancel anytime.</Text>
          </View>
        </ScrollView>

        {/* Sticky Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.ctaButton} 
            onPress={handlePurchase}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.ctaText}>
                Start 3-Day Free Trial
              </Text>
            )}
          </TouchableOpacity>
          <Text style={styles.footerTerms}>
            Subscription automatically renews.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' }, // True black
  backgroundGraphic: { position: 'absolute', top: -50, right: -50, zIndex: 0 },
  
  navBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, zIndex: 10 },
  restoreText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  
  content: { paddingHorizontal: 24, paddingBottom: 120 },
  
  headerContainer: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(245, 158, 11, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: colors.primary },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#94A3B8', textAlign: 'center', lineHeight: 24, maxWidth: 300 },

  benefitsContainer: { marginBottom: 40, gap: 16 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitText: { fontSize: 16, color: '#E2E8F0', fontWeight: '500' },

  plansContainer: { gap: 16 },
  planCard: { 
    backgroundColor: '#121212', 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#333',
    position: 'relative' 
  },
  selectedPlanCard: { 
    backgroundColor: 'rgba(245, 158, 11, 0.1)', 
    borderColor: colors.primary 
  },
  
  badge: { 
    position: 'absolute', 
    top: -12, 
    right: 20, 
    backgroundColor: colors.primary, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#000' },

  planContent: { gap: 4 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#555', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  planPrice: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  planPeriod: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  
  planBilled: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  trialLabel: { fontSize: 12, fontWeight: '800', color: colors.primary, marginTop: 4 },

  guaranteeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  guaranteeText: { color: '#94A3B8', fontSize: 12 },

  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 24, 
    backgroundColor: '#050505',
    borderTopWidth: 1,
    borderTopColor: '#222'
  },
  ctaButton: { 
    backgroundColor: colors.primary, 
    width: '100%', 
    height: 56, 
    borderRadius: 28, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8
  },
  ctaText: { color: '#000000', fontSize: 18, fontWeight: '800' },
  footerTerms: { fontSize: 11, color: '#555', textAlign: 'center' },
});