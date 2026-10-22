import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useGlobalField } from '../use-global-field'

describe('useGlobalField', () => {
  it('describes the switch only by its help while no replacement notice is shown', () => {
    const { result } = renderHook(() =>
      useGlobalField({ handleGlobalChange: vi.fn(), shouldShowReplacementNotice: false }),
    )

    expect(result.current.describedBy).toBe(result.current.helpId)
    expect(result.current.helpText).toBe(
      'Aparece em todas as porções, incluindo as novas. Tipo, quantidade e preço são compartilhados.',
    )
    expect(result.current.labelId).not.toBe(result.current.helpId)
  })

  it('also describes the switch by the replacement notice when it is shown', () => {
    const { result } = renderHook(() =>
      useGlobalField({ handleGlobalChange: vi.fn(), shouldShowReplacementNotice: true }),
    )

    expect(result.current.describedBy).toBe(
      `${result.current.helpId} ${result.current.replacementNoticeId}`,
    )
  })

  it('reports the toggled value', () => {
    const handleGlobalChange = vi.fn()
    const { result } = renderHook(() =>
      useGlobalField({ handleGlobalChange, shouldShowReplacementNotice: false }),
    )

    result.current.handleCheckedChange(true)
    result.current.handleCheckedChange(false)

    expect(handleGlobalChange).toHaveBeenNthCalledWith(1, true)
    expect(handleGlobalChange).toHaveBeenNthCalledWith(2, false)
  })
})
