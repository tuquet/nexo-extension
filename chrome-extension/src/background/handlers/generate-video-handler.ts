import { BaseHandler } from '../core/base-handler';
import type { IAIService, ISettingsService } from '../core/interfaces';
import type { GeminiGenerateSceneVideoMessage } from '../types/messages';

/**
 * GenerateVideoHandler - Handles scene video generation
 *
 * Uses Veo API through AI service.
 * Includes polling mechanism for long-running operations.
 */
export class GenerateVideoHandler extends BaseHandler<GeminiGenerateSceneVideoMessage, { videoUrl: string }> {
  constructor(
    private readonly aiService: IAIService,
    private readonly settingsService: ISettingsService,
  ) {
    super();
  }

  protected async execute(message: GeminiGenerateSceneVideoMessage): Promise<{ videoUrl: string }> {
    const { payload } = message;
    const settings = await this.settingsService.getAll();

    const apiKey = payload.apiKey || settings.apiKeys?.gemini || '';
    const modelName = payload.modelName || settings.modelSettings?.videoGeneration || 'veo-2.0-generate-001';

    return this.aiService.generateVideo({
      apiKey,
      prompt: payload.prompt,
      aspectRatio: payload.aspectRatio,
      modelName,
      startImage: payload.startImage,
    });
  }
}
