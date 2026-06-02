export const colors = {
  background: '#000000',
  backgroundElevated: '#0F172A',
  backgroundLight: '#0F172A',
  backgroundCard: '#1E293B',
  backgroundCardHover: '#334155',

  primary: '#38BDF8',
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
};

/** @deprecated Use `colors` — kept so legacy imports do not break during migration */
export const lightColors = colors;
export const darkColors = colors;
export type ColorScheme = typeof colors;
