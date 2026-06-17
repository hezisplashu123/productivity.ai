import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, ArrowRight } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, Easing } from 'react-native-reanimated';
import { Theme } from '../constants/colors';
import { SwipableCardData } from '../types';

interface DiscussionModalProps {
  activeDiscussion: SwipableCardData;
  onClose: () => void;
  theme: Theme;
}

export const DiscussionModal: React.FC<DiscussionModalProps> = ({ activeDiscussion, onClose, theme }) => {
  const styles = getStyles(theme);

  return (
    <Animated.View style={styles.discussionOverlay} entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
      <SafeAreaView style={styles.discussionContent}>
        <Animated.View
          style={styles.discussionInner}
          entering={SlideInDown.duration(400).easing(Easing.out(Easing.cubic))}
          exiting={SlideOutDown.duration(300).easing(Easing.in(Easing.cubic))}
        >
          <View style={styles.discussionBadge}>
            <MessageCircle size={20} color={theme.primary} />
            <Text style={styles.discussionBadgeText}>Group Discussion</Text>
          </View>

          <Text style={styles.discussionQuestion}>{activeDiscussion.label}</Text>

          <TouchableOpacity style={styles.nextButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.nextButtonText}>Next Question</Text>
            <ArrowRight size={20} color={theme.background} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  discussionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
    zIndex: 100,
  },
  discussionContent: {
    flex: 1,
  },
  discussionInner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  discussionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.backgroundElevated,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 8,
    marginBottom: 24,
  },
  discussionBadgeText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  discussionQuestion: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.text,
    lineHeight: 42,
    marginBottom: 40,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 18,
    borderRadius: 20,
    gap: 12,
  },
  nextButtonText: {
    color: theme.background,
    fontSize: 18,
    fontWeight: '800',
  },
});
