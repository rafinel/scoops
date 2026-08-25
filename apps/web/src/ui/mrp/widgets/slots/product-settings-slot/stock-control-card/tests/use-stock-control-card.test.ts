import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { useUpdateProductSettingsAction } from '@/ui/mrp/hooks/use-update-product-settings-action'

import { useStockControlCard } from '../use-stock-control-card'

vi.mock('@/ui/mrp/hooks/use-update-product-settings-action', () => ({
  useUpdateProductSettingsAction: vi.fn(),
}))

const useUpdateProductSettingsActionMock = vi.mocked(useUpdateProductSettingsAction)
const product = ProductFaker.fake({ allowNegativeStock: false })

describe('useStockControlCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updateProductSettings: vi.fn().mockResolvedValue(undefined),
    } as never)
  })

  it('saves the selected negative-stock setting', async () => {
    const updateProductSettings = vi.fn().mockResolvedValue(undefined)
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updateProductSettings,
    } as never)
    const { result } = renderHook(() => useStockControlCard(product))

    await act(async () => result.current.handleAllowNegativeStockChange(true))

    expect(result.current.allowNegativeStock).toBe(true)
    expect(updateProductSettings).toHaveBeenCalledWith({
      field: 'allowNegativeStock',
      input: { allowNegativeStock: true, expectedUpdatedAt: product.updatedAt },
    })
  })

  it('exposes save errors and clears them when reverting', async () => {
    const updateProductSettings = vi.fn().mockRejectedValue(new Error('Falha ao salvar'))
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updateProductSettings,
    } as never)
    const { result } = renderHook(() => useStockControlCard(product))

    await act(async () => result.current.handleAllowNegativeStockChange(true))
    await waitFor(() => expect(result.current.error).toBe('Falha ao salvar'))

    act(() => result.current.handleRevert())
    expect(result.current.allowNegativeStock).toBe(false)
    expect(result.current.error).toBeUndefined()
  })
})
