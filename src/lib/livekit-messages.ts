export interface PropMoveMessage {
  type: 'prop:move';
  castId: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  indexZ: number;
  bhValue?: number;
}

export type BgDirection = 'left' | 'right' | null;
export type BgSpeed = 0 | 1 | 2 | 3;

export interface BgAnimateMessage {
  type: 'bg:animate';
  direction: BgDirection;
  speed: BgSpeed;
}

export interface PropTriggerMessage {
  type: 'prop:trigger';
  castId: string;
  triggerName: string;
}

export type LiveKitMessage = PropMoveMessage | BgAnimateMessage | PropTriggerMessage;
