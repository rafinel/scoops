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
      availableBrands: [],
      candidates: [],
      errors: {},
      handleBrandChange: vi.fn(),
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
      availableBrands: [],
      candidates: [],
      errors: {},
      handleBrandChange: vi.fn(),
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

  it('renders the available brand selector with the selected source', () => {
    const handleBrandChange = vi.fn()
    mockedDialog.mockReturnValue({
      actionError: null,
      availableBrands: [
        {
          brand: { id: 'brand-primary', name: 'Marca principal', isPrimary: true },
          stockQuantity: 10,
          unitPrice: 4,
        },
        {
          brand: { id: 'brand-alt', name: 'Marca alternativa', isPrimary: false },
          stockQuantity: 6,
          unitPrice: 5,
        },
      ],
      candidates: [],
      errors: {},
      handleBrandChange,
      handleIngredientProductChange: vi.fn(),
      handleQuantityChange: vi.fn(),
      handleSubmit: vi.fn((event) => event.preventDefault()),
      ingredientBrandId: 'brand-primary',
      ingredientProductId: 'ingredient-1',
      isPending: false,
      quantity: 2,
      selectedProduct: undefined,
      selectedSource: {
        brandId: 'brand-primary',
        brands: [],
        currentBalance: 10,
        name: 'Marca principal',
        unitCost: 4,
      },
      previewCogsPercentage: 40,
      previewLineCost: 8,
      register: vi.fn(() => ({ name: 'quantity', ref: vi.fn() })),
    } as never)

    render(
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

    expect(screen.getByRole('combobox', { name: 'Marca' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Marca' }).textContent).toContain(
      'Marca principal',
    )
    expect(screen.getAllByText('FONTE')[1]?.parentElement?.textContent).toContain(
      'Marca principal',
    )
    fireEvent.click(screen.getByRole('combobox', { name: 'Marca' }))
    expect(screen.getByRole('option', { name: /Marca alternativa/ })).toBeTruthy()
  })
})
