/**
 * Message protocol types for communication between UI pages and background service worker.
 * This provides type-safe messaging for all background API operations.
 */

// ============================================================================
// Shared Types (duplicated from new-tab to avoid circular dependencies)
// ============================================================================

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export interface ScriptStory {
  id?: number;
  title: string;
  genre: string[];
  alias: string;
  logline: string;
  tone: string;
  notes: string;
  setting: Setting;
  themes: string[];
  characters: Character[];
  acts: Act[];
  buildMeta?: BuildMeta | null;
  titleImage?: string;
}

export interface Act {
  act_number: number;
  scenes: Scene[];
  summary: string;
}

export interface Scene {
  scene_number: number;
  time: string;
  location: string;
  action: string;
  audio_style: string;
  visual_style: string;
  dialogues: Dialogue[];
  generatedImageId?: number;
  isGeneratingImage?: boolean;
  generatedVideoId?: number;
  isGeneratingVideo?: boolean;
  actIndex: number;
  sceneIndex: number;
}

export interface Dialogue {
  roleId: string;
  line: string;
  projectBlockItemId?: string;
  generatedAudioId?: number;
  isGeneratingAudio?: boolean;
}

export interface Character {
  description: string;
  name: string;
  roleId: string;
}

export interface Setting {
  time: string;
  location: string;
}

export interface BuildMeta {
  vbeeProjectId?: string | number;
  fullScriptAudioId?: number;
  is_video_generated?: boolean;
  is_audio_generated?: boolean;
  is_image_generated?: boolean;
  is_transcript_generated?: boolean;
  is_video_compiled?: boolean;
  is_has_folder?: boolean;
  configs?: Record<string, unknown>;
  history?: Array<{
    at: string;
    action: string;
    status: string;
    by?: string;
    note?: string;
  }>;
  updated_at?: string;
}

export interface VbeeProjectBlockPayload {
  id: string;
  characters: number;
  speed: number;
  voice_code: string;
  break_time: number;
  text: string;
}

export interface CreateVbeeProjectPayload {
  title: string;
  product: 'TTS';
  isDeleted: boolean;
  blocks: VbeeProjectBlockPayload[];
}

export interface VbeeProjectStatusResponse {
  result: {
    project: {
      id: string;
      status: 'processing' | 'done' | 'error';
      audio_link?: string;
      blocks: Array<{
        id: string;
        audio_link: string;
      }>;
    };
  };
}

// ============================================================================
// Base Message Types
// ============================================================================

export interface BaseMessage {
  type: string;
}

export interface BaseResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// ============================================================================
// Gemini API Messages
// ============================================================================

export interface GeminiGenerateScriptMessage extends BaseMessage {
  type: 'GENERATE_SCRIPT';
  payload: {
    prompt: string;
    language: 'en-US' | 'vi-VN';
    apiKey: string;
    modelName: string;
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
  };
}

export type GeminiGenerateScriptResponse = BaseResponse<ScriptStory>;

export interface GeminiSuggestPlotPointsMessage extends BaseMessage {
  type: 'SUGGEST_PLOT_POINTS';
  payload: {
    prompt: string;
    apiKey: string;
    modelName: string;
    count: number;
  };
}

export type GeminiSuggestPlotPointsResponse = BaseResponse<string[]>;

export interface GeminiGenerateSceneImageMessage extends BaseMessage {
  type: 'GENERATE_SCENE_IMAGE';
  payload: {
    prompt: string;
    negativePrompt?: string;
    aspectRatio: AspectRatio;
    apiKey: string;
    modelName: string;
  };
}

export type GeminiGenerateSceneImageResponse = BaseResponse<{
  imageUrl: string;
  mimeType: string;
}>;

export interface GeminiEnhanceTextMessage extends BaseMessage {
  type: 'ENHANCE_TEXT';
  payload: {
    text: string;
    context: string;
    apiKey: string;
    modelName: string;
  };
}

export type GeminiEnhanceTextResponse = BaseResponse<string>;

export interface GeminiGenerateSceneVideoMessage extends BaseMessage {
  type: 'GENERATE_SCENE_VIDEO';
  payload: {
    prompt: string;
    apiKey: string;
    modelName: string;
  };
}

export type GeminiGenerateSceneVideoResponse = BaseResponse<{
  videoUrl: string;
}>;

// ============================================================================
// Vbee API Messages
// ============================================================================

export interface VbeeCreateProjectMessage extends BaseMessage {
  type: 'CREATE_VBEE_PROJECT';
  payload: {
    projectData: CreateVbeeProjectPayload;
    bearerToken: string;
  };
}

export type VbeeCreateProjectResponse = BaseResponse<{
  projectId: string;
}>;

export interface VbeeGetProjectStatusMessage extends BaseMessage {
  type: 'GET_VBEE_PROJECT_STATUS';
  payload: {
    projectId: string;
    bearerToken: string;
  };
}

export type VbeeGetProjectStatusResponse = BaseResponse<VbeeProjectStatusResponse>;

// ============================================================================
// Settings Messages
// ============================================================================

export interface AppSettings {
  geminiApiKey?: string;
  vbeeApiKey?: string;
  defaultLanguage?: 'en-US' | 'vi-VN';
  defaultVoiceCode?: string;
}

export interface GetSettingsMessage extends BaseMessage {
  type: 'GET_SETTINGS';
}

export type GetSettingsResponse = BaseResponse<AppSettings>;

export interface SaveSettingsMessage extends BaseMessage {
  type: 'SAVE_SETTINGS';
  payload: Partial<AppSettings>;
}

export type SaveSettingsResponse = BaseResponse<void>;

// ============================================================================
// Gemini UI Automation Messages (existing)
// ============================================================================

export interface PrimeGeminiMessage extends BaseMessage {
  type: 'PRIME_GEMINI_WITH_SCHEMA';
  payload: {
    apiKey: string;
    schema: object;
  };
}

export interface GenerateScriptFromPromptMessage extends BaseMessage {
  type: 'GENERATE_SCRIPT_FROM_PROMPT';
  payload: {
    prompt: string;
  };
}

// ============================================================================
// Union Types for Type Safety
// ============================================================================

export type BackgroundMessage =
  | GeminiGenerateScriptMessage
  | GeminiSuggestPlotPointsMessage
  | GeminiGenerateSceneImageMessage
  | GeminiEnhanceTextMessage
  | GeminiGenerateSceneVideoMessage
  | VbeeCreateProjectMessage
  | VbeeGetProjectStatusMessage
  | GetSettingsMessage
  | SaveSettingsMessage
  | PrimeGeminiMessage
  | GenerateScriptFromPromptMessage;

export type BackgroundResponse =
  | GeminiGenerateScriptResponse
  | GeminiSuggestPlotPointsResponse
  | GeminiGenerateSceneImageResponse
  | GeminiEnhanceTextResponse
  | GeminiGenerateSceneVideoResponse
  | VbeeCreateProjectResponse
  | VbeeGetProjectStatusResponse
  | GetSettingsResponse
  | SaveSettingsResponse
  | BaseResponse;

// ============================================================================
// Type Guards
// ============================================================================

export const isGeminiGenerateScriptMessage = (msg: BaseMessage): msg is GeminiGenerateScriptMessage =>
  msg.type === 'GENERATE_SCRIPT';

export const isGeminiSuggestPlotPointsMessage = (msg: BaseMessage): msg is GeminiSuggestPlotPointsMessage =>
  msg.type === 'SUGGEST_PLOT_POINTS';

export const isGeminiGenerateSceneImageMessage = (msg: BaseMessage): msg is GeminiGenerateSceneImageMessage =>
  msg.type === 'GENERATE_SCENE_IMAGE';

export const isGeminiEnhanceTextMessage = (msg: BaseMessage): msg is GeminiEnhanceTextMessage =>
  msg.type === 'ENHANCE_TEXT';

export const isGeminiGenerateSceneVideoMessage = (msg: BaseMessage): msg is GeminiGenerateSceneVideoMessage =>
  msg.type === 'GENERATE_SCENE_VIDEO';

export const isVbeeCreateProjectMessage = (msg: BaseMessage): msg is VbeeCreateProjectMessage =>
  msg.type === 'CREATE_VBEE_PROJECT';

export const isVbeeGetProjectStatusMessage = (msg: BaseMessage): msg is VbeeGetProjectStatusMessage =>
  msg.type === 'GET_VBEE_PROJECT_STATUS';

export const isGetSettingsMessage = (msg: BaseMessage): msg is GetSettingsMessage => msg.type === 'GET_SETTINGS';

export const isSaveSettingsMessage = (msg: BaseMessage): msg is SaveSettingsMessage => msg.type === 'SAVE_SETTINGS';
