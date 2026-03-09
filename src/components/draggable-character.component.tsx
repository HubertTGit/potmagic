import { useEffect, useRef, useState } from 'react'
import { Image } from 'react-konva'
import type Konva from 'konva'

interface DraggableCharacterProps {
  src: string
  initialX?: number
  initialY?: number
}

function getAngle(t1: Touch, t2: Touch) {
  return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI)
}

function getMidpoint(t1: Touch, t2: Touch) {
  return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 }
}

export function DraggableCharacter({ src, initialX = 100, initialY = 100 }: DraggableCharacterProps) {
  const imageRef = useRef<Konva.Image>(null)
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined)
  const lastAngle = useRef(0)
  const lastMidpoint = useRef({ x: 0, y: 0 })

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
    imageRef.current?.moveToTop()
    const touches = e.evt.touches
    if (touches.length === 2) {
      imageRef.current?.draggable(false)
      lastAngle.current = getAngle(touches[0], touches[1])
      lastMidpoint.current = getMidpoint(touches[0], touches[1])
    }
  }

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches
    if (touches.length !== 2) return
    e.evt.preventDefault()
    const node = imageRef.current
    if (!node) return

    const angle = getAngle(touches[0], touches[1])
    const midpoint = getMidpoint(touches[0], touches[1])

    node.rotation(node.rotation() + (angle - lastAngle.current))
    node.x(node.x() + (midpoint.x - lastMidpoint.current.x))
    node.y(node.y() + (midpoint.y - lastMidpoint.current.y))

    lastAngle.current = angle
    lastMidpoint.current = midpoint
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
      onMouseDown={() => imageRef.current?.moveToTop()}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
    />
  )
}
