/**
 * Hooks Barrel Export
 *
 * Centralized export for all custom hooks.
 * Makes imports cleaner and easier to manage.
 *
 * @example
 * // Instead of:
 * import { useErrorHandler } from '@src/hooks/use-error-handler';
 * import { useScriptOperations } from '@src/hooks/use-script-operations';
 *
 * // Use:
 * import { useErrorHandler, useScriptOperations } from '@src/hooks';
 */

// Error handling
export { useErrorHandler } from './use-error-handler';
export type { UseErrorHandlerOptions, UseErrorHandlerReturn } from './use-error-handler';

// Script operations
export { useScriptOperations } from './use-script-operations';
export type { UseScriptOperationsReturn } from './use-script-operations';

// Scene navigation
export { useSceneNavigation } from './use-scene-navigation';
export type { UseSceneNavigationReturn, SceneInfo } from './use-scene-navigation';

// Asset cleanup
export { useAssetCleanup, useAssetTypeCleanup } from './use-asset-cleanup';

// Existing hooks (re-export for convenience)
export { useAssets } from './use-assets';
export { ASSET_EVENTS } from './use-assets';
export { useScriptGeneration } from './use-script-generation';
export { useStoreHydration } from './use-store-hydration';
