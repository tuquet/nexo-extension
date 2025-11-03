import type { IScriptService } from '../core/interfaces';

/**
 * ScriptService - Database operations via messaging
 *
 * Background service worker cannot directly access IndexedDB from new-tab page.
 * This service sends messages to new-tab page which has access to db.ts.
 *
 * @example
 * ```typescript
 * const service = new ScriptService();
 * const { scriptId } = await service.saveGeneratedScript(jsonString);
 * ```
 */
export class ScriptService implements IScriptService {
  /**
   * Save generated script to IndexedDB
   *
   * Sends message to new-tab page to save script using db.ts.
   *
   * @param scriptJSON JSON string of script data
   * @returns Script ID from database
   */
  async saveGeneratedScript(scriptJSON: string): Promise<{ scriptId: number }> {
    // Parse JSON to validate
    const scriptData = JSON.parse(scriptJSON);

    // Send message to new-tab page (which has access to IndexedDB via db.ts)
    const response = await chrome.runtime.sendMessage({
      type: 'ADD_SCRIPT_TO_DB',
      payload: { script: scriptData },
    });

    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to save script to database');
    }

    console.log('[ScriptService] Script saved successfully:', response.scriptId);

    return { scriptId: response.scriptId };
  }
}
