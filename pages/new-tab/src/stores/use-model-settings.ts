import { AVAILABLE_IMAGE_MODELS, AVAILABLE_TEXT_MODELS, AVAILABLE_VIDEO_MODELS } from '@extension/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ModelSettingsState {
  model: string;
  temperature: number;
  topP: number;
  imageModel: string;
  videoModel: string;
  ttsModel: string;
  setModel: (model: string) => void;
  setTemperature: (temperature: number) => void;
  setTopP: (topP: number) => void;
  setImageModel: (imageModel: string) => void;
  setVideoModel: (videoModel: string) => void;
  setTtsModel: (ttsModel: string) => void;
}

export const useModelSettings = create<ModelSettingsState>()(
  persist(
    set => ({
      model: AVAILABLE_TEXT_MODELS[0]?.value || 'gemini-1.5-flash',
      temperature: 0.7,
      topP: 0.95,
      imageModel: AVAILABLE_IMAGE_MODELS[0]?.value || '',
      videoModel: AVAILABLE_VIDEO_MODELS[0]?.value || '',
      ttsModel: '',
      setModel: model => set({ model }),
      setTemperature: temperature => set({ temperature }),
      setTopP: topP => set({ topP }),
      setImageModel: imageModel => set({ imageModel }),
      setVideoModel: videoModel => set({ videoModel }),
      setTtsModel: ttsModel => set({ ttsModel }),
    }),
    { name: 'cinegenie-model-settings' },
  ),
);
