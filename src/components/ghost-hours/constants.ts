/**
 * Ghost Hours Calculator - Constants
 * 
 * This file contains all constant data, themes, and utility functions for the Ghost Hours Calculator.
 */

import { lightColors as colors } from '../../constants/colors';

// Dark theme for calculator screens (mystery, villain, input)
export const darkTheme = {
  background: '#0A0A0F', // Deep midnight blue-black
  backgroundLight: '#1A1A2E',
  card: 'rgba(255, 255, 255, 0.08)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  primary: '#F59E0B', // Orange/Gold
  primaryGlow: 'rgba(245, 158, 11, 0.4)',
  error: '#EF4444',
  success: '#10B981',
};

// Light theme for verdict screen (circular display)
export const lightTheme = {
  background: colors.background,
  backgroundLight: colors.backgroundLight,
  card: colors.backgroundCard,
  text: colors.text,
  textSecondary: colors.textSecondary,
  primary: colors.primary,
  primaryGlow: colors.glow,
  error: colors.error,
  success: colors.success,
};

// Cognitive Triggers for "Lies We Tell Ourselves"
export const COGNITIVE_TRIGGERS = [
  {
    id: 'time-lie',
    title: 'I\'ll do it tomorrow.',
    description: 'The procrastination loop. Tomorrow feels infinite, but it eventually becomes today.',
  },
  {
    id: 'energy-lie',
    title: 'It\'s not that important.',
    description: 'Minimization. We downplay the value of the task to reduce the guilt of avoiding it.',
  },
  {
    id: 'pressure-lie',
    title: 'I work better under pressure.',
    description: 'Deadline adrenaline. We convince ourselves that stress is a superpower.',
  },
  {
    id: 'prep-lie',
    title: 'I just need more time.',
    description: 'The preparation trap. We confuse planning with progress.',
  },
];

/**
 * Map distraction level (0-100) to factor for ghost hours calculation
 * 0 (Monk) = 0.1, 50 (Human) = 0.25, 100 (Goldfish) = 0.4
 */
export const getDistractionFactor = (level: number): number => {
  if (level <= 0) return 0.1;
  if (level >= 100) return 0.4;
  if (level <= 50) {
    // Linear interpolation from 0 to 50
    return 0.1 + (level / 50) * (0.25 - 0.1);
  }
  // Linear interpolation from 50 to 100
  return 0.25 + ((level - 50) / 50) * (0.4 - 0.25);
};

