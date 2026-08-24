import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RecipeIngredientsTable } from '../index'

describe('RecipeIngredientsTable', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the server-provided COGS percentage without scaling it again', () => {
    const ingredient = {
      id: 'ingredient-1',
      ingredientProductId: 'product-ingredient-1',
      ingredientProductName: 'Polpa de morango',
      unit: 'kg' as const,
      quantity: 2,
      unitCost: 4.5,
      lineCost: 9,
      cogsPercentage: 1.25,
      currentBalance: 10,
      capacity: 5_000,
      isLimiting: true,
    }
    const onEdit = vi.fn()
    const onRemove = vi.fn()

    render(
      <RecipeIngredientsTable
        ingredients={[ingredient]}
        onEdit={onEdit}
        onRemove={onRemove}
      />,
    )

    expect(screen.getByRole('cell', { name: '1,25%' })).toBeTruthy()
    expect(screen.queryByText('125,00%')).toBeNull()
    expect(screen.getByText('2 kg')).toBeTruthy()
    expect(screen.getByText(/9,00/)).toBeTruthy()
    expect(screen.getByText(/limitante/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Polpa de morango' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover Polpa de morango' }))
    expect(onEdit).toHaveBeenCalledWith(ingredient)
    expect(onRemove).toHaveBeenCalledWith(ingredient)
  })
})
