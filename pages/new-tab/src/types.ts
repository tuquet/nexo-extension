export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export interface Root {
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
  // Optional field for generated assets
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
  // Store a reference instead of the full base64 data.
  generatedImageId?: number;
  isGeneratingImage?: boolean;
  // Additions for video generation
  generatedVideoId?: number;
  isGeneratingVideo?: boolean;
}

export interface Dialogue {
  role: 'Mentor' | 'Protagonist' | 'Narrator';
  line: string;
}

export interface Character {
  description: string;
  name: string;
  role: 'Mentor' | 'Protagonist' | 'Narrator';
}

export interface Setting {
  time: string;
  location: string;
  defaultAspectRatio?: AspectRatio; // Thêm dòng này
  defaultImageModel?: string; // Thêm dòng này
  defaultVideoModel?: string; // Thêm dòng này
}

export interface BuildMeta {
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
