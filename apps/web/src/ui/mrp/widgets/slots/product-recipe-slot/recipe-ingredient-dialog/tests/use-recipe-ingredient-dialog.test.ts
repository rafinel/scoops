import { act, fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAddRecipeIngredientAction } from '@/ui/mrp/hooks/use-add-recipe-ingredient-action'
import { useProductsQuery } from '@/ui/mrp/hooks/use-products-query'
import { useUpdateRecipeIngredientAction } from '@/ui/mrp/hooks/use-update-recipe-ingredient-action'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useRecipeIngredientDialog } from '../use-recipe-ingredient-dialog'

vi.mock('@/ui/mrp/hooks/use-add-recipe-ingredient-action', () => ({
  useAddRecipeIngredientAction: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-products-query', () => ({ useProductsQuery: vi.fn() }))
vi.mock('@/ui/mrp/hooks/use-update-recipe-ingredient-action', () => ({
  useUpdateRecipeIngredientAction: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  )
  return { ...actual, useQueries: vi.fn(() => []) }
})

const mockedAdd = vi.mocked(useAddRecipeIngredientAction)
const mockedProducts = vi.mocked(useProductsQuery)
const mockedUpdate = vi.mocked(useUpdateRecipeIngredientAction)
const mockedContext = vi.mocked(useRestContext)
const ingredient = {
  id: '11111111-1111-4111-8111-111111111111',
  ingredientProductId: '22222222-2222-4222-8222-222222222222',
  ingredientProductName: 'Leite',
  unit: 'l' as const,
  quantity: 2,
  unitCost: 3,
  lineCost: 6,
  cogsPercentage: 40,
  currentBalance: 10,
  capacity: 4,
  isLimiting: false,
}

describe('useRecipeIngredientDialog', () => {
  it('updates an existing ingredient and reports action failures', async () => {
    const updateRecipeIngredient = vi.fn().mockResolvedValue(undefined)
    mockedAdd.mockReturnValue({ addRecipeIngredient: vi.fn(), isPending: false } as never)
    mockedUpdate.mockReturnValue({ updateRecipeIngredient, isPending: false } as never)
    mockedProducts.mockReturnValue({ data: { items: [] } } as never)
    mockedContext.mockReturnValue({ mrpService: {} } as never)
    const onSuccess = vi.fn()
    const { result } = renderHook(() =>
      useRecipeIngredientDialog({
        existingProductIds: [],
        ingredient,
        open: true,
        onSuccess,
        productId: 'product-1',
        recipeTotalCost: 9,
      }),
    )

    const registered = result.current.register('quantity')
    const field = document.createElement('input')
    field.name = registered.name
    document.body.append(field)
    registered.ref(field)
    field.value = '3'
    await act(async () => {
      fireEvent.change(field, { target: { value: '3' } })
      await result.current.handleSubmit()
    })

    expect(updateRecipeIngredient).toHaveBeenCalledWith({
      lineId: '11111111-1111-4111-8111-111111111111',
      input: { quantity: 2 },
    })
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})
