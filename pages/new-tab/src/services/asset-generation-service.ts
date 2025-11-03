/**
 * Asset Generation Service
 *
 * Purpose: Handle asset generation workflows (image, video, audio)
 * Responsibilities:
 * - Call background API for generation
 * - Convert data formats (data URL → Blob)
 * - Store assets in database
 * - Dispatch events for UI updates
 * - Error handling and retry logic
 *
 * Benefits:
 * - Single place for all asset generation logic
 * - Easy to test (mock background API and repository)
 * - Separation of concerns (UI doesn't know about DB)
 * - Reusable across components
 */

import {
  generateSceneImage as backgroundGenerateSceneImage,
  generateSceneVideo as backgroundGenerateSceneVideo,
} from './background-api';
import { imageRepository, videoRepository } from './repositories';
import type { AspectRatio } from '@src/types';

/**
 * Asset events for UI updates
 */
const ASSET_EVENTS = {
  CHANGED: 'assets-changed',
  IMAGE_GENERATED: 'image-generated',
  VIDEO_GENERATED: 'video-generated',
  AUDIO_GENERATED: 'audio-generated',
} as const;

/**
 * Dispatch asset change event
 * Components can listen to this for auto-refresh
 */
const dispatchAssetEvent = (eventType: keyof typeof ASSET_EVENTS, detail?: unknown): void => {
  window.dispatchEvent(
    new CustomEvent(ASSET_EVENTS[eventType], {
      detail,
    }),
  );
};

/**
 * Convert data URL to Blob
 * Example: "data:image/jpeg;base64,..." → Blob
 */
const dataUrlToBlob = (dataUrl: string): Blob => {
  const parts = dataUrl.split(',');
  const mimeType = parts[0].match(/:(.*?);/)?.[1];
  const b64 = atob(parts[1]);
  let n = b64.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = b64.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mimeType });
};

/**
 * Convert Blob to base64 data URL
 * Useful for video startImage feature
 */
const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/**
 * Image generation parameters
 */
interface GenerateImageParams {
  prompt: string;
  negativePrompt: string;
  modelName: string;
  aspectRatio: AspectRatio;
  apiKey: string;
  scriptId: number;
}

/**
 * Video generation parameters
 */
interface GenerateVideoParams {
  prompt: string;
  modelName: string;
  aspectRatio: AspectRatio;
  apiKey: string;
  scriptId: number;
  startImage?: {
    mimeType: string;
    data: string;
  };
}

/**
 * Asset generation result
 */
interface GenerateAssetResult {
  assetId: number;
  success: boolean;
}

/**
 * Asset Generation Service
 * Handles all asset generation workflows
 */
class AssetGenerationService {
  /**
   * Generate scene image
   * @returns Image ID from database
   */
  async generateImage(params: GenerateImageParams): Promise<number> {
    try {
      // 1. Call background API to generate image
      const { imageUrl } = await backgroundGenerateSceneImage({
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        aspectRatio: params.aspectRatio,
        apiKey: params.apiKey,
        modelName: params.modelName,
      });

      // 2. Convert data URL to Blob
      const imgBlob = dataUrlToBlob(imageUrl);

      // 3. Store in database
      const imageId = await imageRepository.add(imgBlob, params.scriptId);

      // 4. Dispatch event for UI update
      dispatchAssetEvent('IMAGE_GENERATED', { imageId, scriptId: params.scriptId });
      dispatchAssetEvent('CHANGED');

      return imageId;
    } catch (error) {
      console.error('[AssetGenerationService] Image generation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Không thể tạo ảnh');
    }
  }

  /**
   * Generate scene video
   * @returns Video ID from database
   */
  async generateVideo(params: GenerateVideoParams): Promise<number> {
    try {
      // 1. Call background API to generate video
      const { videoUrl } = await backgroundGenerateSceneVideo({
        prompt: params.prompt,
        aspectRatio: params.aspectRatio,
        apiKey: params.apiKey,
        modelName: params.modelName,
      });

      // 2. Convert data URL to Blob
      const videoBlob = dataUrlToBlob(videoUrl);

      // 3. Store in database
      const videoId = await videoRepository.add(videoBlob, params.scriptId);

      // 4. Dispatch event for UI update
      dispatchAssetEvent('VIDEO_GENERATED', { videoId, scriptId: params.scriptId });
      dispatchAssetEvent('CHANGED');

      return videoId;
    } catch (error) {
      console.error('[AssetGenerationService] Video generation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Không thể tạo video');
    }
  }

  /**
   * Cancel generation (placeholder for future implementation)
   * Will need to integrate with background API cancellation
   */
  cancelGeneration(): void {
    // TODO: Implement cancellation logic when background API supports it
    console.warn('[AssetGenerationService] Cancellation not yet implemented');
  }
}

/**
 * Singleton instance
 * Use this throughout the application
 */
const assetGenerationService = new AssetGenerationService();

export type { GenerateImageParams, GenerateVideoParams, GenerateAssetResult };
export { ASSET_EVENTS, AssetGenerationService, assetGenerationService, dataUrlToBlob, blobToBase64 };
