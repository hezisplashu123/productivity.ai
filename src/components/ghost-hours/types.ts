/**
 * Ghost Hours Calculator - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the Ghost Hours Calculator flow.
 */

export type Screen = 'mystery' | 'villain' | 'input' | 'verdict';

export interface GhostHoursCalculatorProps {
  onComplete?: (ghostHours: number, workHours: number) => void;
  onSkip?: () => void;
}

export interface Screen1MysteryProps {
  onNext: () => void;
  onSkip?: () => void;
}

export interface Screen2VillainProps {
  onNext: () => void;
  onSkip?: () => void;
}

export interface Screen3InputProps {
  workHours: number;
  setWorkHours: (hours: number) => void;
  distractionLevel: number;
  setDistractionLevel: (level: number) => void;
  onCalculate: () => void;
  onSkip?: () => void;
}

export interface Screen4VerdictProps {
  ghostHours: number;
  workHours: number;
  onReclaim: () => void;
  onComplete?: (ghostHours: number, workHours: number) => void;
}

