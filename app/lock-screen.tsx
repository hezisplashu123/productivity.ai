import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  withSpring 
} from 'react-native-reanimated';
import { Lock, Delete } from 'lucide-react-native';
import { lightColors as colors } from '../src/constants/colors';

const { width } = Dimensions.get('window');
const PIN_LENGTH = 4;
const CORRECT_PIN = "5858";

export default function LockScreen() {
  const router = useRouter();
  const [pin, setPin] = useState<string[]>([]);
  const [error, setError] = useState(false);
  
  // Animation values
  const shake = useSharedValue(0);
  const iconScale = useSharedValue(1);

  const handlePress = (num: string) => {
    if (pin.length >= PIN_LENGTH) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPin = [...pin, num];
    setPin(newPin);

    // Check PIN when length is reached
    if (newPin.length === PIN_LENGTH) {
      const pinString = newPin.join('');
      if (pinString === CORRECT_PIN) {
        handleSuccess();
      } else {
        handleError();
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin(pin.slice(0, -1));
      setError(false);
    }
  };

  const handleSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    iconScale.value = withSequence(withTiming(1.2, { duration: 100 }), withTiming(1));
    
    // Slight delay for visual feedback before navigation
    setTimeout(() => {
      // Navigate to the original entry point (Welcome)
      router.replace('/welcome');
    }, 200);
  };

  const handleError = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setError(true);
    
    // Shake Animation
    shake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );

    // Clear PIN after delay
    setTimeout(() => {
      setPin([]);
      setError(false);
    }, 500);
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }]
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }]
  }));

  const renderDot = (index: number) => {
    const isFilled = index < pin.length;
    return (
      <View 
        key={index} 
        style={[
          styles.dot, 
          isFilled && styles.dotFilled,
          error && isFilled && styles.dotError
        ]} 
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        {/* Header Icon */}
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <Lock size={40} color={error ? colors.error : colors.primary} />
        </Animated.View>
        
        <Text style={styles.title}>Dev Access</Text>
        <Text style={styles.subtitle}>Enter Passcode</Text>

        {/* PIN Dots */}
        <Animated.View style={[styles.dotsContainer, shakeStyle]}>
          {[...Array(PIN_LENGTH)].map((_, i) => renderDot(i))}
        </Animated.View>
      </View>

      {/* Number Pad */}
      <View style={styles.numpad}>
        <View style={styles.row}>
          <NumberButton number="1" onPress={handlePress} />
          <NumberButton number="2" onPress={handlePress} />
          <NumberButton number="3" onPress={handlePress} />
        </View>
        <View style={styles.row}>
          <NumberButton number="4" onPress={handlePress} />
          <NumberButton number="5" onPress={handlePress} />
          <NumberButton number="6" onPress={handlePress} />
        </View>
        <View style={styles.row}>
          <NumberButton number="7" onPress={handlePress} />
          <NumberButton number="8" onPress={handlePress} />
          <NumberButton number="9" onPress={handlePress} />
        </View>
        <View style={styles.row}>
          <View style={styles.buttonPlaceholder} />
          <NumberButton number="0" onPress={handlePress} />
          <TouchableOpacity style={styles.button} onPress={handleDelete}>
            <Delete size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const NumberButton = ({ number, onPress }: { number: string, onPress: (n: string) => void }) => (
  <TouchableOpacity 
    style={styles.button} 
    onPress={() => onPress(number)}
    activeOpacity={0.7}
  >
    <Text style={styles.number}>{number}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 20,
    height: 20,
    alignItems: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textLight,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  dotError: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  numpad: {
    paddingHorizontal: 40,
    paddingBottom: 40,
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPlaceholder: {
    width: 75,
    height: 75,
  },
  number: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
  },
});