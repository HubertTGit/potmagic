import { atom } from 'jotai';
import type { BgDirection, BgSpeed } from '@/lib/livekit-messages';

export const bgPanningAtom = atom<{ direction: BgDirection; speed: BgSpeed }>({
  direction: null,
  speed: 0,
});

export const bgProgressAtom = atom({ leftProgress: 0, rightProgress: 0 });
