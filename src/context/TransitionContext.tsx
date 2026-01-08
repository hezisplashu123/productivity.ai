import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TransitionCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TransitionContextType {
  transitionCoords: TransitionCoordinates | null;
  setTransitionCoords: (coords: TransitionCoordinates | null) => void;
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export const TransitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transitionCoords, setTransitionCoords] = useState<TransitionCoordinates | null>(null);

  return (
    <TransitionContext.Provider value={{ transitionCoords, setTransitionCoords }}>
      {children}
    </TransitionContext.Provider>
  );
};

export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition must be used within TransitionProvider');
  }
  return context;
};









