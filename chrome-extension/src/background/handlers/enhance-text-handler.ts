import { BaseHandler } from '../core/base-handler';
import type { IAIService, ISettingsService } from '../core/interfaces';
import type { GeminiEnhanceTextMessage } from '../types/messages';

/**
 * EnhanceTextHandler - Handles text enhancement/rewriting
 *
 * Uses AI to improve script text quality.
 */
export class EnhanceTextHandler extends BaseHandler<GeminiEnhanceTextMessage, string> {
  constructor(
    private readonly aiService: IAIService,
    private readonly settingsService: ISettingsService,
  ) {
    super();
  }

  protected async execute(message: GeminiEnhanceTextMessage): Promise<string> {
    const { payload } = message;
    const settings = await this.settingsService.getAll();

    const apiKey = payload.apiKey || settings.apiKeys?.gemini || '';
    const modelName = payload.modelName || settings.modelSettings?.scriptGeneration || 'gemini-2.5-flash';

    return this.aiService.enhanceText({
      apiKey,
      text: payload.text,
      context: payload.context,
      modelName,
    });
  }
}
