/**
 * Error Handler Hook
 *
 * Purpose: Consistent error handling and display across components
 * Responsibilities:
 * - Error state management
 * - Toast notifications for errors
 * - Error clearing
 * - Type-safe error handling
 *
 * Benefits:
 * - DRY: Removes repeated useState + toast patterns
 * - Consistent UX: Same error display everywhere
 * - Easy to extend: Add logging, analytics, etc.
 */

import { toast } from '@extension/ui';
import { useState, useCallback } from 'react';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  toastDuration?: number;
}

interface UseErrorHandlerReturn {
  error: string | null;
  setError: (error: string | null) => void;
  handleError: (error: unknown, fallbackMessage?: string) => void;
  clearError: () => void;
}

/**
 * Hook for consistent error handling
 *
 * @param options Configuration options
 * @returns Error state and handlers
 *
 * @example
 * ```typescript
 * const { error, handleError, clearError } = useErrorHandler({ showToast: true });
 *
 * try {
 *   await someOperation();
 * } catch (err) {
 *   handleError(err, 'Operation failed');
 * }
 * ```
 */
const useErrorHandler = (options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn => {
  const { showToast = true, toastDuration = 5000 } = options;
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback(
    (error: unknown, fallbackMessage = 'An error occurred') => {
      const errorMessage = error instanceof Error ? error.message : fallbackMessage;
      setError(errorMessage);

      if (showToast) {
        toast.error(errorMessage, {
          duration: toastDuration,
        });
      }
    },
    [showToast, toastDuration],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    setError,
    handleError,
    clearError,
  };
};

export { useErrorHandler };
export type { UseErrorHandlerOptions, UseErrorHandlerReturn };
