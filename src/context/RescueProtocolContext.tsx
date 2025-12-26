import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface SwipeInteraction {
  cardId: string;
  direction: 'left' | 'right';
  velocity: number; // Normalized velocity (0-1+)
  duration: number; // Time in ms
  timestamp: number;
  hesitation: 'none' | 'low' | 'medium' | 'high'; // Based on duration
  priority: 'low' | 'medium' | 'high'; // Based on velocity + direction
}

interface RescueProtocolContextType {
  interactions: SwipeInteraction[];
  addInteraction: (interaction: Omit<SwipeInteraction, 'timestamp' | 'hesitation' | 'priority'>) => void;
  getHighPriorityInterventions: () => SwipeInteraction[];
  getNeedsCoaching: () => SwipeInteraction[];
  clearInteractions: () => void;
}

const RescueProtocolContext = createContext<RescueProtocolContextType | undefined>(undefined);

const HESITATION_THRESHOLDS = {
  none: 0, // Instant swipe (< 500ms)
  low: 500, // Quick decision (500-1500ms)
  medium: 1500, // Some hesitation (1500-3000ms)
  high: 3000, // Significant hesitation (> 3000ms)
};

const VELOCITY_THRESHOLDS = {
  high: 0.8, // Very fast swipe
  medium: 0.4, // Moderate speed
  low: 0, // Slow swipe
};

export const RescueProtocolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [interactions, setInteractions] = useState<SwipeInteraction[]>([]);

  const calculateHesitation = useCallback((duration: number): SwipeInteraction['hesitation'] => {
    if (duration < HESITATION_THRESHOLDS.low) return 'none';
    if (duration < HESITATION_THRESHOLDS.medium) return 'low';
    if (duration < HESITATION_THRESHOLDS.high) return 'medium';
    return 'high';
  }, []);

  const calculatePriority = useCallback(
    (velocity: number, direction: 'left' | 'right'): SwipeInteraction['priority'] => {
      // Right swipe (affects productivity) + high velocity = high priority
      if (direction === 'right' && velocity > VELOCITY_THRESHOLDS.high) {
        return 'high';
      }
      // Right swipe with medium velocity = medium priority
      if (direction === 'right' && velocity > VELOCITY_THRESHOLDS.medium) {
        return 'medium';
      }
      // Left swipe (doesn't affect) is generally lower priority
      return 'low';
    },
    []
  );

  const addInteraction = useCallback(
    (interaction: Omit<SwipeInteraction, 'timestamp' | 'hesitation' | 'priority'>) => {
      const hesitation = calculateHesitation(interaction.duration);
      const priority = calculatePriority(interaction.velocity, interaction.direction);

      const fullInteraction: SwipeInteraction = {
        ...interaction,
        timestamp: Date.now(),
        hesitation,
        priority,
      };

      setInteractions((prev) => [...prev, fullInteraction]);
    },
    [calculateHesitation, calculatePriority]
  );

  const getHighPriorityInterventions = useCallback(() => {
    return interactions.filter(
      (interaction) =>
        interaction.priority === 'high' &&
        interaction.direction === 'right' &&
        interaction.hesitation === 'none'
    );
  }, [interactions]);

  const getNeedsCoaching = useCallback(() => {
    return interactions.filter(
      (interaction) =>
        interaction.hesitation === 'high' ||
        (interaction.direction === 'right' && interaction.velocity < VELOCITY_THRESHOLDS.medium)
    );
  }, [interactions]);

  const clearInteractions = useCallback(() => {
    setInteractions([]);
  }, []);

  return (
    <RescueProtocolContext.Provider
      value={{
        interactions,
        addInteraction,
        getHighPriorityInterventions,
        getNeedsCoaching,
        clearInteractions,
      }}
    >
      {children}
    </RescueProtocolContext.Provider>
  );
};

export const useRescueProtocol = () => {
  const context = useContext(RescueProtocolContext);
  if (!context) {
    throw new Error('useRescueProtocol must be used within RescueProtocolProvider');
  }
  return context;
};

