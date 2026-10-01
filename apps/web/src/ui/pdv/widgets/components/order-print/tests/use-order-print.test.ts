import { act, renderHook, cleanup } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { showErrorToast } from '@/ui/shared/notifications'
import { useOrderPrint } from '../use-order-print'

vi.mock('@/ui/shared/notifications', () => ({ showErrorToast: vi.fn() }))
const showErrorToastMock = vi.mocked(showErrorToast)

describe('useOrderPrint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'print').mockImplementation(() => {})
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('is unavailable during server rendering and mounts the body portal on the client', () => {
    function Probe() {
      return createElement('span', null, String(useOrderPrint().isDisabled))
    }
    expect(renderToString(createElement(Probe))).toContain('true')
    const { result } = renderHook(() => useOrderPrint())
    expect(result.current.portalTarget).toBe(document.body)
    expect(result.current.isDisabled).toBe(false)
    expect(result.current.isPrinting).toBe(false)
  })

  it('guards disabled actions and accepts changed parent readiness', () => {
    const { result, rerender } = renderHook((disabled) => useOrderPrint(disabled), {
      initialProps: true,
    })
    act(() => result.current.handlePrint())
    expect(window.print).not.toHaveBeenCalled()
    rerender(false)
    act(() => result.current.handlePrint())
    expect(window.print).toHaveBeenCalledOnce()
    expect(result.current.isDisabled).toBe(false)
  })

  it('guards overlapping invocations and restores availability after native cancellation', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    )
    const { result } = renderHook(() => useOrderPrint())
    act(() => {
      result.current.handlePrint()
      result.current.handlePrint()
    })
    expect(window.print).toHaveBeenCalledOnce()
    expect(result.current.isPrinting).toBe(true)
    expect(result.current.isDisabled).toBe(true)
    act(() => window.dispatchEvent(new Event('afterprint')))
    expect(result.current.isPrinting).toBe(false)
    act(() => result.current.handlePrint())
    expect(window.print).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })

  it('recovers after a throwing or unavailable API without claiming success', () => {
    const { result } = renderHook(() => useOrderPrint())
    vi.mocked(window.print).mockImplementationOnce(() => {
      throw new Error('unavailable')
    })
    act(() => result.current.handlePrint())
    expect(showErrorToastMock).toHaveBeenCalledWith(
      'Não foi possível abrir a impressão. Tente novamente.',
    )
    expect(result.current.isDisabled).toBe(false)
    act(() => result.current.handlePrint())
    expect(window.print).toHaveBeenCalledTimes(2)
    vi.stubGlobal('print', undefined)
    act(() => result.current.handlePrint())
    expect(showErrorToastMock).toHaveBeenCalledTimes(2)
    expect(result.current.isDisabled).toBe(false)
    vi.unstubAllGlobals()
  })

  it('restores the triggering control focus and removes native subscriptions on unmount', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    )
    const button = document.createElement('button')
    document.body.append(button)
    button.focus()
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const { result, unmount } = renderHook(() => useOrderPrint())
    act(() => result.current.handlePrint())
    button.blur()
    act(() => window.dispatchEvent(new Event('afterprint')))
    expect(document.activeElement).toBe(button)
    unmount()
    expect(removeListener).toHaveBeenCalledWith('afterprint', expect.any(Function))
    button.remove()
    vi.unstubAllGlobals()
  })
})
