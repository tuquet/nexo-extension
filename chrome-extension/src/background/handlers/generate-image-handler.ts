import { BaseHandler } from '../core/base-handler';
import type { IAIService, ISettingsService } from '../core/interfaces';
import type { GeminiGenerateSceneImageMessage } from '../types/messages';

/**
 * GenerateImageHandler - Handles scene image generation
 *
 * Extends BaseHandler for automatic error handling.
 * Uses AI service for Imagen API calls.
 */
export class GenerateImageHandler extends BaseHandler<
  GeminiGenerateSceneImageMessage,
  { imageUrl: string; mimeType: string }
> {
  constructor(
    private readonly aiService: IAIService,
    private readonly settingsService: ISettingsService,
  ) {
    super();
  }

  protected async execute(message: GeminiGenerateSceneImageMessage): Promise<{ imageUrl: string; mimeType: string }> {
    const { payload } = message;
    const settings = await this.settingsService.getAll();

    const apiKey = payload.apiKey || settings.apiKeys?.gemini || '';
    const modelName = payload.modelName || settings.modelSettings?.imageGeneration || 'imagen-3.0-generate-001';

    return this.aiService.generateImage({
      apiKey,
      prompt: payload.prompt,
      negativePrompt: payload.negativePrompt,
      aspectRatio: payload.aspectRatio,
      modelName,
    });
  }
}
