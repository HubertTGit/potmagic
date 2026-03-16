import { useEffect, useRef, useState } from 'react';
import { RoomEvent } from 'livekit-client';
import type { Room } from 'livekit-client';

interface SoundStateMessage {
  type: 'sound:state';
  url: string;
  playing: boolean;
  volume: number;
}

interface UseSceneSoundOptions {
  room: Room | null;
  isDirector: boolean;
  soundUrl: string | null;
  soundAutoplay: boolean;
}

interface UseSceneSoundResult {
  playing: boolean;
  volume: number;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
}

export function useSceneSound({
  room,
  isDirector,
  soundUrl,
  soundAutoplay,
}: UseSceneSoundOptions): UseSceneSoundResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlayingState] = useState(soundAutoplay);
  const [volume, setVolumeState] = useState(1);

  // Create/destroy audio element when soundUrl changes; reset play state for the new scene
  useEffect(() => {
    // Reset play state to match the new scene's autoplay setting
    setPlayingState(soundAutoplay);

    if (!soundUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio(soundUrl);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundUrl]);

  // Director: auto-play on mount and broadcast initial state
  useEffect(() => {
    if (!isDirector || !soundUrl || !room) return;
    if (!soundAutoplay) return;

    const audio = audioRef.current;
    if (!audio) return;

    audio.play().catch(() => {});

    const msg: SoundStateMessage = { type: 'sound:state', url: soundUrl, playing: true, volume: audio.volume };
    const encoded = new TextEncoder().encode(JSON.stringify(msg));
    room.localParticipant.publishData(encoded, { reliable: true });
  }, [isDirector, soundUrl, soundAutoplay, room]);

  // All participants: subscribe to sound:state messages
  useEffect(() => {
    if (!room) return;

    const handler = (payload: Uint8Array) => {
      let msg: SoundStateMessage;
      try {
        msg = JSON.parse(new TextDecoder().decode(payload)) as SoundStateMessage;
      } catch {
        return;
      }
      if (msg.type !== 'sound:state') return;

      // Actors/viewers follow the director's state
      if (!isDirector) {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.src !== msg.url) {
          audio.src = msg.url;
        }
        audio.volume = msg.volume;
        if (msg.playing) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
        setPlayingState(msg.playing);
        setVolumeState(msg.volume);
      }
    };

    room.on(RoomEvent.DataReceived, handler);
    return () => {
      room.off(RoomEvent.DataReceived, handler);
    };
  }, [room, isDirector]);

  const setPlaying = (newPlaying: boolean) => {
    if (!isDirector) return;
    const audio = audioRef.current;
    if (audio) {
      if (newPlaying) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    }
    setPlayingState(newPlaying);

    if (room && soundUrl) {
      const msg: SoundStateMessage = {
        type: 'sound:state',
        url: soundUrl,
        playing: newPlaying,
        volume: audio?.volume ?? volume,
      };
      const encoded = new TextEncoder().encode(JSON.stringify(msg));
      room.localParticipant.publishData(encoded, { reliable: true });
    }
  };

  const setVolume = (newVolume: number) => {
    if (!isDirector) return;
    const audio = audioRef.current;

    // Apply to audio immediately for local feedback
    if (audio) {
      audio.volume = newVolume;
    }
    setVolumeState(newVolume);

    // Debounce the LiveKit publish — volume drag fires many events per second
    if (volumeDebounceRef.current) clearTimeout(volumeDebounceRef.current);
    if (room && soundUrl) {
      volumeDebounceRef.current = setTimeout(() => {
        const msg: SoundStateMessage = {
          type: 'sound:state',
          url: soundUrl,
          playing: audio ? !audio.paused : playing,
          volume: newVolume,
        };
        const encoded = new TextEncoder().encode(JSON.stringify(msg));
        room.localParticipant.publishData(encoded, { reliable: false });
      }, 100);
    }
  };

  return { playing, volume, setPlaying, setVolume };
}
