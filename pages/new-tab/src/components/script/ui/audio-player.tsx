import { useAudioPlayerStore } from '@src/stores/use-audio-player-store';
import { useEffect, useRef } from 'react';

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentObjectUrl = useRef<string | null>(null);
  const { playingSource, isPlaying, setPlaying, pause, setLoading } = useAudioPlayerStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Dọn dẹp Object URL cũ nếu nguồn phát thay đổi
    if (currentObjectUrl.current && currentObjectUrl.current !== playingSource) {
      URL.revokeObjectURL(currentObjectUrl.current);
      currentObjectUrl.current = null;
    }

    // Gán nguồn phát mới
    if (playingSource && audio.src !== playingSource) {
      audio.src = playingSource;
      if (playingSource.startsWith('blob:')) {
        currentObjectUrl.current = playingSource;
      }
    }

    // Xử lý play/pause
    if (isPlaying) {
      void audio.play().catch(() => {
        pause(); // Tự động pause nếu không thể phát
      });
    } else {
      audio.pause();
    }

    // Event listeners
    const handleEnded = () => setPlaying(false);
    const handleCanPlay = () => setLoading(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [playingSource, isPlaying, setPlaying, pause, setLoading]);

  return (
    <audio ref={audioRef}>
      {/* Add a track for accessibility. This is a placeholder as we don't have the caption file. */}
      <track kind="captions" />
    </audio>
  );
};

export default AudioPlayer;
