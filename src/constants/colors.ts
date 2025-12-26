// Theme colors
export const lightColors = {
  // Backgrounds
  background: '#FFE5CC', // Soft light orange (single color background)
  backgroundLight: '#FFFBF0', // Light cream
  backgroundCard: '#FFFFFF', // White with slight transparency
  
  // Primary colors
  primary: '#F59E0B', // Amber/Gold
  primaryLight: '#FBBF24', // Light gold
  primaryDark: '#D97706', // Dark gold
  
  // Accents
  accent: '#FCD34D', // Yellow
  accentLight: '#FDE68A', // Light yellow
  
  // Text
  text: '#2D2D2D', // Dark charcoal
  textSecondary: '#6B6B6B', // Warm gray
  textLight: '#8B7355', // Warm brown
  
  // Borders & Dividers
  border: 'rgba(245, 158, 11, 0.2)', // Light gold border
  borderLight: 'rgba(251, 191, 36, 0.3)', // Lighter gold
  
  // Status colors
  success: '#10B981', // Keep green for success
  error: '#EF4444', // Keep red for errors
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.4)', // Dark overlay for modals
  glow: 'rgba(245, 158, 11, 0.3)', // Gold glow
};

export const darkColors = {
  // Backgrounds
  background: '#0A0A0A', // Dark
  backgroundLight: '#1A1A1A', // Slightly lighter dark
  backgroundCard: 'rgba(255, 255, 255, 0.05)', // Semi-transparent white
  
  // Primary colors
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8', // Light indigo
  primaryDark: '#4F46E5', // Dark indigo
  
  // Accents
  accent: '#8B5CF6', // Purple
  accentLight: '#A78BFA', // Light purple
  
  // Text
  text: '#FFFFFF', // White
  textSecondary: '#A0A0A0', // Gray
  textLight: '#CCCCCC', // Light gray
  
  // Borders & Dividers
  border: 'rgba(255, 255, 255, 0.1)', // Light border
  borderLight: 'rgba(255, 255, 255, 0.2)', // Lighter border
  
  // Status colors
  success: '#10B981', // Keep green for success
  error: '#EF4444', // Keep red for errors
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.8)', // Dark overlay for modals
  glow: 'rgba(99, 102, 241, 0.3)', // Indigo glow
};

export type ColorScheme = typeof lightColors;
