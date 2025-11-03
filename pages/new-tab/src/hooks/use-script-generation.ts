import { useAsyncOperation } from './use-async-operation';
import { toast } from '@extension/ui';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@src/constants/script-generation';
import { generateScript } from '@src/services/background-api';
import { useApiKey } from '@src/stores/use-api-key';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { formatPromptForAutomation } from '@src/utils/prompt-builder';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ScriptStory } from '@src/types';
import type { GenerationFormData } from '@src/types/script-generation';

/**
 * Hook for script generation logic
 * Encapsulates API calls, validation, navigation, and error handling
 */
export const useScriptGeneration = () => {
  const { apiKey } = useApiKey();
  const navigate = useNavigate();
  const addScript = useScriptsStore(s => s.addScript);
  const { execute, isLoading, error } = useAsyncOperation<ScriptStory>();

  const generateFromAPI = useCallback(
    async (formData: GenerationFormData) => {
      if (!apiKey) {
        toast.error(ERROR_MESSAGES.API_KEY_MISSING);
        return { success: false, error: ERROR_MESSAGES.API_KEY_MISSING } as const;
      }

      const result = await execute(
        async () => {
          const generatedScript = await generateScript({
            prompt: formData.prompt,
            language: formData.language,
            apiKey,
            modelName: formData.scriptModel,
            temperature: formData.temperature,
            topP: formData.topP,
            topK: formData.topK,
            maxOutputTokens: formData.maxOutputTokens,
          });

          const newScript = await addScript(generatedScript);
          return newScript;
        },
        [],
        {
          onSuccess: newScript => {
            if (newScript.id) {
              toast.success(SUCCESS_MESSAGES.SCRIPT_CREATED);
              navigate(`/script/${newScript.id}`);
            }
          },
          onError: () => {
            toast.error(ERROR_MESSAGES.GENERATION_FAILED);
          },
          errorMessage: ERROR_MESSAGES.GENERATION_FAILED,
        },
      );

      return result;
    },
    [apiKey, execute, addScript, navigate],
  );

  const generateWithAutomate = useCallback(async (formData: GenerationFormData) => {
    try {
      const currentWindow = await chrome.windows.getCurrent();

      if (!currentWindow?.id) {
        toast.error(ERROR_MESSAGES.SIDE_PANEL_FAILED, {
          description: ERROR_MESSAGES.WINDOW_NOT_FOUND,
        });
        return { success: false, error: ERROR_MESSAGES.WINDOW_NOT_FOUND } as const;
      }

      await chrome.sidePanel.open({ windowId: currentWindow.id });

      // Build full prompt with system instruction + user prompt + JSON schema guide
      const fullPrompt = formatPromptForAutomation(formData.prompt, formData.systemInstruction, formData.language);

      await chrome.storage.local.set({
        automatePromptData: {
          prompt: fullPrompt, // Full context including schema
          systemInstruction: formData.systemInstruction,
          language: formData.language,
          timestamp: Date.now(),
        },
      });

      toast.success(SUCCESS_MESSAGES.SIDE_PANEL_OPENED, {
        description: SUCCESS_MESSAGES.SIDE_PANEL_DESCRIPTION,
      });

      return { success: true } as const;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.SIDE_PANEL_FAILED;
      toast.error(errorMessage);
      return { success: false, error: errorMessage } as const;
    }
  }, []);

  return {
    generateFromAPI,
    generateWithAutomate,
    isLoading,
    error,
  };
};
