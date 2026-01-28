import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Home as HomeIcon, Brain, User } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  interpolate 
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type TabType = 'Home' | 'GoalInput' | 'Profile';

interface BottomNavProps {
  activeTab: TabType;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Get safe area values
  
  // Animation value: 0 to 1
  const breathing = useSharedValue(0);

  useEffect(() => {
    // Continuous breathing loop
    breathing.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1, // Infinite
      true // Reverse (0->1->0)
    );
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => {
    // Subtle scale pulsing (1.0 -> 1.1)
    const scale = interpolate(breathing.value, [0, 1], [1, 1.1]);
    
    // Glow pulsing (shadow opacity and radius)
    const shadowOpacity = interpolate(breathing.value, [0, 1], [0.3, 0.7]);
    const shadowRadius = interpolate(breathing.value, [0, 1], [8, 16]);
    
    // For Android elevation
    const elevation = interpolate(breathing.value, [0, 1], [5, 12]);

    return {
      transform: [{ scale }],
      shadowOpacity,
      shadowRadius,
      elevation,
    };
  });

  const handleNav = (route: string, tab: TabType) => {
    if (activeTab === tab) return;
    
    Haptics.selectionAsync();
    
    if (route === '/home') {
      if (router.canGoBack()) {
        router.dismissAll();
      } else {
        router.replace('/home');
      }
    } else {
      // @ts-ignore
      router.push(route);
    }
  };

  return (
    <View style={[styles.navContainer, { bottom: Math.max(20, insets.bottom + 10) }]}>
      <View style={styles.pill}>
        {/* HOME BUTTON */}
        <TouchableOpacity 
          style={styles.pillItem} 
          onPress={() => handleNav('/home', 'Home')}
          activeOpacity={0.7}
        >
          <HomeIcon 
            size={22} 
            color={activeTab === 'Home' ? colors.primary : '#D1D1D1'} 
            strokeWidth={activeTab === 'Home' ? 2.5 : 2}
          />
        </TouchableOpacity>

        {/* CENTER BUTTON - Goal Input (Breathing Brain) */}
        <TouchableOpacity 
          onPress={() => handleNav('/goal-input', 'GoalInput')}
          activeOpacity={0.9}
          style={styles.centerContainer}
        >
          <Animated.View style={[styles.pillCenter, animatedGlowStyle]}>
            <Brain size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>

        {/* PROFILE BUTTON */}
        <TouchableOpacity 
          style={styles.pillItem} 
          onPress={() => handleNav('/profile', 'Profile')}
          activeOpacity={0.7}
        >
          <User 
            size={22} 
            color={activeTab === 'Profile' ? colors.primary : '#D1D1D1'} 
            strokeWidth={activeTab === 'Profile' ? 2.5 : 2}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 100,
    // bottom value is now handled inline
  },
  pill: {
    width: width * 0.6,
    height: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  pillItem: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100%' 
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    // Ensure touch target doesn't get clipped if it scales up
    zIndex: 10,
  },
  pillCenter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary, // Orange glow
    shadowOffset: { width: 0, height: 0 }, // Center glow
    // Shadow properties handled by Animated Style
  },
});