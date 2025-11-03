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
      // Build full prompt with system instruction + user prompt + JSON schema guide
      const fullPrompt = formatPromptForAutomation(formData.prompt, formData.systemInstruction, formData.language);

      // NEW: Direct automation without side-panel
      // Send message to background to trigger automation
      const GEMINI_STUDIO_URL = 'https://aistudio.google.com/';

      // Find or create AI Studio tab
      const tabs = await chrome.tabs.query({ url: `${GEMINI_STUDIO_URL}*` });
      let targetTab: chrome.tabs.Tab;

      if (tabs.length > 0 && tabs[0]) {
        // Use existing tab
        targetTab = tabs[0];
        if (targetTab.id) {
          await chrome.tabs.update(targetTab.id, { active: true });
        }
      } else {
        // Create new tab
        targetTab = await chrome.tabs.create({ url: GEMINI_STUDIO_URL, active: true });
      }

      if (!targetTab.id) {
        throw new Error('Failed to get tab ID');
      }

      // Wait for tab to load
      await new Promise<void>(resolve => {
        const listener = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
          if (tabId === targetTab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);

        // Timeout after 10 seconds
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }, 10000);
      });

      // Inject content script and run full automation
      await chrome.scripting.executeScript({
        target: { tabId: targetTab.id },
        files: ['content-runtime/geminiAutoFill.iife.js'],
      });

      // Wait for content script to initialize
      await new Promise(resolve => setTimeout(resolve, 500));

      // Send AUTOMATE_FULL_FLOW message to content script
      await chrome.tabs.sendMessage(targetTab.id, {
        type: 'AUTOMATE_FULL_FLOW',
        payload: {
          prompt: fullPrompt,
          language: formData.language,
          maxWaitTime: 120000, // 2 minutes
        },
      });

      toast.success('Automation started', {
        description: 'AI Studio is generating your script. The tab will close automatically when done.',
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
