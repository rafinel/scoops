import { fireEvent, render, screen } from '@testing-library/react'
import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { ProductRecipeDetails } from '@scoops/core/mrp/domain/structures'
import { describe, expect, it, vi } from 'vitest'

import { ProductRecipeSlot } from '../index'
import { useProductRecipeSlot } from '../use-product-recipe-slot'

vi.mock('@/ui/mrp/widgets/pages/product-details-page', () => ({
  ProductDetailsPage: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}))
vi.mock('../use-product-recipe-slot', () => ({ useProductRecipeSlot: vi.fn() }))
vi.mock('../product-recipe-card', () => ({
  ProductRecipeCard: () => <div>recipe-card</div>,
}))

const mockedUseProductRecipeSlot = vi.mocked(useProductRecipeSlot)
const details: ProductRecipeDetails = {
  product: ProductFaker.fake({ id: 'product-1', name: 'Sorvete' }),
  recipe: null,
}
const baseSlot = () => ({
  details,
  isError: false,
  isLoading: false,
  isUnsupported: false,
  product: details.product,
  selectedAction: undefined,
  handleActionOpenChange: vi.fn(),
  handleActionSuccess: vi.fn(),
  handleBack: vi.fn(),
  handleRetry: vi.fn(),
  setSelectedAction: vi.fn(),
})

describe('ProductRecipeSlot', () => {
  it('renders the recipe card once data is ready', () => {
    mockedUseProductRecipeSlot.mockReturnValue(baseSlot())
    render(<ProductRecipeSlot productId='product-1' />)
    expect(screen.getByText('recipe-card')).toBeTruthy()
  })

  it('announces loading and exposes retry on failure', () => {
    mockedUseProductRecipeSlot.mockReturnValue({
      ...baseSlot(),
      details: undefined,
      isLoading: true,
    })
    const { rerender } = render(<ProductRecipeSlot productId='product-1' />)
    expect(screen.getByRole('status', { name: 'Carregando receita' })).toBeTruthy()

    const handleRetry = vi.fn()
    mockedUseProductRecipeSlot.mockReturnValue({
      ...baseSlot(),
      details: undefined,
      isError: true,
      handleRetry,
    })
    rerender(<ProductRecipeSlot productId='product-1' />)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })
})
