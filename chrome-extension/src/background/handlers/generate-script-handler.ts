import { BaseHandler } from '../core/base-handler';
import type { IAIService, ISettingsService } from '../core/interfaces';
import type { GeminiGenerateScriptMessage, ScriptStory } from '../types/messages';

/**
 * GenerateScriptHandler - Handles script generation requests
 *
 * Extends BaseHandler to get automatic error handling.
 * Uses DI to receive AI and Settings services.
 *
 * @example
 * ```typescript
 * const handler = new GenerateScriptHandler(aiService, settingsService);
 * const response = await handler.handle(message);
 * ```
 */
export class GenerateScriptHandler extends BaseHandler<GeminiGenerateScriptMessage, ScriptStory> {
  constructor(
    private readonly aiService: IAIService,
    private readonly settingsService: ISettingsService,
  ) {
    super();
  }

  /**
   * Execute script generation
   *
   * Retrieves settings, merges with message payload, calls AI service.
   * Template method - error handling done by BaseHandler.
   */
  protected async execute(message: GeminiGenerateScriptMessage): Promise<ScriptStory> {
    const { payload } = message;

    // Get stored settings with defaults
    const settings = await this.settingsService.getAll();

    // Merge message payload with stored settings
    const apiKey = payload.apiKey || settings.apiKeys?.gemini || '';
    const modelName = payload.modelName || settings.modelSettings?.scriptGeneration || 'gemini-2.5-flash';
    const temperature = payload.temperature ?? settings.modelSettings?.temperature ?? 1.2;
    const topP = payload.topP ?? settings.modelSettings?.topP ?? 0.95;
    const topK = payload.topK ?? settings.modelSettings?.topK ?? 50;
    const maxOutputTokens = payload.maxOutputTokens ?? settings.modelSettings?.maxOutputTokens ?? 8192;

    // Call AI service
    return this.aiService.generateScript({
      apiKey,
      prompt: payload.prompt,
      language: payload.language,
      modelName,
      temperature,
      topP,
      topK,
      maxOutputTokens,
      systemInstruction: payload.systemInstruction,
      customSchema: payload.customSchema,
    });
  }
}
