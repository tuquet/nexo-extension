import { create } from 'zustand';

interface AudioPlayerState {
  playingSource: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  play: (source: string) => void;
  pause: () => void;
  togglePlay: (source: string) => void;
  setPlaying: (isPlaying: boolean) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>(set => ({
  playingSource: null,
  isPlaying: false,
  isLoading: false,
  play: source => set({ playingSource: source, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: source =>
    set(state => {
      const isSameSource = state.playingSource === source;
      if (isSameSource) {
        // Toggle play/pause for the same source
        return { isPlaying: !state.isPlaying };
      } else {
        // Play new source
        return { playingSource: source, isPlaying: true, isLoading: false }; // isLoading sẽ được quản lý bởi component gọi
      }
    }),
  setPlaying: isPlaying => set({ isPlaying }),
  setLoading: isLoading => set({ isLoading }),
}));
