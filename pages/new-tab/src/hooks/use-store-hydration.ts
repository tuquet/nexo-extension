import { useScriptsStore } from '../stores/use-scripts-store';
import { useState, useEffect } from 'react';

/**
 * A custom hook that returns `true` once the script store has been hydrated.
 * This hook encapsulates the logic for listening to Zustand's persist middleware hydration events.
 *
 * @returns {boolean} `true` if the store is hydrated, otherwise `false`.
 */
export const useStoreHydration = () => {
  const [isHydrated, setIsHydrated] = useState(() => useScriptsStore.persist.hasHydrated());

  useEffect(() => {
    // Subscribe to the onFinishHydration event
    const unsubscribe = useScriptsStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    return () => unsubscribe();
  }, []);

  return isHydrated;
};
