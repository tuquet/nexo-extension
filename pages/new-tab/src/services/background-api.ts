/**
 * Background API Wrapper for New Tab
 * Provides type-safe methods to communicate with background service worker
 * All API calls are proxied through chrome.runtime.sendMessage
 */

import type {
  BackgroundMessage,
  BackgroundResponse,
  BaseResponse,
  GeminiGenerateScriptMessage,
  GeminiSuggestPlotPointsMessage,
  GeminiEnhanceTextMessage,
  GeminiGenerateSceneImageMessage,
  GeminiGenerateSceneVideoMessage,
  VbeeCreateProjectMessage,
  VbeeGetProjectStatusMessage,
  GetSettingsMessage,
  SaveSettingsMessage,
  ScriptStory,
  VbeeProjectStatusResponse,
  AppSettings,
  CreateVbeeProjectPayload,
  AspectRatio,
} from '../../../../chrome-extension/src/background/types/messages';

/**
 * Send a message to the background service worker and wait for response
 */
const sendMessage = <T extends BackgroundMessage>(message: T): Promise<BackgroundResponse> =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response: BackgroundResponse) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });

/**
 * Helper to unwrap BaseResponse and throw on error
 */
const unwrapResponse = <T>(response: BaseResponse<T>): T => {
  if (response.success && response.data !== undefined) {
    return response.data;
  }
  throw new Error(response.error?.message || 'Unknown error');
};

// ============================================================================
// Gemini API Methods
// ============================================================================

export const backgroundAPI = {
  /**
   * Generate a complete script from a prompt
   */
  generateScript: async (params: {
    prompt: string;
    language: 'en-US' | 'vi-VN';
    apiKey: string;
    modelName: string;
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
  }): Promise<ScriptStory> => {
    const message: GeminiGenerateScriptMessage = {
      type: 'GENERATE_SCRIPT',
      payload: params,
    };
    const response = await sendMessage(message);
    return unwrapResponse(response as BaseResponse<ScriptStory>);
  },

  /**
   * Generate plot point suggestions
   */
  suggestPlotPoints: async (params: {
    prompt: string;
    apiKey: string;
    modelName: string;
    count: number;
  }): Promise<string[]> => {
    const message: GeminiSuggestPlotPointsMessage = {
      type: 'SUGGEST_PLOT_POINTS',
      payload: params,
    };
    const response = await sendMessage(message);
    return unwrapResponse(response as BaseResponse<string[]>);
  },

  /**
   * Enhance/improve a piece of text
   */
  enhanceText: async (params: {
    text: string;
    context: string;
    apiKey: string;
    modelName: string;
  }): Promise<string> => {
    const message: GeminiEnhanceTextMessage = {
      type: 'ENHANCE_TEXT',
      payload: params,
    };
    const response = await sendMessage(message);
    return unwrapResponse(response as BaseResponse<string>);
  },

  /**
   * Generate an image for a scene
   * @note Currently not implemented in background
   */
  generateSceneImage: async (params: {
    prompt: string;
    negativePrompt?: string;
    aspectRatio: AspectRatio;
    apiKey: string;
    modelName: string;
  }): Promise<{ imageUrl: string; mimeType: string }> => {
    const message: GeminiGenerateSceneImageMessage = {
      type: 'GENERATE_SCENE_IMAGE',
      payload: params,
    };
    const response = await sendMessage(message);
    return unwrapResponse(response as BaseResponse<{ imageUrl: string; mimeType: string }>);
  },

  /**
   * Generate a video for a scene
   */
  generateSceneVideo: async (params: {
    prompt: string;
    aspectRatio: AspectRatio;
    apiKey: string;
    modelName: string;
    startImage?: {
      mimeType: string;
      data: string;
    };
  }): Promise<{ videoUrl: string }> => {
    const message: GeminiGenerateSceneVideoMessage = {
      type: 'GENERATE_SCENE_VIDEO',
      payload: params,
    };
    const response = await sendMessage(message);
    return unwrapResponse(response as BaseResponse<{ videoUrl: string }>);
  },

  // ============================================================================
  // Vbee API Methods
  // ============================================================================

  /**
   * Create a new Vbee TTS project
   */
  createVbeeProject: async (params: {
    projectData: CreateVbeeProjectPayload;
    bearerToken: string;
  }): Promise<{ projectId: string }> => {
    const message: VbeeCreateProjectMessage = {
      type: 'CREATE_VBEE_PROJECT',
      payload: params,
    };
    const response = await sendMessage(message);
    return unwrapResponse(response as BaseResponse<{ projectId: string }>);
  },

  /**
   * Get the status of a Vbee project
   */
  getVbeeProjectStatus: async (params: {
    projectId: string;
    bearerToken: string;
  }): Promise<VbeeProjectStatusResponse> => {
    const message: VbeeGetProjectStatusMessage = {
      type: 'GET_VBEE_PROJECT_STATUS',
      payload: params,
    };
    const response = await sendMessage(message);
    return unwrapResponse(response as BaseResponse<VbeeProjectStatusResponse>);
  },

  // ============================================================================
  // Settings Methods
  // ============================================================================

  /**
   * Get application settings from background
   */
  getSettings: async (): Promise<AppSettings> => {
    const message: GetSettingsMessage = {
      type: 'GET_SETTINGS',
    };
    const response = await sendMessage(message);
    return unwrapResponse(response as BaseResponse<AppSettings>);
  },

  /**
   * Save application settings to background
   */
  saveSettings: async (settings: Partial<AppSettings>): Promise<void> => {
    const message: SaveSettingsMessage = {
      type: 'SAVE_SETTINGS',
      payload: settings,
    };
    const response = await sendMessage(message);
    unwrapResponse(response as BaseResponse<void>);
  },
};

// Export individual methods for convenience
export const {
  generateScript,
  suggestPlotPoints,
  enhanceText,
  generateSceneImage,
  generateSceneVideo,
  createVbeeProject,
  getVbeeProjectStatus,
  getSettings,
  saveSettings,
} = backgroundAPI;

// Default export
export default backgroundAPI;
