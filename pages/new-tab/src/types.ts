export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export interface ScriptStory {
  id?: number; // Unique identifier for the script
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
  titleImage?: string; // Base64 string for the title image
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
  actIndex: number; // Add actIndex to scene for easier access
  sceneIndex: number; // Add sceneIndex to scene for easier access
}

export interface Dialogue {
  roleId: string;
  line: string;
  projectBlockItemId?: string; // To map with Vbee's response
  generatedAudioId?: number; // The ID of the audio in IndexedDB
  isGeneratingAudio?: boolean; // To show loading state
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
    at: string; // ISO timestamp
    action: string;
    status: string;
    by?: string;
    note?: string;
  }>;
  updated_at?: string;
}
