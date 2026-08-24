import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RecipeIngredientDialog } from '../index'
import { useRecipeIngredientDialog } from '../use-recipe-ingredient-dialog'

vi.mock('../use-recipe-ingredient-dialog', () => ({ useRecipeIngredientDialog: vi.fn() }))
const mockedDialog = vi.mocked(useRecipeIngredientDialog)
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

describe('RecipeIngredientDialog', () => {
  it('renders add and edit states with preview feedback', () => {
    const handleIngredientProductChange = vi.fn()
    const handleQuantityChange = vi.fn()
    const handleSubmit = vi.fn((event) => event.preventDefault())
    mockedDialog.mockReturnValue({
      actionError: null,
      candidates: [],
      errors: {},
      handleIngredientProductChange,
      handleQuantityChange,
      handleSubmit,
      ingredientProductId: '',
      isPending: false,
      quantity: 2,
      selectedProduct: undefined,
      selectedSource: { currentBalance: 10, name: 'Estoque único', unitCost: 3 },
      previewCogsPercentage: 40,
      previewLineCost: 6,
      register: vi.fn(() => ({
        name: 'quantity',
        onChange: handleQuantityChange,
        ref: vi.fn(),
      })),
    } as never)
    const { rerender } = render(
      <RecipeIngredientDialog
        existingProductIds={[]}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
        recipeTotalCost={9}
        unit='l'
      />,
    )
    expect(screen.getByRole('heading', { name: 'Adicionar ingrediente' })).toBeTruthy()
    expect(
      screen.getByText('Não há ingredientes elegíveis com custo ou fonte atual.'),
    ).toBeTruthy()
    expect(screen.getByText('R$ 3,00')).toBeTruthy()

    mockedDialog.mockReturnValue({
      actionError: 'Falha ao salvar',
      candidates: [],
      errors: {},
      handleIngredientProductChange,
      handleQuantityChange,
      handleSubmit,
      ingredientProductId: 'ingredient-1',
      isPending: false,
      quantity: 2,
      selectedProduct: undefined,
      selectedSource: undefined,
      previewCogsPercentage: 0,
      previewLineCost: 0,
      register: vi.fn(() => ({
        name: 'quantity',
        onChange: handleQuantityChange,
        ref: vi.fn(),
      })),
    } as never)
    rerender(
      <RecipeIngredientDialog
        existingProductIds={[]}
        ingredient={ingredient}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
        open
        productId='product-1'
        recipeTotalCost={9}
        unit='l'
      />,
    )
    expect(screen.getByRole('heading', { name: 'Editar ingrediente' })).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('Falha ao salvar')
    fireEvent.submit(
      screen
        .getByRole('heading', { name: 'Editar ingrediente' })
        .closest('[role="dialog"]')
        ?.querySelector('form') as HTMLFormElement,
    )
    expect(handleSubmit).toHaveBeenCalled()
  })
})
