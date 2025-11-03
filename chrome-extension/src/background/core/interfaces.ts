/**
 * Service interfaces implementing Dependency Inversion Principle
 * High-level modules depend on abstractions, not concrete implementations
 */

import type { AspectRatio, ScriptStory } from '../types/messages';

/**
 * AI Service interface - abstracts the AI provider implementation
 * Allows easy swapping between Gemini, OpenAI, Claude, etc.
 */
/**
 * Parameter types for IAIService methods
 */
export interface GenerateScriptParams {
  apiKey: string;
  prompt: string;
  language: string;
  modelName: string;
  systemInstruction?: string;
  temperature: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  customSchema?: unknown;
}

export interface GenerateImageParams {
  apiKey: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  modelName: string;
}

export interface GenerateVideoParams {
  apiKey: string;
  prompt: string;
  aspectRatio: AspectRatio;
  modelName: string;
  startImage?: {
    data: string;
    mimeType: string;
  };
}

export interface EnhanceTextParams {
  apiKey: string;
  text: string;
  context: string;
  modelName: string;
}

export interface SuggestPlotsParams {
  apiKey: string;
  genre: string;
  tone: string;
  context?: string;
  count?: number;
  modelName: string;
}

export interface IAIService {
  generateScript(params: GenerateScriptParams): Promise<ScriptStory>;

  generateImage(params: GenerateImageParams): Promise<{ imageUrl: string; mimeType: string }>;

  generateVideo(params: GenerateVideoParams): Promise<{ videoUrl: string }>;

  enhanceText(params: EnhanceTextParams): Promise<string>;

  suggestPlotPoints(params: SuggestPlotsParams): Promise<string[]>;

  testConnection(apiKey: string): Promise<{ valid: boolean; model?: string }>;
}

/**
 * Application settings structure
 */
export interface AppSettings {
  apiKeys?: {
    gemini: string;
    vbee: string;
  };
  modelSettings?: {
    scriptGeneration: string;
    plotSuggestion: string;
    imageGeneration: string;
    videoGeneration: string;
    ttsModel: string;
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
  };
  preferences?: {
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
    theme: 'light' | 'dark' | 'system';
  };
}

/**
 * Settings Service interface - abstracts storage implementation
 * Allows switching between chrome.storage, localStorage, IndexedDB, etc.
 */
export interface ISettingsService {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  getAll(): Promise<AppSettings>;
  saveAll(settings: Partial<AppSettings>): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * TTS Service interface - abstracts TTS provider
 */
export interface ITTSService {
  createProject(params: {
    title: string;
    blocks: Array<{
      id: string;
      text: string;
      voiceCode: string;
      speed?: number;
      breakTime?: number;
    }>;
    bearerToken: string;
  }): Promise<{ projectId: string }>;

  getProjectStatus(params: { projectId: string; bearerToken: string }): Promise<{
    status: string;
    progress?: number;
    audioUrl?: string;
  }>;
}

/**
 * Page Opener Service interface - abstracts navigation
 */
export interface IPageOpenerService {
  openOptionsPage(): Promise<void>;
  openSidePanel(): Promise<void>;
  openNewTab(url?: string): Promise<void>;
  openPopup(): Promise<void>;
  openExtensionPage(params: {
    page: string;
    newWindow?: boolean;
    windowOptions?: {
      type?: 'normal' | 'popup';
      width?: number;
      height?: number;
      left?: number;
      top?: number;
    };
  }): Promise<{ tabId?: number; windowId?: number }>;
  closeCurrentTab(): Promise<void>;
}

/**
 * Automation Service interface - browser automation
 */
export interface IAutomationService {
  autoFillGeminiPrompt(params: {
    prompt: string;
    autoSend?: boolean;
    typingDelay?: number;
  }): Promise<{ success: boolean }>;
  findOrCreateTab(url: string): Promise<chrome.tabs.Tab>;
  injectContentScript(tabId: number, scriptPath: string): Promise<void>;
}

/**
 * Script Service interface - database operations via messaging
 */
export interface IScriptService {
  saveGeneratedScript(scriptJSON: string): Promise<{ scriptId: number }>;
}
