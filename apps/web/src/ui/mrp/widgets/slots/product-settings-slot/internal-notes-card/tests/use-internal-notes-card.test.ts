import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { useUpdateProductSettingsAction } from '@/ui/mrp/hooks/use-update-product-settings-action'

import { useInternalNotesCard } from '../use-internal-notes-card'

vi.mock('@/ui/mrp/hooks/use-update-product-settings-action', () => ({
  useUpdateProductSettingsAction: vi.fn(),
}))

const useUpdateProductSettingsActionMock = vi.mocked(useUpdateProductSettingsAction)
const product = ProductFaker.fake({ internalNotes: 'Nota anterior' })

describe('useInternalNotesCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updateProductSettings: vi.fn().mockResolvedValue(undefined),
    } as never)
  })

  it('saves the edited note on blur', async () => {
    const updateProductSettings = vi.fn().mockResolvedValue(undefined)
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updateProductSettings,
    } as never)
    const { result } = renderHook(() => useInternalNotesCard(product))

    act(() => result.current.setInternalNotes('Nota atualizada'))
    await act(async () => result.current.handleBlur())

    expect(updateProductSettings).toHaveBeenCalledWith({
      field: 'internalNotes',
      input: {
        internalNotes: 'Nota atualizada',
        expectedUpdatedAt: product.updatedAt,
      },
    })
  })

  it('exposes save errors and restores the persisted note', async () => {
    const updateProductSettings = vi.fn().mockRejectedValue(new Error('Falha ao salvar'))
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updateProductSettings,
    } as never)
    const { result } = renderHook(() => useInternalNotesCard(product))

    act(() => result.current.setInternalNotes('Nota com erro'))
    await act(async () => result.current.handleBlur())
    await waitFor(() => expect(result.current.error).toBe('Falha ao salvar'))

    act(() => result.current.handleRevert())
    expect(result.current.internalNotes).toBe('Nota anterior')
    expect(result.current.error).toBeUndefined()
  })
})
