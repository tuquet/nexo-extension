/**
 * Background handler for script automation tasks
 * Handles saving generated scripts and closing tabs
 */

import type { BaseResponse } from './types/messages';

/**
 * Save generated script to IndexedDB
 * This handler receives JSON from content script and saves it to the database
 */
export const handleSaveGeneratedScript = async (message: {
  type: 'SAVE_GENERATED_SCRIPT';
  payload: { scriptJSON: string };
}): Promise<BaseResponse<{ scriptId: number }>> => {
  try {
    const { scriptJSON } = message.payload;

    // Parse JSON to validate
    const scriptData = JSON.parse(scriptJSON);

    // Send message to new-tab page (which has access to IndexedDB via db.ts)
    // We need to use chrome.runtime.sendMessage to communicate with the extension pages
    const response = await chrome.runtime.sendMessage({
      type: 'ADD_SCRIPT_TO_DB',
      payload: { script: scriptData },
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to save script to database');
    }

    console.log('[Background] Script saved successfully:', response.scriptId);

    return {
      success: true,
      data: { scriptId: response.scriptId },
    };
  } catch (error) {
    console.error('[Background] Error saving script:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'SAVE_SCRIPT_ERROR',
      },
    };
  }
};

/**
 * Close current tab
 * Used after successful automation to clean up
 */
export const handleCloseCurrentTab = async (
  message: { type: 'CLOSE_CURRENT_TAB' },
  sender: chrome.runtime.MessageSender,
): Promise<BaseResponse<void>> => {
  try {
    if (!sender.tab?.id) {
      throw new Error('No tab ID found in sender');
    }

    await chrome.tabs.remove(sender.tab.id);
    console.log('[Background] Tab closed:', sender.tab.id);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('[Background] Error closing tab:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to close tab',
        code: 'CLOSE_TAB_ERROR',
      },
    };
  }
};
