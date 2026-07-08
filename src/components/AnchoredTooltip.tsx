import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { Easing, withTiming } from 'react-native-reanimated';
import { useApp } from '../context/AppContext';
import { typography } from '../constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnchoredTooltipProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  description: string;
  anchor: { x: number, y: number, width: number, height: number } | null;
}

const tooltipEnter = () => {
  'worklet';
  return {
    animations: {
      opacity: withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
      transform: [
        { translateY: withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) }) },
        { scale: withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) }) }
      ]
    },
    initialValues: {
      opacity: 0,
      transform: [{ translateY: -10 }, { scale: 0.95 }]
    }
  };
};

const tooltipExit = () => {
  'worklet';
  return {
    animations: {
      opacity: withTiming(0, { duration: 150, easing: Easing.in(Easing.cubic) }),
      transform: [
        { scale: withTiming(0.97, { duration: 150, easing: Easing.in(Easing.cubic) }) }
      ]
    },
    initialValues: {
      opacity: 1,
      transform: [{ scale: 1 }]
    }
  };
};

export const AnchoredTooltip: React.FC<AnchoredTooltipProps> = ({ visible, onDismiss, title, description, anchor }) => {
  const { theme } = useApp();
  
  if (!visible || !anchor) return null;

  // anchor.x and anchor.y are relative to the window
  const tooltipWidth = 260;
  const marginEdge = 16;
  
  // Try to center the tooltip horizontally on the anchor, but don't overflow the screen edges
  const anchorCenterX = anchor.x + (anchor.width / 2);
  
  let left = anchorCenterX - (tooltipWidth / 2);
  if (left < marginEdge) left = marginEdge;
  if (left + tooltipWidth > SCREEN_WIDTH - marginEdge) left = SCREEN_WIDTH - marginEdge - tooltipWidth;

  const top = anchor.y + anchor.height + 12;
  
  // The caret should point exactly at anchorCenterX
  // The caret's left position relative to the tooltip container:
  const caretLeft = anchorCenterX - left - 8; // 8 is half the caret width

  return (
    <>
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onDismiss} 
        style={[StyleSheet.absoluteFillObject, { zIndex: 99 }]}
      />
      <Animated.View 
        style={[styles.container, { top, left, backgroundColor: theme.backgroundCard, borderColor: theme.border }]} 
        entering={tooltipEnter} 
        exiting={tooltipExit}
      >
        <View style={[styles.caret, { borderBottomColor: theme.border, left: caretLeft, right: undefined }]} />
        <View style={[styles.caretInner, { borderBottomColor: theme.backgroundCard, left: caretLeft, right: undefined }]} />
        
        {title && <Text style={[styles.title, { color: theme.text }]}>{title}</Text>}
        <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
        
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={onDismiss} activeOpacity={0.8}>
          <Text style={[styles.buttonText, { color: theme.background }]}>Got it</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
    width: 260,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  caret: {
    position: 'absolute',
    top: -9,
    right: 48,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  caretInner: {
    position: 'absolute',
    top: -7,
    right: 48,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 2,
  },
  title: {
    fontFamily: typography.heading,
    fontSize: 18,
    marginBottom: 6,
  },
  description: {
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: typography.bodyBold,
    fontSize: 14,
  }
});
