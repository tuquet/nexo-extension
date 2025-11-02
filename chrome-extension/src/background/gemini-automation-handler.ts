/**
 * Background handler for browser automation tasks related to Google AI Studio.
 * Manages tab creation/focusing and content script injection for auto-filling prompts.
 */

import type { AutoFillGeminiPromptMessage, AutoFillGeminiPromptResponse } from './types/messages';

const GEMINI_STUDIO_URL = 'https://aistudio.google.com/';
const CONTENT_SCRIPT_PATH = 'content-runtime/geminiAutoFill.iife.js';

/**
 * Wait for tab to finish loading
 */
const waitForTabLoad = (tabId: number, timeoutMs = 10000): Promise<void> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('Tab load timeout'));
    }, timeoutMs);

    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });

/**
 * Handle AUTO_FILL_GEMINI_PROMPT message
 * Finds or creates Google AI Studio tab, injects content script, and sends prompt
 */
const handleAutoFillGeminiPrompt = async (
  message: AutoFillGeminiPromptMessage,
): Promise<AutoFillGeminiPromptResponse> => {
  try {
    const { prompt, autoSend = false } = message.payload;
    console.log('[Automation] Received AUTO_FILL_GEMINI_PROMPT message', message.payload);

    // Read typing delay from preferences
    let typingDelay = 50; // Default
    try {
      const prefs = await chrome.storage.local.get(['preferences']);
      if (prefs?.preferences?.state?.typingDelay) {
        typingDelay = prefs.preferences.state.typingDelay;
      }
    } catch (storageError) {
      console.warn('[Automation] Failed to read typing delay from storage, using default:', storageError);
    }

    // Step 1: Find existing Google AI Studio tab
    const tabs = await chrome.tabs.query({
      url: 'https://aistudio.google.com/*',
    });

    let targetTab = tabs[0];

    // Step 2: If no tab found, create new one
    if (!targetTab) {
      console.log('[Automation] No Gemini Studio tab found, creating new tab...');
      targetTab = await chrome.tabs.create({
        url: GEMINI_STUDIO_URL,
        active: true,
      });

      // Wait for page to load before injecting script
      await waitForTabLoad(targetTab.id!);
    } else {
      // Step 3: Focus existing tab
      console.log(`[Automation] Found existing Gemini Studio tab: ${targetTab.id}`);
      await chrome.tabs.update(targetTab.id!, { active: true });
      await chrome.windows.update(targetTab.windowId!, { focused: true });
    }

    // Step 4: Inject content script (if not already injected)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: targetTab.id! },
        files: [CONTENT_SCRIPT_PATH],
      });
      console.log('[Automation] Content script injected successfully');
    } catch (injectionError) {
      console.warn('[Automation] Content script injection failed (may already be injected):', injectionError);
      // Continue anyway - script might already be injected
    }

    // Step 5: Send message to content script to fill prompt
    await chrome.tabs.sendMessage(targetTab.id!, {
      type: 'FILL_PROMPT',
      payload: {
        prompt,
        autoSend,
        typingDelay,
      },
    });

    console.log('[Automation] Prompt sent to content script');

    return {
      success: true,
      data: {
        tabId: targetTab.id!,
        url: targetTab.url || GEMINI_STUDIO_URL,
      },
    };
  } catch (error) {
    console.error('[Automation] Error in handleAutoFillGeminiPrompt:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'AUTOMATION_ERROR',
      },
    };
  }
};

export { handleAutoFillGeminiPrompt };
