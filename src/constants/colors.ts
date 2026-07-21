import { theme as brandTheme } from './theme';

export interface Theme {
  background: string;
  backgroundElevated: string;
  backgroundLight: string;
  backgroundCard: string;
  backgroundCardHover: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGlow: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textLight: string;
  border: string;
  borderSubtle: string;
  swipeKeep: string;
  swipeKeepGlow: string;
  swipeSkip: string;
  swipeSkipGlow: string;
  success: string;
  error: string;
  overlay: string;
  glow: string;
}

const unifiedTheme: Theme = {
  background: brandTheme.colors.ink,
  backgroundElevated: brandTheme.colors.graphite,
  backgroundLight: brandTheme.colors.graphite,
  backgroundCard: brandTheme.colors.graphite,
  backgroundCardHover: '#403C36',
  primary: brandTheme.colors.signal,
  primaryLight: '#FF6B85',
  primaryDark: '#D42B47',
  primaryGlow: 'rgba(255, 59, 92, 0.35)',
  text: brandTheme.colors.paper,
  textSecondary: brandTheme.colors.fog,
  textMuted: brandTheme.colors.fog,
  textLight: brandTheme.colors.fog,
  border: '#403C36',
  borderSubtle: brandTheme.colors.graphite,
  swipeKeep: brandTheme.colors.signal,
  swipeKeepGlow: 'rgba(255, 59, 92, 0.25)',
  swipeSkip: brandTheme.colors.fog,
  swipeSkipGlow: 'rgba(143, 138, 129, 0.25)',
  success: brandTheme.colors.signal,
  error: '#FF0000',
  overlay: 'rgba(21, 19, 15, 0.85)',
  glow: 'rgba(255, 59, 92, 0.15)',
};

// Map all palettes to the unified Realtalk brand theme
export const palettes: Record<'friendship' | 'relationship' | 'family', Theme> = {
  friendship: unifiedTheme,
  relationship: unifiedTheme,
  family: unifiedTheme,
};

// Default export used before Context mounts
export const colors = unifiedTheme;