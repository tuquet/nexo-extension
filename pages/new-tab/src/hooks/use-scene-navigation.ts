/**
 * Scene Navigation Hook
 *
 * Purpose: Scene selection and navigation within a script
 * Responsibilities:
 * - Track active scene
 * - Navigate between scenes
 * - Get scene metadata (total count, current position)
 * - Handle edge cases (first/last scene)
 *
 * Benefits:
 * - Centralized navigation logic
 * - Easy keyboard navigation support
 * - Consistent behavior across components
 */

import { useScriptsStore } from '@src/stores/use-scripts-store';
import { useCallback, useMemo } from 'react';
import type { ScriptStory } from '@src/types';

interface SceneInfo {
  actIndex: number;
  sceneIndex: number;
  actNumber: number;
  sceneNumber: number;
  isFirst: boolean;
  isLast: boolean;
  totalScenes: number;
  position: number; // 1-based position across all acts
}

interface UseSceneNavigationReturn {
  activeScene: SceneInfo | null;
  goToScene: (actIndex: number, sceneIndex: number) => void;
  nextScene: () => void;
  previousScene: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

/**
 * Get flattened scene list for navigation
 */
const getFlatSceneList = (script: ScriptStory | null) => {
  if (!script) return [];

  const scenes: Array<{ actIndex: number; sceneIndex: number }> = [];
  script.acts.forEach((act, actIndex) => {
    act.scenes.forEach((_, sceneIndex) => {
      scenes.push({ actIndex, sceneIndex });
    });
  });
  return scenes;
};

/**
 * Hook for scene navigation within a script
 *
 * @returns Scene navigation functions and metadata
 *
 * @example
 * ```typescript
 * const { activeScene, nextScene, previousScene, canGoNext } = useSceneNavigation();
 *
 * // Navigate
 * if (canGoNext) nextScene();
 *
 * // Get current position
 * console.log(`Scene ${activeScene?.position} of ${activeScene?.totalScenes}`);
 * ```
 */
const useSceneNavigation = (): UseSceneNavigationReturn => {
  const activeScript = useScriptsStore(s => s.activeScript);
  const activeSceneIdentifier = useScriptsStore(s => s.activeSceneIdentifier);
  const setActiveSceneIdentifier = useScriptsStore(s => s.setActiveSceneIdentifier);

  const flatScenes = useMemo(() => getFlatSceneList(activeScript), [activeScript]);

  const currentPosition = useMemo(() => {
    if (!activeSceneIdentifier) return -1;
    return flatScenes.findIndex(
      s => s.actIndex === activeSceneIdentifier.actIndex && s.sceneIndex === activeSceneIdentifier.sceneIndex,
    );
  }, [flatScenes, activeSceneIdentifier]);

  const activeScene = useMemo((): SceneInfo | null => {
    if (!activeScript || !activeSceneIdentifier || currentPosition === -1) return null;

    const { actIndex, sceneIndex } = activeSceneIdentifier;
    const act = activeScript.acts[actIndex];
    const scene = act?.scenes[sceneIndex];

    if (!act || !scene) return null;

    return {
      actIndex,
      sceneIndex,
      actNumber: act.act_number,
      sceneNumber: scene.scene_number,
      isFirst: currentPosition === 0,
      isLast: currentPosition === flatScenes.length - 1,
      totalScenes: flatScenes.length,
      position: currentPosition + 1, // 1-based
    };
  }, [activeScript, activeSceneIdentifier, currentPosition, flatScenes]);

  const goToScene = useCallback(
    (actIndex: number, sceneIndex: number) => {
      setActiveSceneIdentifier({ actIndex, sceneIndex });
    },
    [setActiveSceneIdentifier],
  );

  const nextScene = useCallback(() => {
    if (currentPosition < flatScenes.length - 1) {
      const next = flatScenes[currentPosition + 1];
      setActiveSceneIdentifier(next);
    }
  }, [currentPosition, flatScenes, setActiveSceneIdentifier]);

  const previousScene = useCallback(() => {
    if (currentPosition > 0) {
      const prev = flatScenes[currentPosition - 1];
      setActiveSceneIdentifier(prev);
    }
  }, [currentPosition, flatScenes, setActiveSceneIdentifier]);

  return {
    activeScene,
    goToScene,
    nextScene,
    previousScene,
    canGoNext: currentPosition < flatScenes.length - 1,
    canGoPrevious: currentPosition > 0,
  };
};

export { useSceneNavigation };
export type { UseSceneNavigationReturn, SceneInfo };
