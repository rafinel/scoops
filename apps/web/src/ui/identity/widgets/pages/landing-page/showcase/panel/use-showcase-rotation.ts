import { animate, useMotionValue } from 'motion/react'
import { useEffect, useState, type FocusEvent } from 'react'

export function useShowcaseRotation(canPlay: boolean) {
  const [selection, setSelection] = useState({ index: 0, revision: 0 })
  const [isPaused, setIsPaused] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const progress = useMotionValue(0)
  const isPlaying = canPlay && !isPaused && !isFocused
  useEffect(() => {
    if (!isPlaying) return
    const rotation = animate(progress, 1, {
      duration: Math.max(0, 1 - progress.get()) * 8,
      ease: 'linear',
      onComplete() {
        progress.set(0)
        setSelection({
          index: (selection.index + 1) % 3,
          revision: selection.revision + 1,
        })
      },
    })
    return () => rotation.stop()
  }, [isPlaying, selection, progress])

  function handleSelectFeature(index: number) {
    progress.set(0)
    setSelection((current) => ({ index, revision: current.revision + 1 }))
  }
  function handleTogglePause() {
    setIsPaused((current) => !current)
  }
  function handleFocus(event: FocusEvent<HTMLElement>) {
    setIsFocused(event.target.matches(':focus-visible'))
  }
  function handleKeyboardInteraction() {
    setIsFocused(true)
  }
  function handlePointerInteraction() {
    setIsFocused(false)
  }
  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false)
  }
  return {
    activeIndex: selection.index,
    isPaused,
    progress,
    handleSelectFeature,
    handleTogglePause,
    handleFocus,
    handleKeyboardInteraction,
    handlePointerInteraction,
    handleBlur,
  }
}
