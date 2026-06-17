import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '../constants/colors';

interface SocialAuthButtonsProps {
  theme: Theme;
  googleRequestReady: boolean;
  onApplePress: () => void;
  onGooglePress: () => void;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  theme,
  googleRequestReady,
  onApplePress,
  onGooglePress,
}) => {
  const styles = getStyles(theme);

  return (
    <View style={styles.socialButtonsContainer}>
      {Platform.OS === 'ios' && (
        <TouchableOpacity style={styles.appleCustomButton} onPress={onApplePress}>
          <View style={styles.iconContainer}>
            <Svg width={22} height={22} viewBox="0 0 384 512" fill="#FFFFFF">
              <Path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-54.5-91.9-54.1-91.9zM245.2 75c22.3-24.6 16.2-59.5 16-59.5-26.3-.1-56.6 16.8-71.1 37.8-13 18.2-16.2 47.9-14.7 58.9 29.8 1.9 55.3-19.8 69.8-37.2z" />
            </Svg>
          </View>
          <Text style={styles.appleButtonText}>Continue with Apple</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.googleButton, !googleRequestReady && { opacity: 0.5 }]}
        onPress={onGooglePress}
        disabled={!googleRequestReady}
      >
        <View style={styles.iconContainer}>
          <Svg width={24} height={24} viewBox="0 0 48 48">
            <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </Svg>
        </View>
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  socialButtonsContainer: { gap: 12 },
  appleCustomButton: { width: '100%', height: 56, backgroundColor: '#000000', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  appleButtonText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  googleButton: { width: '100%', height: 56, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconContainer: { marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  googleButtonText: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },
});
