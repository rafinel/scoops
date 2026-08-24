import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RemoveRecipeIngredientDialog } from '../index'
import { useRemoveRecipeIngredientDialog } from '../use-remove-recipe-ingredient-dialog'

vi.mock('../use-remove-recipe-ingredient-dialog', () => ({
  useRemoveRecipeIngredientDialog: vi.fn(),
}))
const mockedDialog = vi.mocked(useRemoveRecipeIngredientDialog)
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
  isLimiting: false,
}

describe('RemoveRecipeIngredientDialog', () => {
  it('confirms removal and displays action errors', () => {
    const handleRemove = vi.fn()
    const onSuccess = vi.fn()
    mockedDialog.mockReturnValue({
      error: 'Falha ao remover',
      isPending: false,
      handleRemove,
    })
    render(
      <RemoveRecipeIngredientDialog
        ingredient={ingredient}
        onOpenChange={vi.fn()}
        onSuccess={onSuccess}
        open
        productId='product-1'
      />,
    )

    expect(screen.getByRole('alertdialog')).toBeTruthy()
    expect(screen.getByText(/Leite \(Marca A\) será removido/)).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('Falha ao remover')
    fireEvent.click(screen.getByRole('button', { name: 'Remover ingrediente' }))
    expect(handleRemove).toHaveBeenCalledWith('line-1', onSuccess)
  })
})
