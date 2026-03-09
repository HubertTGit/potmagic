import { useEffect, useRef, useState } from 'react'
import { Image } from 'react-konva'
import type Konva from 'konva'

interface DraggableImageProps {
  src: string
  initialX?: number
  initialY?: number
}

function getAngle(t1: Touch, t2: Touch) {
  return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI)
}

export function DraggableImage({ src, initialX = 100, initialY = 100 }: DraggableImageProps) {
  const imageRef = useRef<Konva.Image>(null)
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined)
  const lastAngle = useRef(0)

  useEffect(() => {
    const img = new window.Image()
    img.src = src
    img.onload = () => {
      setImage(img)
    }
  }, [src])

  useEffect(() => {
    const node = imageRef.current
    if (!node || !image) return
    node.offsetX(image.width / 2)
    node.offsetY(image.height / 2)
    node.getLayer()?.batchDraw()
  }, [image])

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

  const handleDblClick = () => {
    const node = imageRef.current
    if (!node) return
    node.scaleX(node.scaleX() * -1)
    node.getLayer()?.batchDraw()
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
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
    />
  )
}
