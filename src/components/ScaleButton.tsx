import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ScaleButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  hapticFeedback?: boolean;
  hapticType?: 'selection' | 'impact' | 'notification';
  springConfig?: {
    damping?: number;
    stiffness?: number;
  };
}

export const ScaleButton: React.FC<ScaleButtonProps> = ({
  onPress,
  children,
  style,
  textStyle,
  disabled = false,
  hapticFeedback = true,
  hapticType = 'selection',
  springConfig = { damping: 15, stiffness: 300 },
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95, springConfig);
      if (hapticFeedback) {
        Haptics.selectionAsync();
      }
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const handlePress = () => {
    if (!disabled) {
      if (hapticFeedback) {
        switch (hapticType) {
          case 'impact':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'notification':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          default:
            Haptics.selectionAsync();
        }
      }
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  return (
    <AnimatedTouchable
      style={[style, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      {typeof children === 'string' ? (
        <Text style={textStyle}>{children}</Text>
      ) : (
        children
      )}
    </AnimatedTouchable>
  );
};

