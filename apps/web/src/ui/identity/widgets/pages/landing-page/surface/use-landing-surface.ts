import { useSpring, type MotionValue } from 'motion/react'
import { useEffect, useRef, type PointerEvent } from 'react'

import { createLandingMesh } from './landing-mesh'

const POSITION_SPRING = { stiffness: 260, damping: 32, mass: 0.5 }
const INFLUENCE_SPRING = { stiffness: 160, damping: 30 }

export function useLandingSurface() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const x = useSpring(0.5, POSITION_SPRING)
  const y = useSpring(0.3, POSITION_SPRING)
  const influence = useSpring(0, INFLUENCE_SPRING)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return mountLandingMesh(canvas, x, y, influence)
  }, [x, y, influence])

  function handlePointerEnter(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== 'mouse' ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    handlePointerMove(event)
    influence.set(1)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== 'mouse' ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    const bounds = event.currentTarget.getBoundingClientRect()
    x.set((event.clientX - bounds.left) / bounds.width)
    y.set((event.clientY - bounds.top) / bounds.height)
  }

  function handlePointerLeave() {
    influence.set(0)
  }

  return { canvasRef, handlePointerEnter, handlePointerMove, handlePointerLeave }
}

function mountLandingMesh(
  canvas: HTMLCanvasElement,
  x: MotionValue<number>,
  y: MotionValue<number>,
  influence: MotionValue<number>,
) {
  const mesh = createLandingMesh(canvas)
  canvas.style.opacity = mesh ? '1' : '0'
  if (!mesh) return
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)')
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  let isVisible = true
  let frameId = 0
  let time = 0
  let lastFrame = 0
  let isContextLost = false

  function draw(timestamp: number) {
    frameId = 0
    if (isContextLost) return
    if (timestamp - lastFrame >= 1000 / 30) {
      time += Math.min((timestamp - lastFrame) / 1000, 0.1)
      lastFrame = timestamp
      mesh?.render({ x: x.get(), y: y.get(), influence: influence.get(), time })
    }
    if (isVisible && !document.hidden && !reducedMotion.matches && finePointer.matches) {
      frameId = requestAnimationFrame(draw)
    }
  }

  function refresh() {
    cancelAnimationFrame(frameId)
    if (isContextLost) return
    if (reducedMotion.matches) resetMeshPointer(x, y, influence)
    lastFrame = performance.now()
    mesh?.render({ x: x.get(), y: y.get(), influence: influence.get(), time })
    if (isVisible && !document.hidden && !reducedMotion.matches && finePointer.matches) {
      frameId = requestAnimationFrame(draw)
    }
  }

  function resize() {
    canvas.width = Math.max(1, Math.round(canvas.clientWidth))
    canvas.height = Math.max(1, Math.round(canvas.clientHeight))
    refresh()
  }

  function handleContextLost() {
    isContextLost = true
    cancelAnimationFrame(frameId)
    canvas.style.opacity = '0'
  }

  const disposeObservers = observeMeshSurface(canvas, resize, (isInView) => {
    isVisible = isInView
    refresh()
  })
  document.addEventListener('visibilitychange', refresh)
  finePointer.addEventListener('change', refresh)
  reducedMotion.addEventListener('change', refresh)
  canvas.addEventListener('webglcontextlost', handleContextLost)
  resize()

  return () => {
    cancelAnimationFrame(frameId)
    disposeObservers()
    document.removeEventListener('visibilitychange', refresh)
    finePointer.removeEventListener('change', refresh)
    reducedMotion.removeEventListener('change', refresh)
    canvas.removeEventListener('webglcontextlost', handleContextLost)
    mesh.dispose()
  }
}

function resetMeshPointer(
  x: MotionValue<number>,
  y: MotionValue<number>,
  influence: MotionValue<number>,
) {
  x.jump(0.5)
  y.jump(0.3)
  influence.jump(0)
}

function observeMeshSurface(
  canvas: HTMLCanvasElement,
  onResize: () => void,
  onVisibilityChange: (isVisible: boolean) => void,
) {
  const resizeObserver = new ResizeObserver(onResize)
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    onVisibilityChange(entry.isIntersecting)
  })
  resizeObserver.observe(canvas)
  visibilityObserver.observe(canvas)
  return () => {
    resizeObserver.disconnect()
    visibilityObserver.disconnect()
  }
}
