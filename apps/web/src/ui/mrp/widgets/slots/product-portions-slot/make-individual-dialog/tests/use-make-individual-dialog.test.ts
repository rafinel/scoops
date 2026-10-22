import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRemoveGlobalAccompanimentAction } from '@/ui/mrp/hooks/use-remove-global-accompaniment-action'

import { useMakeIndividualDialog } from '../use-make-individual-dialog'

vi.mock('@/ui/mrp/hooks/use-remove-global-accompaniment-action', () => ({
  useRemoveGlobalAccompanimentAction: vi.fn(),
}))

const useRemoveGlobalAccompanimentActionMock = vi.mocked(
  useRemoveGlobalAccompanimentAction,
)

describe('useMakeIndividualDialog', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useRemoveGlobalAccompanimentActionMock.mockReturnValue({
      isPending: false,
      removeGlobalAccompaniment: vi.fn().mockResolvedValue(undefined),
    } as never)
  })

  it('converts through the Accompaniment-scoped removal keeping the Portion links', async () => {
    const removeGlobalAccompaniment = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    useRemoveGlobalAccompanimentActionMock.mockReturnValue({
      isPending: false,
      removeGlobalAccompaniment,
    } as never)
    const { result } = renderHook(() =>
      useMakeIndividualDialog({ onSuccess, open: true, productId: 'accompaniment-1' }),
    )

    await act(async () => {
      await result.current.handleConfirm()
    })

    expect(useRemoveGlobalAccompanimentActionMock).toHaveBeenCalledWith('accompaniment-1')
    expect(removeGlobalAccompaniment).toHaveBeenCalledWith({ keepPortionLinks: true })
    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(result.current.actionError).toBeNull()
  })

  it('maps a rejected conversion to an inline error without closing', async () => {
    useRemoveGlobalAccompanimentActionMock.mockReturnValue({
      isPending: false,
      removeGlobalAccompaniment: vi.fn().mockRejectedValue(new Error('request failed')),
    } as never)
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useMakeIndividualDialog({ onSuccess, open: true, productId: 'accompaniment-1' }),
    )

    await act(async () => {
      await result.current.handleConfirm()
    })

    expect(result.current.actionError).toBe('request failed')
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('uses a generic message for failures that are not errors', async () => {
    useRemoveGlobalAccompanimentActionMock.mockReturnValue({
      isPending: false,
      removeGlobalAccompaniment: vi.fn().mockRejectedValue('boom'),
    } as never)
    const { result } = renderHook(() =>
      useMakeIndividualDialog({
        onSuccess: vi.fn(),
        open: true,
        productId: 'accompaniment-1',
      }),
    )

    await act(async () => {
      await result.current.handleConfirm()
    })

    expect(result.current.actionError).toBe(
      'Não foi possível converter. Tente novamente.',
    )
  })

  it('exposes the pending state and clears a previous error when it reopens', async () => {
    useRemoveGlobalAccompanimentActionMock.mockReturnValue({
      isPending: true,
      removeGlobalAccompaniment: vi.fn().mockRejectedValue(new Error('request failed')),
    } as never)
    const { result, rerender } = renderHook(
      ({ open }) =>
        useMakeIndividualDialog({
          onSuccess: vi.fn(),
          open,
          productId: 'accompaniment-1',
        }),
      { initialProps: { open: true } },
    )
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      await result.current.handleConfirm()
    })
    expect(result.current.actionError).toBe('request failed')
    rerender({ open: false })
    rerender({ open: true })

    expect(result.current.actionError).toBeNull()
  })
})
