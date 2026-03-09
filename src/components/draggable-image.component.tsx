import { useEffect, useRef, useState } from 'react'
import { Image } from 'react-konva'
import type Konva from 'konva'

interface DraggableImageProps {
  src: string
  initialX?: number
  initialY?: number
  onSelect?: (node: Konva.Image, clickLocal: { x: number; y: number }) => void
}

function getAngle(t1: Touch, t2: Touch) {
  return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI)
}

export function DraggableImage({ src, initialX = 100, initialY = 100, onSelect }: DraggableImageProps) {
  const imageRef = useRef<Konva.Image>(null)
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined)
  const lastAngle = useRef(0)
  const lastClickLocal = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const img = new window.Image()
    img.src = src
    img.onload = () => setImage(img)
  }, [src])

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches
    if (touches.length === 2) {
      imageRef.current?.draggable(false)
      lastAngle.current = getAngle(touches[0], touches[1])
    }
  }

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches
    if (touches.length !== 2) return
    e.evt.preventDefault()
    const node = imageRef.current
    if (!node) return

    const angle = getAngle(touches[0], touches[1])
    node.rotation(node.rotation() + (angle - lastAngle.current))
    lastAngle.current = angle
    node.getLayer()?.batchDraw()
  }

  const handleTouchEnd = () => {
    imageRef.current?.draggable(true)
  }

  const handleClick = () => {
    const node = imageRef.current
    if (!node) return
    const stage = node.getStage()
    if (!stage) return
    const pointerPos = stage.getPointerPosition()
    if (!pointerPos) return
    const transform = node.getAbsoluteTransform().copy().invert()
    const localPos = transform.point(pointerPos)
    lastClickLocal.current = localPos
    onSelect?.(node, localPos)
  }

  return (
    <Image
      ref={imageRef}
      image={image}
      x={initialX}
      y={initialY}
      draggable
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    />
  )
}
