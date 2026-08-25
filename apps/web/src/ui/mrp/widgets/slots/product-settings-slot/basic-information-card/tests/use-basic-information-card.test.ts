import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { useUpdateProductSettingsAction } from '@/ui/mrp/hooks/use-update-product-settings-action'

import { useBasicInformationCard } from '../use-basic-information-card'

vi.mock('@/ui/mrp/hooks/use-update-product-settings-action', () => ({
  useUpdateProductSettingsAction: vi.fn(),
}))

const useUpdateProductSettingsActionMock = vi.mocked(useUpdateProductSettingsAction)
const product = ProductFaker.fake({
  name: 'Produto teste',
  idealStock: 12,
  status: 'active',
})
const sameUnitProduct = { ...product, unit: 'g' as const }

describe('useBasicInformationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updatingProductSettingsField: undefined,
      updateProductSettings: vi.fn().mockResolvedValue({
        product: { updatedAt: new Date('2026-02-01T00:00:00.000Z') },
      }),
    } as never)
  })

  it('saves edited name and ideal stock with the current product version', async () => {
    const updateProductSettings = vi.fn().mockResolvedValue({
      product: { updatedAt: new Date('2026-02-01T00:00:00.000Z') },
    })
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updatingProductSettingsField: undefined,
      updateProductSettings,
    } as never)
    const { result } = renderHook(() => useBasicInformationCard(product, vi.fn()))

    act(() => {
      result.current.handleNameChange('Novo nome')
      result.current.handleIdealStockChange('24,5')
    })
    act(() => {
      result.current.handleNameBlur()
      result.current.handleIdealStockBlur()
    })

    await waitFor(() => expect(updateProductSettings).toHaveBeenCalledTimes(2))
    expect(updateProductSettings).toHaveBeenCalledWith({
      field: 'name',
      input: { name: 'Novo nome', expectedUpdatedAt: product.updatedAt },
    })
    expect(updateProductSettings).toHaveBeenCalledWith({
      field: 'idealStock',
      input: { idealStock: 24.5, expectedUpdatedAt: product.updatedAt },
    })
  })

  it('exposes save errors and reverts a failed field to the product value', async () => {
    const updateProductSettings = vi.fn().mockRejectedValue(new Error('Falha ao salvar'))
    useUpdateProductSettingsActionMock.mockReturnValue({
      isUpdatingProductSettings: false,
      updatingProductSettingsField: undefined,
      updateProductSettings,
    } as never)
    const { result } = renderHook(() => useBasicInformationCard(product, vi.fn()))

    act(() => result.current.handleNameChange('Nome inválido'))
    act(() => result.current.handleNameBlur())
    await waitFor(() => expect(result.current.errors.name).toBe('Falha ao salvar'))

    act(() => result.current.handleRevert('name'))
    expect(result.current.name).toBe(product.name)
    expect(result.current.errors.name).toBeUndefined()
  })

  it('does not open a unit change for the product current unit', () => {
    const onUnitChange = vi.fn()
    const { result } = renderHook(() =>
      useBasicInformationCard(sameUnitProduct, onUnitChange),
    )
    result.current.unitTriggerRef.current = document.createElement('button')

    act(() => result.current.handleUnitChange('g'))

    expect(onUnitChange).not.toHaveBeenCalled()
  })
})
