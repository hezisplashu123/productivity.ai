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

export const palettes: Record<'friendship' | 'relationship' | 'family', Theme> = {
  friendship: {
    background: '#000000',
    backgroundElevated: '#0F172A',
    backgroundLight: '#0F172A',
    backgroundCard: '#1E293B',
    backgroundCardHover: '#334155',
    primary: '#38BDF8', // Blue
    primaryLight: '#7DD3FC',
    primaryDark: '#0EA5E9',
    primaryGlow: 'rgba(56, 189, 248, 0.35)',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textLight: '#64748B',
    border: '#334155',
    borderSubtle: '#1E293B',
    swipeKeep: '#38BDF8',
    swipeKeepGlow: 'rgba(56, 189, 248, 0.25)',
    swipeSkip: '#F97316',
    swipeSkipGlow: 'rgba(249, 115, 22, 0.25)',
    success: '#38BDF8',
    error: '#F97316',
    overlay: 'rgba(0, 0, 0, 0.72)',
    glow: 'rgba(56, 189, 248, 0.15)',
  },
  relationship: {
    background: '#000000',
    backgroundElevated: '#2B0A16',
    backgroundLight: '#2B0A16',
    backgroundCard: '#4C1D3D',
    backgroundCardHover: '#682955',
    primary: '#F472B6', // Pink
    primaryLight: '#FBCFE8',
    primaryDark: '#DB2777',
    primaryGlow: 'rgba(244, 114, 182, 0.35)',
    text: '#FDF2F8',
    textSecondary: '#F9A8D4',
    textMuted: '#EC4899',
    textLight: '#EC4899',
    border: '#831843',
    borderSubtle: '#4C1D3D',
    swipeKeep: '#F472B6',
    swipeKeepGlow: 'rgba(244, 114, 182, 0.25)',
    swipeSkip: '#64748B',
    swipeSkipGlow: 'rgba(100, 116, 139, 0.25)',
    success: '#F472B6',
    error: '#EF4444',
    overlay: 'rgba(0, 0, 0, 0.72)',
    glow: 'rgba(244, 114, 182, 0.15)',
  },
  family: {
    background: '#000000',
    backgroundElevated: '#064E3B',
    backgroundLight: '#064E3B',
    backgroundCard: '#065F46',
    backgroundCardHover: '#047857',
    primary: '#4ADE80', // Green
    primaryLight: '#86EFAC',
    primaryDark: '#16A34A',
    primaryGlow: 'rgba(74, 222, 128, 0.35)',
    text: '#F0FDF4',
    textSecondary: '#A7F3D0',
    textMuted: '#34D399',
    textLight: '#34D399',
    border: '#047857',
    borderSubtle: '#065F46',
    swipeKeep: '#4ADE80',
    swipeKeepGlow: 'rgba(74, 222, 128, 0.25)',
    swipeSkip: '#F59E0B',
    swipeSkipGlow: 'rgba(245, 158, 11, 0.25)',
    success: '#4ADE80',
    error: '#EF4444',
    overlay: 'rgba(0, 0, 0, 0.72)',
    glow: 'rgba(74, 222, 128, 0.15)',
  }
};

// Default export used before Context mounts
export const colors = palettes.friendship;