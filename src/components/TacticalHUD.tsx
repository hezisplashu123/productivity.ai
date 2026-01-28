import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { Zap, X, ChevronRight, AlertTriangle, Target } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface TacticalHUDProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'warning' | 'info' | 'success';
  onPress: () => void;
  onClose: () => void;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({ 
  visible, title, message, type = 'info', onPress, onClose 
}) => {
  const insets = useSafeAreaInsets();
  
  // Start hidden ABOVE the screen
  const translateY = useSharedValue(-200);

  useEffect(() => {
    if (visible) {
      // Slide down to visible position (safe area + padding)
      const targetY = insets.top + 10;
      translateY.value = withSpring(targetY, { damping: 12, stiffness: 90 });
      
      // Auto-dismiss after 6 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      // Slide back up
      translateY.value = withTiming(-200, { duration: 300 });
    }
  }, [visible]);

  const handleClose = () => {
    translateY.value = withTiming(-200, { duration: 300 }, (finished) => {
      if (finished && onClose) {
        runOnJS(onClose)();
      }
    });
  };

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  const getTheme = () => {
    switch (type) {
      case 'warning': return { 
        bg: '#FFF1F2', border: '#FECDD3', iconColor: '#E11D48', Icon: AlertTriangle 
      };
      case 'success': return { 
        bg: '#F0FDF4', border: '#BBF7D0', iconColor: '#16A34A', Icon: Target 
      };
      default: return { 
        bg: '#F0F9FF', border: '#BAE6FD', iconColor: colors.primary, Icon: Zap 
      };
    }
  };

  const { bg, border, iconColor, Icon } = getTheme();

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: bg, borderColor: border }]} 
        onPress={handlePress}
        activeOpacity={0.95}
      >
        <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>
          <Icon size={18} color={iconColor} fill={type === 'success' ? iconColor : 'transparent'} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: iconColor }]}>{title}</Text>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
        </View>
        
        <View style={styles.actionArrow}>
            <ChevronRight size={20} color={iconColor} style={{ opacity: 0.5 }} />
        </View>

        <TouchableOpacity 
          style={styles.closeBtn} 
          onPress={handleClose} 
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <X size={14} color="#94A3B8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, // Position controlled by animated translateY
    left: 16,
    right: 16,
    zIndex: 9999, // High z-index to hover over everything
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
  },
  actionArrow: {
    justifyContent: 'center',
    paddingRight: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
  }
});