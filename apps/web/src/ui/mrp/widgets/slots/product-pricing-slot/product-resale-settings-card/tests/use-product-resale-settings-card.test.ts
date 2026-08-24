import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { ProductPricingDetails } from '@scoops/core/mrp/domain/structures'

import { useSaveProductResaleConfigurationAction } from '@/ui/mrp/hooks/use-save-product-resale-configuration-action'

import { useProductResaleSettingsCard } from '../use-product-resale-settings-card'

vi.mock('@/ui/mrp/hooks/use-save-product-resale-configuration-action', () => ({
  useSaveProductResaleConfigurationAction: vi.fn(),
}))

const useSaveProductResaleConfigurationActionMock = vi.mocked(
  useSaveProductResaleConfigurationAction,
)

const createDetails = (): ProductPricingDetails => ({
  mode: 'resale-single',
  product: ProductFaker.fake({ categories: ['resale'] }),
  resale: [
    {
      configuration: {
        id: 'configuration-1',
        establishmentId: 'establishment-1',
        productId: 'product-1',
        price: 2500.52,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      packageQuantity: 1,
      isActive: true,
    },
  ],
  sizes: [],
})

const details = createDetails()

describe('useProductResaleSettingsCard', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    useSaveProductResaleConfigurationActionMock.mockReturnValue({
      error: null,
      isPending: false,
      saveProductResaleConfiguration: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('formats persisted prices with a comma and submits the numeric value', async () => {
    const saveProductResaleConfigurationMock = vi.fn().mockResolvedValue(undefined)
    useSaveProductResaleConfigurationActionMock.mockReturnValue({
      error: null,
      isPending: false,
      saveProductResaleConfiguration: saveProductResaleConfigurationMock,
    })

    const { result } = renderHook(() =>
      useProductResaleSettingsCard(details, 'product-1'),
    )

    await waitFor(() => expect(result.current.rows.single?.price).toBe('2500,52'))

    await act(async () => {
      await result.current.handleSave('single')
    })

    expect(saveProductResaleConfigurationMock).toHaveBeenCalledWith({
      brandId: undefined,
      input: { isActive: true, price: 2500.52 },
    })
  })

  it('keeps a validation error in the edited row without saving', async () => {
    const saveProductResaleConfigurationMock = vi.fn()
    useSaveProductResaleConfigurationActionMock.mockReturnValue({
      error: null,
      isPending: false,
      saveProductResaleConfiguration: saveProductResaleConfigurationMock,
    })

    const { result } = renderHook(() =>
      useProductResaleSettingsCard(details, 'product-1'),
    )
    await waitFor(() => expect(result.current.rows.single).toBeDefined())

    act(() => result.current.handleValueChange('single', 'price', 'invalid'))
    await act(async () => {
      await result.current.handleSave('single')
    })

    expect(result.current.rows.single?.error).toContain('Informe um preço válido')
    expect(saveProductResaleConfigurationMock).not.toHaveBeenCalled()
  })
})
