import type { Scene } from '@src/types';

/**
 * Default Scene Template
 * Used as fallback when creating new scenes without previous scene context
 */
const DEFAULT_SCENE_TEMPLATE: Omit<Scene, 'scene_number' | 'actIndex' | 'sceneIndex'> = {
  time: 'Ngày',
  location: 'Địa điểm mới',
  action: 'Mô tả hành động và diễn biến cảnh',
  visual_style: 'Cinematic lighting, warm tones',
  audio_style: 'Ambient background music',
  dialogues: [],
};

export { DEFAULT_SCENE_TEMPLATE };
