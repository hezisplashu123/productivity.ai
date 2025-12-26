import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Brain, CheckCircle, TrendingUp, Sparkles } from 'lucide-react-native';
import { lightColors as colors } from '../src/constants/colors';
import { SunBackground } from '../src/components/SunBackground';

const { width, height } = Dimensions.get('window');

const TAGLINES = [
  "Stop managing tasks. Start finishing them.\nGet a personalized plan to crush procrastination.",
  "Silence the noise. Amplify the focus.",
  "Turn 'I'll do it tomorrow' into 'Done'.",
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  const taglineOpacity = useSharedValue(1);
  const taglineTranslateY = useSharedValue(0);
  
  // Animation values
  const pulseScale = useSharedValue(1);
  const card1Y = useSharedValue(0);
  const card2Y = useSharedValue(0);
  const card1Rotation = useSharedValue(0);
  const card2Rotation = useSharedValue(0);

  useEffect(() => {
    // Pulse animation for central icon
    pulseScale.value = withRepeat(
      withTiming(1.1, { duration: 2000 }),
      -1,
      true
    );

    // Floating animations for cards
    card1Y.value = withRepeat(
      withSpring(-8, { damping: 15, stiffness: 100 }),
      -1,
      true
    );
    card2Y.value = withRepeat(
      withSpring(8, { damping: 15, stiffness: 100 }),
      -1,
      true
    );

    // Subtle rotation
    card1Rotation.value = withRepeat(
      withTiming(3, { duration: 3000 }),
      -1,
      true
    );
    card2Rotation.value = withRepeat(
      withTiming(-3, { duration: 3000 }),
      -1,
      true
    );
  }, []);

  // Tagline rotation animation - continuous cycle
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const cycleTagline = () => {
      // Fade out current and move up
      taglineOpacity.value = withTiming(0, { duration: 500 });
      taglineTranslateY.value = withTiming(-20, { duration: 500 }, () => {
        // Change tagline while invisible
        runOnJS(setCurrentTaglineIndex)((prev) => (prev + 1) % TAGLINES.length);
        // Reset position below (for fade in from bottom)
        taglineTranslateY.value = 20;
        // Fade in new tagline and move to center
        taglineOpacity.value = withTiming(1, { duration: 500 });
        taglineTranslateY.value = withTiming(0, { duration: 500 });
      });
    };

    // Start cycling after initial 3 seconds, then repeat every 3 seconds
    const timeout = setTimeout(() => {
      cycleTagline();
      intervalId = setInterval(cycleTagline, 3000);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const card1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: card1Y.value },
      { rotate: `${card1Rotation.value}deg` },
    ],
  }));

  const card2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: card2Y.value },
      { rotate: `${card2Rotation.value}deg` },
    ],
  }));

  const rippleStyle1 = useAnimatedStyle(() => {
    const scale = interpolate(pulseScale.value, [1, 1.1], [1, 1.3]);
    const opacity = interpolate(pulseScale.value, [1, 1.1], [0.3, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const rippleStyle2 = useAnimatedStyle(() => {
    const scale = interpolate(pulseScale.value, [1, 1.1], [1, 1.5]);
    const opacity = interpolate(pulseScale.value, [1, 1.1], [0.2, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const handleGetStarted = () => {
    router.replace('/ghost-hours');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundLight }]}>
      <StatusBar style="dark" />
      
      {/* Hero Section - 50-60% of screen */}
      <View style={styles.heroSection}>
        {/* Floating Cards */}
        <Animated.View style={[styles.floatingCard, styles.card1, card1Style]}>
          <View style={[styles.cardContent, { backgroundColor: colors.backgroundCard }]}>
            <View style={[styles.waveIcon, { backgroundColor: colors.primary }]}>
              <TrendingUp size={16} color={colors.background} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Schedule Optimized</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.floatingCard, styles.card2, card2Style]}>
          <View style={[styles.cardContent, { backgroundColor: colors.backgroundCard }]}>
            <View style={[styles.checkIcon, { backgroundColor: colors.success }]}>
              <CheckCircle size={16} color={colors.background} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Task Complete</Text>
          </View>
        </Animated.View>

        {/* Central Icon with Ripple Effect */}
        <View style={styles.iconContainer}>
          {/* Ripple rings */}
          <Animated.View style={[styles.ripple, styles.ripple1, rippleStyle1]} />
          <Animated.View style={[styles.ripple, styles.ripple2, rippleStyle2]} />
          
          {/* Central Brain Icon */}
          <Animated.View style={[styles.centralIcon, pulseStyle]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
              <Brain size={48} color={colors.background} strokeWidth={2.5} />
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Text Section */}
      <View style={styles.textSection}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 200 }}
        >
          <Text style={[styles.headline, { color: colors.text }]}>
            Your Brain, But Supercharged
          </Text>
        </MotiView>
        
        <Animated.View style={taglineStyle}>
          <Text style={[styles.subtext, { color: colors.textSecondary }]}>
            {TAGLINES[currentTaglineIndex]}
          </Text>
        </Animated.View>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <View style={[styles.dot, styles.dotInactive, { backgroundColor: colors.border }]} />
          <View style={[styles.dot, styles.dotInactive, { backgroundColor: colors.border }]} />
        </View>
      </View>

      {/* Bottom Action Section */}
      <View style={styles.actionSection}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 600 }}
        >
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>
              Get Started
            </Text>
          </TouchableOpacity>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 600, delay: 800 }}
        >
          <View style={styles.loginLink}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleGetStarted}>
              <Text style={[styles.loginLinkText, { color: colors.primary }]}>
                Log in
              </Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingTop: 40,
  },
  iconContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  ripple1: {
    borderColor: '#F59E0B',
  },
  ripple2: {
    borderColor: '#FBBF24',
  },
  centralIcon: {
    zIndex: 10,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  floatingCard: {
    position: 'absolute',
    zIndex: 5,
  },
  card1: {
    top: 60,
    right: 40,
  },
  card2: {
    bottom: 80,
    right: 60,
  },
  cardContent: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    minWidth: 170,
    maxWidth: 190,
  },
  waveIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    paddingLeft: 4,
    includeFontPadding: false,
  },
  textSection: {
    flex: 0.25,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  subtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotInactive: {
    opacity: 0.3,
  },
  actionSection: {
    flex: 0.15,
    paddingHorizontal: 32,
    paddingBottom: 40,
    justifyContent: 'flex-end',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

