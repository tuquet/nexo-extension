import { BaseHandler } from '../core/base-handler';
import type { IAutomationService, ISettingsService } from '../core/interfaces';
import type { AutoFillGeminiPromptMessage } from '../types/messages';

/**
 * AutoFillPromptHandler - Handles browser automation for Gemini AI Studio
 *
 * Auto-fills prompts into Google AI Studio interface.
 */
export class AutoFillPromptHandler extends BaseHandler<AutoFillGeminiPromptMessage, { success: boolean }> {
  constructor(
    private readonly automationService: IAutomationService,
    private readonly settingsService: ISettingsService,
  ) {
    super();
  }

  protected async execute(message: AutoFillGeminiPromptMessage): Promise<{ success: boolean }> {
    const { prompt, autoSend = false } = message.payload;

    // Default typing delay (preferences.typingDelay not yet in schema)
    const typingDelay = 50;

    return this.automationService.autoFillGeminiPrompt({
      prompt,
      autoSend,
      typingDelay,
    });
  }
}
