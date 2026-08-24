import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useRemoveAccompanimentTypeAction } from '@/ui/mrp/hooks/use-remove-accompaniment-type-action'
import { useRemoveAccompanimentTypeDialog } from '../use-remove-accompaniment-type-dialog'

vi.mock('@/ui/mrp/hooks/use-remove-accompaniment-type-action', () => ({
  useRemoveAccompanimentTypeAction: vi.fn(),
}))
const useRemoveAccompanimentTypeActionMock = vi.mocked(useRemoveAccompanimentTypeAction)

describe('useRemoveAccompanimentTypeDialog', () => {
  it('removes the type and reports action failures', async () => {
    const removeAccompanimentType = vi.fn().mockResolvedValue(undefined)
    useRemoveAccompanimentTypeActionMock.mockReturnValue({
      removeAccompanimentType,
      isPending: false,
    } as never)
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useRemoveAccompanimentTypeDialog({ onSuccess, typeId: 'type-1' }),
    )
    await act(async () => result.current.handleConfirm())
    expect(removeAccompanimentType).toHaveBeenCalledWith('type-1')
    expect(onSuccess).toHaveBeenCalledTimes(1)

    useRemoveAccompanimentTypeActionMock.mockReturnValue({
      removeAccompanimentType: vi.fn().mockRejectedValue(new Error('Tipo em uso')),
      isPending: false,
    } as never)
    const failed = renderHook(() =>
      useRemoveAccompanimentTypeDialog({ onSuccess: vi.fn(), typeId: 'type-1' }),
    )
    await act(async () => failed.result.current.handleConfirm())
    expect(failed.result.current.actionError).toBe('Tipo em uso')
  })
})
