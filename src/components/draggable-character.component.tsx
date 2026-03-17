import { useEffect, useRef, useState } from 'react';
import { Image } from 'react-konva';
import type Konva from 'konva';
import { RoomEvent } from 'livekit-client';
import type { Room } from 'livekit-client';
import { authClient } from '@/lib/auth-client';
import { saveSceneCastPosition } from '@/lib/scenes.fns';
import type { PropType } from '@/db/schema';

interface DraggableCharacterProps {
  sceneCastId: string;
  castId: string;
  src: string;
  userId: string;
  type: PropType;
  initialX?: number;
  initialY?: number;
  initialRotation?: number;
  initialScaleX?: number;
  room?: Room | null;
  isSpeaking?: boolean;
  stageWidth?: number;
  stageHeight?: number;
}

interface PropMoveMessage {
  type: 'prop:move';
  castId: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  indexZ: number;
}

function getAngle(t1: Touch, t2: Touch) {
  return (
    Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) *
    (180 / Math.PI)
  );
}

function getMidpoint(t1: Touch, t2: Touch) {
  return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
}

export function DraggableCharacter({
  sceneCastId,
  castId,
  src,
  userId,
  type,
  initialX = 100,
  initialY = 100,
  initialRotation = 0,
  initialScaleX = 1,
  room,
  isSpeaking,
  stageWidth = 1280,
  stageHeight = 720,
}: DraggableCharacterProps) {
  const { data: session } = authClient.useSession();
  const canDrag =
    session?.user?.id === userId || session?.user?.role === 'director';
  const imageRef = useRef<Konva.Image>(null);
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);
  const lastAngle = useRef(0);
  const lastMidpoint = useRef({ x: 0, y: 0 });
  const canDragRef = useRef(false);
  canDragRef.current = canDrag;
  const lastSendTimeRef = useRef(0);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      setImage(img);
    };
  }, [src]);

  useEffect(() => {
    const node = imageRef.current;
    if (!node || !image) return;
    node.offsetX(image.width / 2);
    node.offsetY(image.height / 2);
    node.rotation(initialRotation);
    node.scaleX(initialScaleX);
    if (type === 'background') {
      node.y(stageHeight - image.height / 2);
      node.moveToBottom();
    } else {
      node.moveToTop();
    }
    node.getLayer()?.batchDraw();
  }, [image, type, stageHeight]);

  useEffect(() => {
    return () => {
      const node = imageRef.current;
      if (!canDragRef.current || !node) return;
      saveSceneCastPosition({
        data: {
          sceneCastId,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scaleX: node.scaleX(),
        },
      });
    };
  }, [sceneCastId]);

  // Subscribe to remote prop:move messages and apply imperatively
  useEffect(() => {
    if (!room) return;

    const handler = (payload: Uint8Array) => {
      let msg: PropMoveMessage;
      try {
        msg = JSON.parse(new TextDecoder().decode(payload)) as PropMoveMessage;
      } catch {
        return;
      }

      if (msg.type !== 'prop:move' || msg.castId !== castId) return;

      const node = imageRef.current;
      if (!node) return;
      node.x(msg.x);
      node.y(msg.y);
      node.rotation(msg.rotation);
      node.scaleX(msg.scaleX);
      node.getLayer()?.batchDraw();
    };

    room.on(RoomEvent.DataReceived, handler);
    return () => {
      room.off(RoomEvent.DataReceived, handler);
    };
  }, [room, castId]);

  function publishMove(node: Konva.Image, immediate = false) {
    if (!room || !canDrag) return;
    const now = Date.now();
    if (!immediate && now - lastSendTimeRef.current < 30) return;
    lastSendTimeRef.current = now;

    const msg: PropMoveMessage = {
      type: 'prop:move',
      castId,
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scaleX: node.scaleX(),
      indexZ: 0,
    };
    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(msg)),
      { reliable: false },
    );
  }

  function persistPosition(node: Konva.Image) {
    if (!canDrag) return;
    saveSceneCastPosition({
      data: {
        sceneCastId,
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
      },
    });
  }

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (!canDrag) return;
    if (type !== 'background') imageRef.current?.moveToTop();
    const touches = e.evt.touches;
    if (touches.length === 2 && type !== 'background') {
      imageRef.current?.draggable(false);
      lastAngle.current = getAngle(touches[0], touches[1]);
      lastMidpoint.current = getMidpoint(touches[0], touches[1]);
    }
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (!canDrag) return;
    const touches = e.evt.touches;
    if (touches.length !== 2) return;
    e.evt.preventDefault();
    const node = imageRef.current;
    if (!node) return;

    const angle = getAngle(touches[0], touches[1]);
    const midpoint = getMidpoint(touches[0], touches[1]);

    if (type !== 'background') {
      node.rotation(node.rotation() + (angle - lastAngle.current));
    }
    node.x(node.x() + (midpoint.x - lastMidpoint.current.x));
    if (type !== 'background') {
      node.y(node.y() + (midpoint.y - lastMidpoint.current.y));
    }

    lastAngle.current = angle;
    lastMidpoint.current = midpoint;
    node.getLayer()?.batchDraw();
    publishMove(node);
  };

  const handleTouchEnd = () => {
    if (!canDrag) return;
    imageRef.current?.draggable(true);
    const node = imageRef.current;
    if (node) persistPosition(node);
  };

  const handleDblClick = () => {
    if (!canDrag || type === 'background') return;
    const node = imageRef.current;
    if (!node) return;
    node.scaleX(node.scaleX() * -1);
    node.getLayer()?.batchDraw();
    publishMove(node, true); // immediate — discrete event, bypass throttle
    persistPosition(node);
  };

  return (
    <Image
      ref={imageRef}
      image={image}
      x={initialX}
      y={initialY}
      draggable={canDrag}
      shadowEnabled={isSpeaking && type !== 'background'}
      shadowColor="#a855f7"
      shadowBlur={15}
      shadowOpacity={1}
      strokeEnabled={isSpeaking && type !== 'background'}
      strokeWidth={4}
      dragBoundFunc={(pos) => {
        const halfW = (image?.width ?? 0) / 2;
        const halfH = (image?.height ?? 0) / 2;
        if (type === 'background') {
          const minX = stageWidth - halfW;
          const maxX = halfW;
          const clampedX = maxX > minX ? Math.min(Math.max(pos.x, minX), maxX) : pos.x;
          return { x: clampedX, y: imageRef.current?.y() ?? pos.y };
        }
        return {
          x: Math.min(Math.max(pos.x, halfW), stageWidth - halfW),
          y: Math.min(Math.max(pos.y, halfH), stageHeight - halfH),
        };
      }}
      onDragMove={() => {
        const node = imageRef.current;
        if (node) publishMove(node);
      }}
      onDragEnd={() => {
        const node = imageRef.current;
        if (node) persistPosition(node);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={() => {
        if (canDrag && type !== 'background') imageRef.current?.moveToTop();
      }}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
    />
  );
}
