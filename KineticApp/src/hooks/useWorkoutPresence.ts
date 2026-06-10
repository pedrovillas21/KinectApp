import { useEffect, useRef } from 'react';
import { startWorkoutPresence, endWorkoutPresence } from '../services/socialService';

export default function useWorkoutPresence() {
  const hasSaved = useRef(false);

  const markSaved = () => {
    hasSaved.current = true;
  };

  useEffect(() => {
    startWorkoutPresence().catch(() => {/* non-critical */});

    return () => {
      if (!hasSaved.current) {
        endWorkoutPresence().catch(() => {/* non-critical */});
      }
    };
  }, []);

  return { markSaved };
}
