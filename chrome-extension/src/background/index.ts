/**
 * Background Service Worker Entry Point
 *
 * REFACTORED ARCHITECTURE (Phase 1-3 Complete):
 * - Dependency Injection with DIContainer
 * - Service Layer (Gemini, Settings, Vbee, PageOpener)
 * - Handler Layer (BaseHandler pattern with automatic error handling)
 * - Type-safe MessageRouter (no more type casting!)
 *
 * Old files preserved for reference:
 * - gemini-api-handler.ts (→ services/gemini-ai-service.ts)
 * - settings-handler.ts (→ services/chrome-settings-service.ts)
 * - vbee-api-handler.ts (→ services/vbee-tts-service.ts)
 * - router.ts (→ core/router.ts)
 */

import 'webextension-polyfill';
import { container } from './core/di-container';
import { router, initializeMessageRouter } from './core/router';
import { EnhanceTextHandler } from './handlers/enhance-text-handler';
import { GenerateImageHandler } from './handlers/generate-image-handler';
import { GenerateScriptHandler } from './handlers/generate-script-handler';
import { GenerateVideoHandler } from './handlers/generate-video-handler';
import { GetSettingsHandler, SaveSettingsHandler } from './handlers/settings-handlers';
import { SuggestPlotsHandler } from './handlers/suggest-plots-handler';
import { VbeeCreateProjectHandler } from './handlers/vbee-create-project-handler';
import { VbeeGetProjectStatusHandler } from './handlers/vbee-get-project-status-handler';
import { ChromeSettingsService } from './services/chrome-settings-service';
import { GeminiAIService } from './services/gemini-ai-service';
import { PageOpenerService } from './services/page-opener-service';
import { VbeeTTSService } from './services/vbee-tts-service';
import { initializeVbeeTokenListener } from './vbee-token-handler';

/**
 * Initialize Dependency Injection Container
 *
 * Register all services as singletons for reuse across handlers.
 * Services are instantiated lazily on first resolve().
 */
const initializeServices = (): void => {
  console.log('[Background] Registering services...');

  // Core services
  container.registerSingleton('aiService', () => new GeminiAIService());
  container.registerSingleton('settingsService', () => new ChromeSettingsService());
  container.registerSingleton('ttsService', () => new VbeeTTSService());
  container.registerSingleton('pageOpenerService', () => new PageOpenerService());

  console.log('[Background] Services registered:', ['aiService', 'settingsService', 'ttsService', 'pageOpenerService']);
};

/**
 * Initialize Message Handlers
 *
 * Create handler instances with injected dependencies.
 * Register handlers with router for automatic message routing.
 */
const initializeHandlers = (): void => {
  console.log('[Background] Registering handlers...');

  // Resolve services from container
  const aiService = container.resolve<GeminiAIService>('aiService');
  const settingsService = container.resolve<ChromeSettingsService>('settingsService');
  const ttsService = container.resolve<VbeeTTSService>('ttsService');

  // Create handlers with DI
  const generateScriptHandler = new GenerateScriptHandler(aiService, settingsService);
  const generateImageHandler = new GenerateImageHandler(aiService, settingsService);
  const generateVideoHandler = new GenerateVideoHandler(aiService, settingsService);
  const enhanceTextHandler = new EnhanceTextHandler(aiService, settingsService);
  const suggestPlotsHandler = new SuggestPlotsHandler(aiService, settingsService);

  const vbeeCreateProjectHandler = new VbeeCreateProjectHandler(ttsService, settingsService);
  const vbeeGetProjectStatusHandler = new VbeeGetProjectStatusHandler(ttsService, settingsService);

  const getSettingsHandler = new GetSettingsHandler(settingsService);
  const saveSettingsHandler = new SaveSettingsHandler(settingsService);

  // Register with router
  router.register('GENERATE_SCRIPT', generateScriptHandler);
  router.register('GENERATE_SCENE_IMAGE', generateImageHandler);
  router.register('GENERATE_SCENE_VIDEO', generateVideoHandler);
  router.register('ENHANCE_TEXT', enhanceTextHandler);
  router.register('SUGGEST_PLOT_POINTS', suggestPlotsHandler);

  router.register('CREATE_VBEE_PROJECT', vbeeCreateProjectHandler);
  router.register('GET_VBEE_PROJECT_STATUS', vbeeGetProjectStatusHandler);

  router.register('GET_SETTINGS', getSettingsHandler);
  router.register('SAVE_SETTINGS', saveSettingsHandler);

  console.log('[Background] Handlers registered:', [
    'GENERATE_SCRIPT',
    'GENERATE_SCENE_IMAGE',
    'GENERATE_SCENE_VIDEO',
    'ENHANCE_TEXT',
    'SUGGEST_PLOT_POINTS',
    'CREATE_VBEE_PROJECT',
    'GET_VBEE_PROJECT_STATUS',
    'GET_SETTINGS',
    'SAVE_SETTINGS',
  ]);
};

/**
 * Main entry point for background service worker
 *
 * Initialization order:
 * 1. Register services in DI container
 * 2. Create and register handlers
 * 3. Initialize message router (chrome.runtime.onMessage listener)
 * 4. Initialize legacy Vbee token listener
 */
const main = (): void => {
  console.log('[Background] Service worker starting...');
  console.log('[Background] Architecture: DI + Services + BaseHandler + Type-safe Router');

  try {
    initializeServices();
    initializeHandlers();
    initializeMessageRouter(router);
    initializeVbeeTokenListener();

    console.log('[Background] ✅ All modules initialized successfully');
  } catch (error) {
    console.error('[Background] ❌ Initialization failed:', error);
    throw error;
  }
};

main();
