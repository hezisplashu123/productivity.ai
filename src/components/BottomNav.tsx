import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Home as HomeIcon, User, Users } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type TabType = 'Home' | 'Social' | 'Profile';

interface BottomNavProps {
  activeTab: TabType;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleNav = (route: string, tab: TabType) => {
    if (activeTab === tab) return;
    Haptics.selectionAsync();
    if (route === '/home') {
      router.replace('/home');
    } else {
      router.push(route as any);
    }
  };

  return (
    <View style={[styles.navContainer, { bottom: Math.max(20, insets.bottom + 10) }]}>
      <View style={styles.pill}>
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

        <TouchableOpacity
          style={styles.pillItem}
          onPress={() => handleNav('/social', 'Social')}
          activeOpacity={0.7}
        >
          <Users
            size={22}
            color={activeTab === 'Social' ? colors.primary : '#D1D1D1'}
            strokeWidth={activeTab === 'Social' ? 2.5 : 2}
          />
        </TouchableOpacity>

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
  },
  pill: {
    width: width * 0.65,
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
    height: '100%',
  },
});
