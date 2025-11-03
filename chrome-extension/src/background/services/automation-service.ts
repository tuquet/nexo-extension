import type { IAutomationService } from '../core/interfaces';

/**
 * AutomationService - Browser automation operations
 *
 * Handles tab management, content script injection, and automation tasks.
 * Encapsulates chrome.tabs and chrome.scripting APIs.
 */

// AI Studio URLs and script paths
const AI_STUDIO_URL = 'https://aistudio.google.com/prompts/new_chat';
const AI_STUDIO_SCRIPT = 'content-runtime/aistudio.iife.js';

// Gemini Web URLs and script paths
const GEMINI_WEB_URL = 'https://gemini.google.com/app';
const GEMINI_WEB_SCRIPT = 'content-runtime/gemini.iife.js';

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

export class AutomationService implements IAutomationService {
  /**
   * Auto-fill AI Studio prompt (aistudio.google.com)
   *
   * Finds or creates AI Studio tab, injects content script, sends prompt.
   */
  async autoFillAIStudioPrompt(params: {
    prompt: string;
    autoSend?: boolean;
    typingDelay?: number;
  }): Promise<{ success: boolean }> {
    const { prompt, autoSend = false, typingDelay = 50 } = params;

    console.log('[AutomationService] Auto-filling AI Studio prompt, length:', prompt.length);

    const tab = await this.findOrCreateTab(AI_STUDIO_URL);

    if (!tab.id) {
      throw new Error('Failed to get tab ID');
    }

    await waitForTabLoad(tab.id);
    await this.injectContentScript(tab.id, AI_STUDIO_SCRIPT);
    await new Promise(resolve => setTimeout(resolve, 500));

    await chrome.tabs.sendMessage(tab.id, {
      action: 'AUTO_FILL_PROMPT',
      prompt,
      autoSend,
      typingDelay,
    });

    console.log('[AutomationService] AI Studio prompt sent');

    return { success: true };
  }

  /**
   * Auto-fill Gemini Web prompt (gemini.google.com/app)
   *
   * Finds or creates Gemini Web tab, injects content script, sends prompt.
   */
  async autoFillGeminiWebPrompt(params: {
    prompt: string;
    autoSend?: boolean;
    typingDelay?: number;
  }): Promise<{ success: boolean }> {
    const { prompt, autoSend = false, typingDelay = 50 } = params;

    console.log('[AutomationService] Auto-filling Gemini Web prompt, length:', prompt.length);

    const tab = await this.findOrCreateTab(GEMINI_WEB_URL);

    if (!tab.id) {
      throw new Error('Failed to get tab ID');
    }

    await waitForTabLoad(tab.id);
    await this.injectContentScript(tab.id, GEMINI_WEB_SCRIPT);
    await new Promise(resolve => setTimeout(resolve, 500));

    await chrome.tabs.sendMessage(tab.id, {
      action: 'AUTO_FILL_PROMPT',
      prompt,
      autoSend,
      typingDelay,
    });

    console.log('[AutomationService] Gemini Web prompt sent');

    return { success: true };
  }

  /**
   * Legacy method - redirects to AI Studio
   * @deprecated Use autoFillAIStudioPrompt or autoFillGeminiWebPrompt instead
   */
  async autoFillGeminiPrompt(params: {
    prompt: string;
    autoSend?: boolean;
    typingDelay?: number;
  }): Promise<{ success: boolean }> {
    return this.autoFillAIStudioPrompt(params);
  }

  /**
   * Find existing tab with URL or create new one
   *
   * @param url URL to find/create
   * @returns Tab object
   */
  async findOrCreateTab(url: string): Promise<chrome.tabs.Tab> {
    // Try to find existing tab with this URL
    const tabs = await chrome.tabs.query({ url: `${url}*` });

    if (tabs.length > 0 && tabs[0]) {
      // Focus existing tab
      const tab = tabs[0];
      if (!tab.id) {
        throw new Error('Tab ID is undefined');
      }
      await chrome.tabs.update(tab.id, { active: true });
      if (tab.windowId) {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      console.log('[AutomationService] Focused existing tab:', tab.id);
      return tab;
    }

    // Create new tab
    const tab = await chrome.tabs.create({ url, active: true });
    console.log('[AutomationService] Created new tab:', tab.id);
    return tab;
  }

  /**
   * Inject content script into tab
   *
   * @param tabId Tab ID
   * @param scriptPath Path to content script
   */
  async injectContentScript(tabId: number, scriptPath: string): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [scriptPath],
      });
      console.log('[AutomationService] Content script injected:', scriptPath);
    } catch (error) {
      console.error('[AutomationService] Failed to inject content script:', error);
      throw new Error(`Content script injection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
