import {
  handleGenerateScript,
  handleSuggestPlotPoints,
  handleGenerateSceneImage,
  handleEnhanceText,
  handleGenerateSceneVideo,
  handleTestGeminiConnection,
} from './gemini-api-handler';
import { handleAutoFillGeminiPrompt } from './gemini-automation-handler';
import { handlePrimeGeminiWithSchema, handleGenerateScriptFromPrompt } from './gemini-handler';
import { handleOpenExtensionPage } from './page-opener-handler';
import { handleSaveGeneratedScript, handleCloseCurrentTab } from './script-automation-handler';
import { handleGetSettings, handleSaveSettings } from './settings-handler';
import { handleCreateVbeeProject, handleGetVbeeProjectStatus } from './vbee-api-handler';
import type { BackgroundMessage, BackgroundResponse } from './types/messages';

/**
 * A mapping of message actions to their corresponding handler functions.
 * This allows for a scalable way to add new background tasks.
 */
type MessageHandler = (message: BackgroundMessage, sender: chrome.runtime.MessageSender) => Promise<BackgroundResponse>;

const messageRoutes: { [key: string]: MessageHandler } = {
  // Gemini Actions (UI Automation) - legacy handlers
  PRIME_GEMINI_WITH_SCHEMA: handlePrimeGeminiWithSchema as unknown as MessageHandler,
  GENERATE_SCRIPT_FROM_PROMPT: handleGenerateScriptFromPrompt as unknown as MessageHandler,

  // Gemini API Actions
  GENERATE_SCRIPT: handleGenerateScript as unknown as MessageHandler,
  SUGGEST_PLOT_POINTS: handleSuggestPlotPoints as unknown as MessageHandler,
  GENERATE_SCENE_IMAGE: handleGenerateSceneImage as unknown as MessageHandler,
  ENHANCE_TEXT: handleEnhanceText as unknown as MessageHandler,
  GENERATE_SCENE_VIDEO: handleGenerateSceneVideo as unknown as MessageHandler,
  TEST_GEMINI_CONNECTION: handleTestGeminiConnection as unknown as MessageHandler,

  // Browser Automation Actions
  AUTO_FILL_GEMINI_PROMPT: handleAutoFillGeminiPrompt as unknown as MessageHandler,

  // Script Automation Actions
  SAVE_GENERATED_SCRIPT: handleSaveGeneratedScript as unknown as MessageHandler,
  CLOSE_CURRENT_TAB: handleCloseCurrentTab as unknown as MessageHandler,

  // Page Navigation Actions
  OPEN_EXTENSION_PAGE: handleOpenExtensionPage as unknown as MessageHandler,

  // Settings Actions
  GET_SETTINGS: handleGetSettings as unknown as MessageHandler,
  SAVE_SETTINGS: handleSaveSettings as unknown as MessageHandler,

  // Vbee API Actions
  CREATE_VBEE_PROJECT: handleCreateVbeeProject as unknown as MessageHandler,
  GET_VBEE_PROJECT_STATUS: handleGetVbeeProjectStatus as unknown as MessageHandler,
};

/**
 * Initializes the main message listener for the background script.
 * It delegates incoming messages to the appropriate handler based on the 'action' property.
 */
export const initializeMessageRouter = () => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Router] Received message:', message.type || message.action, message);
    const handler = messageRoutes[message.type || message.action]; // Support both 'type' and 'action'
    if (handler) {
      console.log('[Router] Found handler for:', message.type || message.action);
      Promise.resolve(handler(message, sender))
        .then(response => {
          console.log('[Router] Handler response:', response);
          sendResponse(response);
        })
        .catch(error => {
          console.error(`Error in message handler for ${message.type || message.action}:`, error);
          sendResponse({ success: false, error: { message: error.message } });
        });
      return true; // Indicate that the response will be sent asynchronously.
    }
    console.warn('[Router] No handler found for:', message.type || message.action);
    return false; // Explicitly return false if no handler is found.
  });
  console.log('Message router initialized.');
};
