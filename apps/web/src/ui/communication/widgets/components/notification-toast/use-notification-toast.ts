import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react'

const ACTIVE_DURATION_MS = 5_000

export type NotificationToastController = {
  handleBlur: (event: FocusEvent<HTMLElement>) => void
  handleDismiss: () => void
  handleFocus: () => void
  handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void
  handleMouseEnter: () => void
  handleMouseLeave: () => void
  isPaused: boolean
}

export function useNotificationToast(onDismiss: () => void): NotificationToastController {
  const { dismiss, isPaused, pause, resume } = useNotificationToastTimer(onDismiss)
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (isFocusWithinToast(event)) return
      resume()
    },
    [resume],
  )
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      dismiss()
    },
    [dismiss],
  )

  return {
    handleBlur,
    handleDismiss: dismiss,
    handleFocus: pause,
    handleKeyDown,
    handleMouseEnter: pause,
    handleMouseLeave: resume,
    isPaused,
  }
}

function useNotificationToastTimer(onDismiss: () => void) {
  const [isPaused, setIsPaused] = useState(false)
  const remainingMsRef = useRef(ACTIVE_DURATION_MS)
  const startedAtRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const dismissedRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timeoutRef.current === null) return
    window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }, [])

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    clearTimer()
    onDismiss()
  }, [clearTimer, onDismiss])

  const pause = useCallback(() => {
    if (dismissedRef.current || isPaused) return
    if (startedAtRef.current !== null) {
      remainingMsRef.current = Math.max(
        0,
        remainingMsRef.current - (Date.now() - startedAtRef.current),
      )
    }
    startedAtRef.current = null
    clearTimer()
    setIsPaused(true)
  }, [clearTimer, isPaused])

  const resume = useCallback(() => {
    if (dismissedRef.current || !isPaused) return
    setIsPaused(false)
  }, [isPaused])

  useEffect(() => {
    if (isPaused || dismissedRef.current) return
    if (remainingMsRef.current <= 0) {
      dismiss()
      return
    }

    startedAtRef.current = Date.now()
    timeoutRef.current = window.setTimeout(dismiss, remainingMsRef.current)

    return () => {
      if (startedAtRef.current !== null) {
        remainingMsRef.current = Math.max(
          0,
          remainingMsRef.current - (Date.now() - startedAtRef.current),
        )
      }
      startedAtRef.current = null
      clearTimer()
    }
  }, [clearTimer, dismiss, isPaused])

  return {
    isPaused,
    dismiss,
    pause,
    resume,
  }
}

function isFocusWithinToast(event: FocusEvent<HTMLElement>) {
  const relatedTarget = event.relatedTarget
  return relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)
}
