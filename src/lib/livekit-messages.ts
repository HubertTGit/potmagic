export interface PropMoveMessage {
  type: 'prop:move';
  castId: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  indexZ: number;
}

export type BgDirection = 'left' | 'right' | null;
export type BgSpeed = 0 | 1 | 2 | 3;

export interface BgAnimateMessage {
  type: 'bg:animate';
  direction: BgDirection;
  speed: BgSpeed;
}

export type LiveKitMessage = PropMoveMessage | BgAnimateMessage;
