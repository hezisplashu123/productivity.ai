export const lightColors = {
  // Backgrounds - Set to Pure White
  background: '#FFFFFF', 
  backgroundLight: '#F8F9FA', // Extremely subtle grey for contrast sections
  backgroundCard: '#FFFFFF', 
  
  // Primary colors
  primary: '#F59E0B', 
  primaryLight: '#FBBF24', 
  primaryDark: '#D97706', 
  
  // Text - High contrast charcoal
  text: '#1A1A1A', 
  textSecondary: '#6B7280', 
  textLight: '#9CA3AF', 
  
  // Borders
  border: '#F3F4F6', 
  borderLight: '#E5E7EB', 
  
  // Status
  success: '#10B981', 
  error: '#EF4444', 
  overlay: 'rgba(0, 0, 0, 0.4)',
  glow: 'rgba(245, 158, 11, 0.1)', 
};

export const darkColors = { /* existing dark colors */ };
export type ColorScheme = typeof lightColors;