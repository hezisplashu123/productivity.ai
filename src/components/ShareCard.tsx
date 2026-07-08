import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography } from '../constants/typography';
import { Theme } from '../constants/colors';

interface ShareCardProps {
  question: string;
  theme: Theme;
}

export const ShareCard = forwardRef<View, ShareCardProps>(({ question, theme }, ref) => {
  return (
    <View 
      ref={ref}
      style={[styles.container, { backgroundColor: '#0B0B0E' }]}
      collapsable={false}
    >
      <View style={[styles.glow, { backgroundColor: theme.primary }]} />
      <View style={[styles.glow2, { backgroundColor: theme.primary }]} />
      
      <View style={styles.card}>
        <Text style={styles.quoteMark}>"</Text>
        <Text style={[styles.question, { color: '#FFFFFF' }]} numberOfLines={8} adjustsFontSizeToFit>
          {question}
        </Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={[styles.watermark, { color: 'rgba(255,255,255,0.95)' }]}>Realtalk</Text>
        <Text style={[styles.subWatermark, { color: 'rgba(255,255,255,0.5)' }]}>Search 'Realtalk' on the App Store</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 1080,
    height: 1920,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 100,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -200,
    left: -200,
    width: 1000,
    height: 1000,
    borderRadius: 500,
    opacity: 0.15,
  },
  glow2: {
    position: 'absolute',
    bottom: -300,
    right: -200,
    width: 800,
    height: 800,
    borderRadius: 400,
    opacity: 0.25,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(24, 24, 32, 0.85)',
    borderRadius: 60,
    padding: 80,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  quoteMark: {
    fontFamily: typography.heading,
    fontSize: 160,
    color: 'rgba(255,255,255,0.1)',
    position: 'absolute',
    top: 10,
    left: 50,
  },
  question: {
    fontFamily: typography.heading,
    fontSize: 85,
    textAlign: 'center',
    lineHeight: 110,
    zIndex: 1,
    marginTop: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
  },
  watermark: {
    fontFamily: typography.heading,
    fontSize: 56,
    letterSpacing: 2,
    marginBottom: 16,
  },
  subWatermark: {
    fontFamily: typography.bodyBold,
    fontSize: 26,
    letterSpacing: 1,
  },
});
