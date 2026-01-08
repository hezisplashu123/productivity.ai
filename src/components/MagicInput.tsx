import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Send } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { lightColors as colors } from '../constants/colors';

interface MagicInputProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
}

export const MagicInput: React.FC<MagicInputProps> = ({
  onSubmit,
  placeholder = 'Enter a goal...',
}) => {
  const [text, setText] = useState('');
  const scale = useSharedValue(1);

  const handleSubmit = () => {
    if (text.trim() && onSubmit) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSubmit(text.trim());
        setText('');
        
        // Button animation
        scale.value = withSpring(0.9, { damping: 15 }, () => {
          scale.value = withSpring(1, { damping: 15 });
        });
      } catch (error) {
        console.error('Error submitting goal:', error);
      }
    }
  };

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />
      <Animated.View style={buttonStyle}>
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSubmit}
          disabled={!text.trim()}
          activeOpacity={0.7}
        >
          <Send size={20} color={text.trim() ? '#FFFFFF' : colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    padding: 0,
    ...Platform.select({
      ios: {
        paddingVertical: 4,
      },
    }),
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});

