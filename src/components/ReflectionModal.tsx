import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MotiView } from 'moti';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { X, Smile, Meh, Frown } from 'lucide-react-native';
import { lightColors as colors } from '../constants/colors';

interface ReflectionModalProps {
  visible: boolean;
  taskTitle: string;
  onRate: (rating: number) => void;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

const emojiConfig = [
  { emoji: '😢', label: 'Very Low', value: 1, color: '#EF4444' },
  { emoji: '😕', label: 'Low', value: 2, color: '#F59E0B' },
  { emoji: '😐', label: 'Neutral', value: 3, color: '#FBBF24' },
  { emoji: '🙂', label: 'Good', value: 4, color: '#F59E0B' },
  { emoji: '😊', label: 'Excellent', value: 5, color: '#FBBF24' },
];

export const ReflectionModal: React.FC<ReflectionModalProps> = ({
  visible,
  taskTitle,
  onRate,
  onClose,
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const scale = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
      setSelectedRating(null);
      setShowConfetti(false);
    } else {
      scale.value = withSpring(0, { damping: 15, stiffness: 100 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleRating = (rating: number) => {
    setSelectedRating(rating);
    if (rating >= 4) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const handleSubmit = () => {
    if (selectedRating) {
      onRate(selectedRating);
      onClose();
    }
  };

  const getEncouragement = (rating: number) => {
    if (rating >= 4) {
      return "🎉 Amazing! You're building great momentum!";
    } else if (rating === 3) {
      return "💪 Keep going! Every step counts.";
    } else {
      return "🌟 Progress isn't always linear. You're doing great!";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        {showConfetti && (
          <ConfettiCannon
            count={200}
            origin={{ x: width / 2, y: 0 }}
            fadeOut
          />
        )}
        <Animated.View style={[
          styles.container, 
          animatedStyle,
          {
            backgroundColor: colors.backgroundCard,
            borderColor: colors.border,
            shadowColor: colors.primary,
          }
        ]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.content}>
            <MotiView
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300 }}
            >
              <Text style={[styles.title, { color: colors.text }]}>How productive did you feel?</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Task: {taskTitle}</Text>
            </MotiView>

            <View style={styles.emojiContainer}>
              {emojiConfig.map((item, index) => (
                <MotiView
                  key={item.value}
                  from={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: 1,
                    scale: selectedRating === item.value ? 1.1 : 1,
                  }}
                  transition={{
                    type: 'timing',
                    duration: 200,
                    delay: index * 50,
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.emojiButton,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.backgroundLight,
                      },
                      selectedRating === item.value && [
                        styles.emojiButtonSelected,
                        { 
                          borderColor: item.color,
                          backgroundColor: colors.glow,
                        },
                      ],
                    ]}
                    onPress={() => handleRating(item.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emoji}>{item.emoji}</Text>
                    <Text
                      style={[
                        styles.emojiLabel,
                        { color: colors.textSecondary },
                        selectedRating === item.value && { color: item.color },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                </MotiView>
              ))}
            </View>

            {selectedRating && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 300 }}
              >
                <View style={[
                  styles.feedbackContainer,
                  {
                    backgroundColor: colors.backgroundLight,
                    borderColor: colors.border,
                  }
                ]}>
                  <Text style={[styles.feedbackText, { color: colors.text }]}>
                    {getEncouragement(selectedRating)}
                  </Text>
                </View>
              </MotiView>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
                !selectedRating && [
                  styles.submitButtonDisabled,
                  { backgroundColor: colors.borderLight }
                ],
              ]}
              onPress={handleSubmit}
              disabled={!selectedRating}
              activeOpacity={0.8}
            >
              <Text style={[styles.submitButtonText, { color: colors.background }]}>Continue</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 70,
  },
  emojiButtonSelected: {
    borderWidth: 2,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emojiLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  feedbackContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

