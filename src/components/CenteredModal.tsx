import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, Easing, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useApp } from '../context/AppContext';

interface CenteredModalProps {
  visible: boolean;
  onDismiss?: () => void;
  children: React.ReactNode;
}

const customModalEnter = () => {
  'worklet';
  return {
    animations: {
      opacity: withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
      transform: [{ scale: withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) }) }]
    },
    initialValues: {
      opacity: 0,
      transform: [{ scale: 0.9 }]
    }
  };
};

const customModalExit = () => {
  'worklet';
  return {
    animations: {
      opacity: withTiming(0, { duration: 150, easing: Easing.in(Easing.cubic) }),
      transform: [{ scale: withTiming(0.95, { duration: 150, easing: Easing.in(Easing.cubic) }) }]
    },
    initialValues: {
      opacity: 1,
      transform: [{ scale: 1 }]
    }
  };
};

export const CenteredModal: React.FC<CenteredModalProps> = ({ visible, onDismiss, children }) => {
  const { theme } = useApp();
  
  if (!visible) return null;

  return (
    <Animated.View style={styles.modalOverlay} entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)}>
      <Animated.View style={[styles.modalCenteredBox, { backgroundColor: theme.backgroundCard, borderColor: theme.border }]} entering={customModalEnter} exiting={customModalExit}>
        {children}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCenteredBox: {
    width: '100%',
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 15,
    overflow: 'hidden'
  },
});
