/**
 * Shared type definitions for script generation flow
 * Centralized to avoid duplication across components
 */

export type AIPlatform = 'aistudio' | 'gemini-web';

export interface GenerationFormData {
  prompt: string;
  language: 'en-US' | 'vi-VN';
  scriptModel: string;
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  systemInstruction?: string;
  platform?: AIPlatform; // For automate mode: which platform to use
}

export interface ScriptImportData {
  jsonString?: string;
  file?: File;
}

export type ScriptCreationMode = 'api' | 'automate' | 'import-json' | 'import-file';

export interface FormValidationError {
  field: string;
  message: string;
}

export interface AsyncOperationState<T = unknown> {
  isLoading: boolean;
  error: string | null;
  data: T | null;
}

// Discriminated union for form state
export type FormState =
  | { status: 'idle' }
  | { status: 'validating' }
  | { status: 'submitting'; mode: ScriptCreationMode }
  | { status: 'success'; scriptId: string }
  | { status: 'error'; error: string };
