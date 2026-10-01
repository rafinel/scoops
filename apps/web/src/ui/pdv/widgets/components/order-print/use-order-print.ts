import { useEffect, useRef, useState, type RefObject } from 'react'

import { showErrorToast } from '@/ui/shared/notifications'

type PrintState = {
  isPrinting: boolean
  isInvoking: RefObject<boolean>
  trigger: RefObject<HTMLElement | null>
  setIsPrinting: (value: boolean) => void
}

export function useOrderPrint(disabled = false) {
  const portalTarget = usePrintTarget()
  const state = usePrintLifecycle()
  return getPrintControls(portalTarget, disabled, state)
}

function usePrintTarget() {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  useEffect(function mountPrintDocument() {
    setTarget(document.body)
  }, [])
  return target
}

function usePrintLifecycle(): PrintState {
  const [isPrinting, setIsPrinting] = useState(false)
  const isInvoking = useRef(false)
  const trigger = useRef<HTMLElement | null>(null)
  usePrintEnd(isInvoking, trigger, setIsPrinting)
  usePrintFocus(isPrinting, trigger)
  return { isPrinting, isInvoking, trigger, setIsPrinting }
}

function usePrintEnd(
  isInvoking: RefObject<boolean>,
  trigger: RefObject<HTMLElement | null>,
  setIsPrinting: (value: boolean) => void,
) {
  useEffect(
    function subscribeToNativePrint() {
      return subscribeToPrintEnd(isInvoking, trigger, setIsPrinting)
    },
    [isInvoking, trigger, setIsPrinting],
  )
}

function usePrintFocus(isPrinting: boolean, trigger: RefObject<HTMLElement | null>) {
  useEffect(
    function restorePrintFocus() {
      if (!isPrinting) restoreFocus(trigger)
    },
    [isPrinting, trigger],
  )
}

function getPrintControls(
  portalTarget: HTMLElement | null,
  disabled: boolean,
  state: PrintState,
) {
  return {
    portalTarget,
    isPrinting: state.isPrinting,
    isDisabled: !portalTarget || disabled || state.isPrinting,
    handlePrint: getPrintHandler(portalTarget, disabled, state),
  }
}

function getPrintHandler(
  portalTarget: HTMLElement | null,
  disabled: boolean,
  state: PrintState,
) {
  return function handlePrint() {
    if (!portalTarget || disabled || state.isInvoking.current) return
    invokeNativePrint(state)
  }
}

function subscribeToPrintEnd(
  isInvoking: RefObject<boolean>,
  trigger: RefObject<HTMLElement | null>,
  setIsPrinting: (value: boolean) => void,
) {
  function handleNativePrintEnd() {
    isInvoking.current = false
    setIsPrinting(false)
  }
  window.addEventListener('afterprint', handleNativePrintEnd)
  return function cleanupPrintDocument() {
    window.removeEventListener('afterprint', handleNativePrintEnd)
    isInvoking.current = false
    trigger.current = null
  }
}

function restoreFocus(trigger: RefObject<HTMLElement | null>) {
  if (!trigger.current?.isConnected) return
  trigger.current.focus()
  trigger.current = null
}

function invokeNativePrint(state: PrintState) {
  if (typeof window.print !== 'function') return reportPrintError()
  prepareNativePrint(state)
  callNativePrint(state)
}

function prepareNativePrint(state: PrintState) {
  state.trigger.current = getActiveElement()
  state.isInvoking.current = true
  state.setIsPrinting(true)
}

function getActiveElement() {
  return document.activeElement instanceof HTMLElement ? document.activeElement : null
}

function callNativePrint(state: PrintState) {
  try {
    window.print()
  } catch {
    reportPrintError()
  } finally {
    finishClosedPrint(state)
  }
}

function finishClosedPrint(state: PrintState) {
  if (window.matchMedia?.('print').matches) return
  state.isInvoking.current = false
  state.setIsPrinting(false)
}

function reportPrintError() {
  showErrorToast('Não foi possível abrir a impressão. Tente novamente.')
}
