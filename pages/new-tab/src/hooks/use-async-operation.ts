import { ERROR_MESSAGES } from '@extension/shared/lib/constants/ui-options';
import { useState, useCallback } from 'react';
import type { AsyncOperationState } from '@src/types/script-generation';

/**
 * Generic hook for handling async operations with loading/error states
 * Eliminates duplicate try-catch-finally patterns across components
 *
 * @example
 * const { execute, isLoading, error } = useAsyncOperation();
 * await execute(async () => {
 *   const result = await apiCall();
 *   return result;
 * });
 */
export const useAsyncOperation = <T = unknown>() => {
  const [state, setState] = useState<AsyncOperationState<T>>({
    isLoading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(
    async <TArgs extends unknown[]>(
      asyncFn: (...args: TArgs) => Promise<T>,
      args: TArgs,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: Error) => void;
        errorMessage?: string;
      },
    ) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await asyncFn(...args);
        setState({ isLoading: false, error: null, data });

        options?.onSuccess?.(data);
        return { success: true, data } as const;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(ERROR_MESSAGES.GENERIC);
        const errorMessage = options?.errorMessage || error.message;

        setState({ isLoading: false, error: errorMessage, data: null });
        options?.onError?.(error);

        return { success: false, error: errorMessage } as const;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};
