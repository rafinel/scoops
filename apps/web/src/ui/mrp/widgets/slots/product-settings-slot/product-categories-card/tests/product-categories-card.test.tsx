import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { ProductCategoriesCard } from '../index'
import { useProductCategoriesCard } from '../use-product-categories-card'

vi.mock('../use-product-categories-card', () => ({ useProductCategoriesCard: vi.fn() }))
const hookMock = vi.mocked(useProductCategoriesCard)

describe('ProductCategoriesCard', () => {
  it('renders all five categories and disables the Portion/Resale conflict', () => {
    const handleCategoryClick = vi.fn()
    hookMock.mockReturnValue({
      categoryRemovalImpact: undefined,
      categoryRemovalImpactError: null,
      dependencyCategory: undefined,
      error: undefined,
      handleCategoryClick,
      handleConfirmRemoval: vi.fn(),
      handleDialogOpenChange: vi.fn(),
      handleRetry: vi.fn(),
      isChangingCategories: false,
      isLoadingImpact: false,
      isPendingImpact: false,
      isSelected: () => false,
      retryImpact: vi.fn(),
      selectedCategory: undefined,
    })
    render(
      <ProductCategoriesCard
        product={ProductFaker.fake({ categories: ['portion'] })}
        retrySearch={{}}
      />,
    )
    for (const label of [
      'Ingrediente',
      'Fabricável',
      'Porção',
      'Acompanhamento',
      'Revenda',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeTruthy()
    }
    expect(screen.getByRole('button', { name: 'Revenda' }).hasAttribute('disabled')).toBe(
      true,
    )
  })
})
