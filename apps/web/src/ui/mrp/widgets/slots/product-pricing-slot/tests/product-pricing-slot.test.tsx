import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { ProductPricingSlot } from '../index'
import { useProductPricingSlot } from '../use-product-pricing-slot'

vi.mock('@/ui/mrp/widgets/pages/product-details-page', () => ({
  ProductDetailsPage: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../use-product-pricing-slot', () => ({
  useProductPricingSlot: vi.fn(),
}))

const useProductPricingSlotMock = vi.mocked(useProductPricingSlot)

describe('ProductPricingSlot', () => {
  beforeEach(() => {
    useProductPricingSlotMock.mockReturnValue({
      handleActionOpenChange: vi.fn(),
      handleActionSuccess: vi.fn(async () => undefined),
      handleAdd: vi.fn(),
      handleBack: vi.fn(),
      handleEdit: vi.fn(),
      handleRemove: vi.fn(),
      handleRetry: vi.fn(),
      pricingError: false,
      isLoadingPricing: false,
      pricing: {
        mode: 'portion',
        product: ProductFaker.fake({ categories: ['portion'], name: 'Açaí' }),
        resale: [],
        sizes: [],
      },
      selectedAction: undefined,
    })
  })

  it('renders the loading state through the pricing slot boundary', () => {
    useProductPricingSlotMock.mockReturnValue({
      ...useProductPricingSlotMock.mock.results[0]?.value,
      handleActionOpenChange: vi.fn(),
      handleActionSuccess: vi.fn(async () => undefined),
      handleAdd: vi.fn(),
      handleBack: vi.fn(),
      handleEdit: vi.fn(),
      handleRemove: vi.fn(),
      handleRetry: vi.fn(),
      pricingError: false,
      isLoadingPricing: true,
      pricing: undefined,
      selectedAction: undefined,
    })

    render(<ProductPricingSlot productId='product-1' />)

    expect(
      screen.getByRole('status', { name: 'Carregando preços do produto' }),
    ).toBeTruthy()
  })

  it('renders the Portion empty action and accessible section heading', () => {
    render(<ProductPricingSlot productId='product-1' />)

    expect(screen.getByRole('heading', { name: 'Tamanhos e preços' })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Adicionar primeiro tamanho' }),
    ).toBeTruthy()
  })
})
