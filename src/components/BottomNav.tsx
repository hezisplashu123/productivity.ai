import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Home as HomeIcon, Brain, User } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type TabType = 'Home' | 'GoalInput' | 'Profile';

interface BottomNavProps {
  activeTab: TabType;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab }) => {
  const router = useRouter();

  const handleNav = (route: string, tab: TabType) => {
    if (activeTab === tab) return;
    
    Haptics.selectionAsync();
    
    if (route === '/home') {
      // If we are deep in the stack, we want to pop back to root (Home)
      if (router.canGoBack()) {
        router.dismissAll(); // This pops to the very first screen (Home)
      } else {
        router.replace('/home');
      }
    } else {
      // Push new screen onto stack (slides in from right)
      // @ts-ignore
      router.push(route);
    }
  };

  return (
    <View style={styles.navContainer}>
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

        {/* CENTER BUTTON - Goal Input */}
        <TouchableOpacity 
          style={styles.pillCenter} 
          onPress={() => handleNav('/goal-input', 'GoalInput')}
          activeOpacity={0.9}
        >
          <Brain size={24} color="#FFFFFF" />
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
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    zIndex: 100,
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
  pillCenter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});