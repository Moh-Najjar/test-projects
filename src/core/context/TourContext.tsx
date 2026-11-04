import React, { createContext, useCallback, useContext, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TourContextValue {
  /** Whether the tour is currently running. */
  isRunning: boolean;
  /** Current controlled step index. */
  stepIndex: number;
  /** Start the tour from step 0. */
  startTour: () => void;
  /** Stop and reset the tour. */
  stopTour: () => void;
  /** Manually advance to a specific step index (used for cross-page navigation). */
  setStepIndex: React.Dispatch<React.SetStateAction<number>>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TourContext = createContext<TourContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const TourProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(0);

  const startTour = useCallback((): void => {
    setStepIndex(0);
    setIsRunning(true);
  }, []);

  const stopTour = useCallback((): void => {
    setIsRunning(false);
    setStepIndex(0);
  }, []);

  return (
    <TourContext.Provider value={{ isRunning, stepIndex, startTour, stopTour, setStepIndex }}>
      {children}
    </TourContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the tour context. Must be used inside `TourProvider`.
 */
export const useTour = (): TourContextValue => {
  const ctx = useContext(TourContext);
  if (ctx === null) {
    throw new Error('useTour must be used inside <TourProvider>');
  }
  return ctx;
};
