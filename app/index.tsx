import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Flame, ArrowRight } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useApp } from '../src/context/AppContext';
import { storage } from '../src/utils/storage';
import { colors } from '../src/constants/colors';
import { typography } from '../src/constants/typography';

const { width } = Dimensions.get('window');

export default function IndexScreen() {
  const router = useRouter();
  const { theme, isLoading } = useApp();
  
  // Fallback to default colors if context is still mounting
  const activeTheme = theme || colors;
  const styles = getStyles(activeTheme);

  useEffect(() => {
    // Keep empty or add initialization logic if needed
  }, []);

  if (isLoading) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.logoWrapper}>
          <View style={styles.iconCircle}>
            <Flame size={56} color={activeTheme.background} fill={activeTheme.background} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.textWrapper}>
          <Text style={styles.title}>Hezi</Text>
          <Text style={styles.subtitle}>Deep conversations.{'\n'}Zero small talk.</Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeIn.delay(600).duration(800)} style={styles.footer}>
        <TouchableOpacity 
          style={styles.button} 
          activeOpacity={0.85}
          onPress={() => router.replace('/onboarding')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <ArrowRight size={20} color={activeTheme.background} strokeWidth={3} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrapper: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  textWrapper: {
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.heading,
    fontSize: 48,
    color: theme.text,
    letterSpacing: 2,
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: 20,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    width: '100%',
  },
  button: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    borderRadius: 32,
    gap: 12,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    fontFamily: typography.bodyBold,
    color: theme.background,
    fontSize: 20,
    letterSpacing: 0.5,
  },
});