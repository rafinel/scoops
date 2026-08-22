import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RecipeIngredientsTable } from '.'

describe('RecipeIngredientsTable', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the server-provided COGS percentage without scaling it again', () => {
    render(
      <RecipeIngredientsTable
        ingredients={[
          {
            id: 'ingredient-1',
            ingredientProductId: 'product-ingredient-1',
            ingredientProductName: 'Polpa de morango',
            unit: 'kg',
            quantity: 2,
            unitCost: 4.5,
            lineCost: 9,
            cogsPercentage: 1.25,
            currentBalance: 10,
            capacity: 5_000,
            isLimiting: false,
          },
        ]}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByRole('cell', { name: '1,25%' })).toBeTruthy()
    expect(screen.queryByText('125,00%')).toBeNull()
  })
})
