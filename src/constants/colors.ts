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

const baseTheme = {
  background: brandTheme.colors.ink,
  backgroundElevated: brandTheme.colors.graphite,
  backgroundLight: brandTheme.colors.graphite,
  backgroundCard: brandTheme.colors.graphite,
  backgroundCardHover: '#403C36',
  text: brandTheme.colors.paper,
  textSecondary: brandTheme.colors.fog,
  textMuted: brandTheme.colors.fog,
  textLight: brandTheme.colors.fog,
  border: '#403C36',
  borderSubtle: brandTheme.colors.graphite,
  swipeSkip: brandTheme.colors.fog,
  swipeSkipGlow: 'rgba(143, 138, 129, 0.25)',
  error: '#FF0000',
  overlay: 'rgba(21, 19, 15, 0.85)',
};

const friendshipTheme: Theme = {
  ...baseTheme,
  primary: brandTheme.colors.signal,
  primaryLight: '#FF6B85',
  primaryDark: '#D42B47',
  primaryGlow: 'rgba(255, 59, 92, 0.35)',
  swipeKeep: brandTheme.colors.signal,
  swipeKeepGlow: 'rgba(255, 59, 92, 0.25)',
  success: brandTheme.colors.signal,
  glow: 'rgba(255, 59, 92, 0.15)',
};

const loversTheme: Theme = {
  ...baseTheme,
  primary: '#A855F7',
  primaryLight: '#C084FC',
  primaryDark: '#7E22CE',
  primaryGlow: 'rgba(168, 85, 247, 0.35)',
  swipeKeep: '#A855F7',
  swipeKeepGlow: 'rgba(168, 85, 247, 0.25)',
  success: '#A855F7',
  glow: 'rgba(168, 85, 247, 0.15)',
};

const familyTheme: Theme = {
  ...baseTheme,
  primary: '#0EA5E9',
  primaryLight: '#38BDF8',
  primaryDark: '#0369A1',
  primaryGlow: 'rgba(14, 165, 233, 0.35)',
  swipeKeep: '#0EA5E9',
  swipeKeepGlow: 'rgba(14, 165, 233, 0.25)',
  success: '#0EA5E9',
  glow: 'rgba(14, 165, 233, 0.15)',
};

export const palettes: Record<'friendship' | 'relationship' | 'family', Theme> = {
  friendship: friendshipTheme,
  relationship: loversTheme,
  family: familyTheme,
};

export const colors = friendshipTheme;