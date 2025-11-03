import { BaseHandler } from '../core/base-handler';
import type { IAIService, ISettingsService } from '../core/interfaces';
import type { GeminiSuggestPlotPointsMessage } from '../types/messages';

/**
 * SuggestPlotsHandler - Handles plot point suggestion requests
 *
 * Generates creative plot suggestions based on genre/tone.
 */
export class SuggestPlotsHandler extends BaseHandler<GeminiSuggestPlotPointsMessage, string[]> {
  constructor(
    private readonly aiService: IAIService,
    private readonly settingsService: ISettingsService,
  ) {
    super();
  }

  protected async execute(message: GeminiSuggestPlotPointsMessage): Promise<string[]> {
    const { payload } = message;
    const settings = await this.settingsService.getAll();

    const apiKey = payload.apiKey || settings.apiKeys?.gemini || '';
    const modelName = payload.modelName || settings.modelSettings?.plotSuggestion || 'gemini-2.5-flash';

    // Parse prompt to extract genre/tone/context if structured
    // For now, use prompt as context
    return this.aiService.suggestPlotPoints({
      apiKey,
      genre: 'general',
      tone: 'neutral',
      context: payload.prompt,
      count: payload.count || 5,
      modelName,
    });
  }
}
