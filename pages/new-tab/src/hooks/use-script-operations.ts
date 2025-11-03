/**
 * Script Operations Hook
 *
 * Purpose: Centralized script CRUD operations
 * Responsibilities:
 * - Load script by ID
 * - Save script changes
 * - Delete script
 * - Handle loading states
 *
 * Benefits:
 * - Reusable logic across components
 * - Consistent error handling
 * - Reduced boilerplate
 */

import { useErrorHandler } from './use-error-handler';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ScriptStory } from '@src/types';

interface UseScriptOperationsReturn {
  saveScript: (script: ScriptStory) => Promise<void>;
  deleteScript: (scriptId: number) => Promise<void>;
  loadScript: (scriptId: number) => void;
  isSaving: boolean;
  error: string | null;
}

/**
 * Hook for common script operations
 *
 * @returns Script operation functions and state
 *
 * @example
 * ```typescript
 * const { saveScript, deleteScript, loadScript, error } = useScriptOperations();
 *
 * // Save changes
 * await saveScript(updatedScript);
 *
 * // Delete script and navigate away
 * await deleteScript(scriptId);
 *
 * // Load specific script
 * loadScript(scriptId);
 * ```
 */
const useScriptOperations = (): UseScriptOperationsReturn => {
  const navigate = useNavigate();
  const { handleError, error } = useErrorHandler();

  const saveActiveScript = useScriptsStore(s => s.saveActiveScript);
  const deleteActiveScript = useScriptsStore(s => s.deleteActiveScript);
  const selectScript = useScriptsStore(s => s.selectScript);

  const saveScript = useCallback(
    async (script: ScriptStory) => {
      try {
        await saveActiveScript(script);
      } catch (err) {
        handleError(err, 'Không thể lưu kịch bản');
        throw err;
      }
    },
    [saveActiveScript, handleError],
  );

  const deleteScript = useCallback(
    async (scriptId: number) => {
      try {
        await deleteActiveScript(scriptId);
        navigate('/');
      } catch (err) {
        handleError(err, 'Không thể xóa kịch bản');
        throw err;
      }
    },
    [deleteActiveScript, navigate, handleError],
  );

  const loadScript = useCallback(
    (scriptId: number) => {
      try {
        selectScript(scriptId);
      } catch (err) {
        handleError(err, 'Không thể tải kịch bản');
      }
    },
    [selectScript, handleError],
  );

  return {
    saveScript,
    deleteScript,
    loadScript,
    isSaving: false, // TODO: Add actual loading state if needed
    error,
  };
};

export { useScriptOperations };
export type { UseScriptOperationsReturn };
