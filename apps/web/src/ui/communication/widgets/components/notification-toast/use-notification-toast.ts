import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MutableRefObject,
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
  const timer = useNotificationToastTimer(onDismiss)
  return createNotificationToastController(
    timer,
    useNotificationToastHandlers(timer.dismiss, timer.resume),
  )
}

function createNotificationToastController(
  timer: ReturnType<typeof useNotificationToastTimer>,
  handlers: ReturnType<typeof useNotificationToastHandlers>,
) {
  return Object.assign({}, handlers, {
    handleDismiss: timer.dismiss,
    handleFocus: timer.pause,
    handleMouseEnter: timer.pause,
    handleMouseLeave: timer.resume,
    isPaused: timer.isPaused,
  })
}

function useNotificationToastHandlers(dismiss: () => void, resume: () => void) {
  return {
    handleBlur: createToastBlurHandler(resume),
    handleKeyDown: createToastKeyHandler(dismiss),
  }
}

function createToastBlurHandler(resume: () => void) {
  return (event: FocusEvent<HTMLElement>) => {
    if (!isFocusWithinToast(event)) resume()
  }
}

function createToastKeyHandler(dismiss: () => void) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    dismiss()
  }
}

type NotificationToastTimerState = {
  dismissed: boolean
  remainingMs: number
  startedAt: number | null
  timeout: number | null
}

function useNotificationToastTimer(onDismiss: () => void) {
  const timer = useNotificationToastTimerState()
  const actions = useNotificationToastTimerActions(timer, onDismiss)
  useNotificationToastTimerEffect(timer.stateRef, timer.isPaused, actions)
  return Object.assign({}, actions, { isPaused: timer.isPaused })
}

function useNotificationToastTimerState() {
  const [isPaused, setIsPaused] = useState(false)
  const stateRef = useRef(createNotificationToastTimerState())
  return { isPaused, setIsPaused, stateRef }
}

function useNotificationToastTimerEffect(
  stateRef: MutableRefObject<NotificationToastTimerState>,
  isPaused: boolean,
  actions: ReturnType<typeof useNotificationToastTimerActions>,
) {
  useEffect(
    () =>
      syncNotificationToastTimer(
        stateRef.current,
        isPaused,
        actions.dismiss,
        actions.clearTimer,
      ),
    [actions, isPaused, stateRef],
  )
}

function useNotificationToastTimerActions(
  timer: ReturnType<typeof useNotificationToastTimerState>,
  onDismiss: () => void,
) {
  const { isPaused, setIsPaused, stateRef } = timer
  const actions = useMemo(
    () => createNotificationToastTimerActions(stateRef, onDismiss, isPaused, setIsPaused),
    [isPaused, onDismiss, setIsPaused, stateRef],
  )
  return actions
}

function createNotificationToastTimerActions(
  stateRef: MutableRefObject<NotificationToastTimerState>,
  onDismiss: () => void,
  isPaused: boolean,
  setIsPaused: (value: boolean) => void,
) {
  const clearTimer = () => clearNotificationToastTimer(stateRef.current)
  return {
    clearTimer,
    dismiss: () => dismissNotificationToast(stateRef.current, clearTimer, onDismiss),
    pause: () =>
      pauseNotificationToast(stateRef.current, isPaused, clearTimer, setIsPaused),
    resume: () => resumeNotificationToast(stateRef.current, isPaused, setIsPaused),
  }
}

function createNotificationToastTimerState(): NotificationToastTimerState {
  return Object.assign(
    {},
    {
      dismissed: false,
      remainingMs: ACTIVE_DURATION_MS,
      startedAt: null,
      timeout: null,
    },
  )
}

function clearNotificationToastTimer(state: NotificationToastTimerState) {
  if (state.timeout === null) return
  window.clearTimeout(state.timeout)
  state.timeout = null
}

function settleNotificationToastTimer(state: NotificationToastTimerState) {
  if (state.startedAt !== null)
    state.remainingMs = Math.max(0, state.remainingMs - (Date.now() - state.startedAt))
  state.startedAt = null
}

function dismissNotificationToast(
  state: NotificationToastTimerState,
  clearTimer: () => void,
  onDismiss: () => void,
) {
  if (state.dismissed) return
  state.dismissed = true
  clearTimer()
  onDismiss()
}

function pauseNotificationToast(
  state: NotificationToastTimerState,
  isPaused: boolean,
  clearTimer: () => void,
  setIsPaused: (value: boolean) => void,
) {
  if (state.dismissed || isPaused) return
  settleNotificationToastTimer(state)
  clearTimer()
  setIsPaused(true)
}

function resumeNotificationToast(
  state: NotificationToastTimerState,
  isPaused: boolean,
  setIsPaused: (value: boolean) => void,
) {
  if (!state.dismissed && isPaused) setIsPaused(false)
}

function syncNotificationToastTimer(
  state: NotificationToastTimerState,
  isPaused: boolean,
  dismiss: () => void,
  clearTimer: () => void,
) {
  if (isPaused || state.dismissed) return
  if (state.remainingMs <= 0) return dismiss()
  state.startedAt = Date.now()
  state.timeout = window.setTimeout(dismiss, state.remainingMs)
  return () => cleanupNotificationToastTimer(state, clearTimer)
}

function cleanupNotificationToastTimer(
  state: NotificationToastTimerState,
  clearTimer: () => void,
) {
  settleNotificationToastTimer(state)
  clearTimer()
}

function isFocusWithinToast(event: FocusEvent<HTMLElement>) {
  const relatedTarget = event.relatedTarget
  return relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)
}
