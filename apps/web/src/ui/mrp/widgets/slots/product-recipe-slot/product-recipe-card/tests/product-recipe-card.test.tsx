import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type { ProductRecipeDetails } from '@scoops/core/mrp/domain/structures'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductRecipeCard } from '../index'
import { useProductRecipeCard } from '../use-product-recipe-card'

vi.mock('../use-product-recipe-card', () => ({
  useProductRecipeCard: vi.fn(),
}))

const mockedUseProductRecipeCard = vi.mocked(useProductRecipeCard)

const ingredient = {
  id: 'line-1',
  ingredientProductId: 'ingredient-1',
  ingredientProductName: 'Leite',
  ingredientBrandName: 'Marca A',
  unit: 'l' as const,
  quantity: 2,
  unitCost: 3,
  lineCost: 6,
  cogsPercentage: 40,
  currentBalance: 10,
  capacity: 4,
  isLimiting: true,
}
const details: ProductRecipeDetails = {
  product: ProductFaker.fake({ id: 'product-1', name: 'Sorvete', unit: 'un' }),
  recipe: {
    id: 'recipe-1',
    yieldQuantity: 10,
    totalCost: 15,
    unitCost: 1.5,
    maximumProducibleQuantity: 20,
    ingredients: [ingredient],
  },
}

describe('ProductRecipeCard', () => {
  afterEach(cleanup)

  it('renders recipe metrics and delegates ingredient and production actions', () => {
    mockedUseProductRecipeCard.mockReturnValue({
      error: null,
      isPending: false,
      isValidYield: true,
      yieldQuantity: '10',
      handleSaveYield: vi.fn(),
      setYieldQuantity: vi.fn(),
    })
    const actions = {
      onAdd: vi.fn(),
      onEdit: vi.fn(),
      onProduce: vi.fn(),
      onRemove: vi.fn(),
    }
    render(<ProductRecipeCard details={details} {...actions} />)

    expect(screen.getByRole('heading', { name: 'Receita' })).toBeTruthy()
    expect(screen.getByText(/15,00/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Produzir/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ingrediente' }))
    fireEvent.click(screen.getByRole('button', { name: 'Editar Leite' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover Leite' }))

    expect(actions.onProduce).toHaveBeenCalledTimes(1)
    expect(actions.onAdd).toHaveBeenCalledTimes(1)
    expect(actions.onEdit).toHaveBeenCalledWith(ingredient)
    expect(actions.onRemove).toHaveBeenCalledWith(ingredient)
  })

  it('shows the non-editable empty state when there is no recipe', () => {
    mockedUseProductRecipeCard.mockReturnValue({
      error: null,
      isPending: false,
      isValidYield: false,
      yieldQuantity: '',
      handleSaveYield: vi.fn(),
      setYieldQuantity: vi.fn(),
    })
    const onProduce = vi.fn()
    render(
      <ProductRecipeCard
        details={{ ...details, recipe: null }}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onProduce={onProduce}
        onRemove={vi.fn()}
      />,
    )

    expect(
      screen.getAllByRole('button', { name: /Produzir/ })[0].hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen
        .getByRole('button', { name: 'Adicionar primeiro ingrediente' })
        .hasAttribute('disabled'),
    ).toBe(true)
    expect(onProduce).not.toHaveBeenCalled()
  })
})
