/**
 * Asset Cleanup Hook
 *
 * Purpose: Memory management for asset URLs
 * Responsibilities:
 * - Revoke object URLs on unmount
 * - Clean up blob URLs
 * - Prevent memory leaks
 *
 * Benefits:
 * - Automatic cleanup (no manual revocation needed)
 * - Prevents memory leaks from accumulated URLs
 * - Simple API
 */

import { imageRepository, videoRepository, audioRepository } from '@src/services/repositories';
import { useEffect } from 'react';

/**
 * Hook for automatic asset URL cleanup
 *
 * Cleans up all cached object URLs when component unmounts
 * to prevent memory leaks.
 *
 * @example
 * ```typescript
 * const MyComponent = () => {
 *   // Automatically cleans up URLs on unmount
 *   useAssetCleanup();
 *
 *   // Use repositories normally
 *   const imageUrl = await imageRepository.getAsUrl(imageId);
 *
 *   return <img src={imageUrl} />;
 * };
 * ```
 */
const useAssetCleanup = (): void => {
  useEffect(
    () =>
      // Cleanup function runs on unmount
      () => {
        imageRepository.cleanup();
        videoRepository.cleanup();
        audioRepository.cleanup();
      },
    [],
  );
};

/**
 * Hook for cleanup of specific asset type
 *
 * @param type Asset type to clean up
 *
 * @example
 * ```typescript
 * // Only clean up images in this component
 * useAssetTypeCleanup('image');
 * ```
 */
const useAssetTypeCleanup = (type: 'image' | 'video' | 'audio'): void => {
  useEffect(
    () => () => {
      switch (type) {
        case 'image':
          imageRepository.cleanup();
          break;
        case 'video':
          videoRepository.cleanup();
          break;
        case 'audio':
          audioRepository.cleanup();
          break;
      }
    },
    [type],
  );
};

export { useAssetCleanup, useAssetTypeCleanup };
