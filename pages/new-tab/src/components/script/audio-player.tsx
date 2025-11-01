import { useAudioPlayerStore } from '@src/stores/use-audio-player-store';
import { useEffect, useRef } from 'react';

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { playingSource, isPlaying, setPlaying, pause, setLoading } = useAudioPlayerStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingSource) {
      if (audio.src !== playingSource) {
        audio.src = playingSource;
      }

      if (isPlaying) {
        void audio.play().catch(() => {
          // Playback failed, likely due to user not interacting with the page yet.
          // We can inform the user or just pause the state.
          pause();
        });
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
    }

    const handleEnded = () => {
      setPlaying(false);
      setLoading(false); // Reset loading state on end
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [playingSource, isPlaying, setPlaying, pause, setLoading]);

  return (
    <audio ref={audioRef}>
      {/* Add a track for accessibility. This is a placeholder as we don't have the caption file. */}
      <track kind="captions" />
    </audio>
  );
};

export default AudioPlayer;
