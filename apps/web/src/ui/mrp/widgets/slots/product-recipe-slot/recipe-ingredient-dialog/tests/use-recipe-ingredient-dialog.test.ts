import { act, fireEvent, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import { useQueries } from '@tanstack/react-query'

import { useAddRecipeIngredientAction } from '@/ui/mrp/hooks/use-add-recipe-ingredient-action'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'
import { useProductsQuery } from '@/ui/mrp/hooks/use-products-query'
import { useUpdateRecipeIngredientAction } from '@/ui/mrp/hooks/use-update-recipe-ingredient-action'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useRecipeIngredientDialog } from '../use-recipe-ingredient-dialog'

vi.mock('@/ui/mrp/hooks/use-add-recipe-ingredient-action', () => ({
  useAddRecipeIngredientAction: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-products-query', () => ({ useProductsQuery: vi.fn() }))
vi.mock('@/ui/mrp/hooks/use-product-stock-query', () => ({
  useProductStockQuery: vi.fn(),
}))
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
const mockedStock = vi.mocked(useProductStockQuery)
const mockedUpdate = vi.mocked(useUpdateRecipeIngredientAction)
const mockedContext = vi.mocked(useRestContext)
const mockedQueries = vi.mocked(useQueries)
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
  beforeEach(() => {
    vi.clearAllMocks()
    mockedAdd.mockReturnValue({ addRecipeIngredient: vi.fn(), isPending: false } as never)
    mockedUpdate.mockReturnValue({
      updateRecipeIngredient: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as never)
    mockedProducts.mockReturnValue({ data: { items: [] } } as never)
    mockedStock.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: false,
    } as never)
    mockedContext.mockReturnValue({ mrpService: {} } as never)
    mockedQueries.mockReturnValue([] as never)
  })

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

  it('defaults to the persisted brand and submits a changed brand with the new source', async () => {
    const updateRecipeIngredient = vi.fn().mockResolvedValue(undefined)
    const product = fakeByBrandProduct()
    const brands = fakeBrands(product.id)
    const editIngredient = {
      ...ingredient,
      ingredientProductId: product.id,
      ingredientProductName: product.name,
      ingredientBrandId: brands[1].brand.id,
      ingredientBrandName: brands[1].brand.name,
      unit: product.unit,
    }
    mockedUpdate.mockReturnValue({ updateRecipeIngredient, isPending: false } as never)
    mockedProducts.mockReturnValue({ data: { items: [] } } as never)
    mockedStock.mockReturnValue(fakeStockResponse(product, brands) as never)

    const { result } = renderHook(() =>
      useRecipeIngredientDialog({
        existingProductIds: [],
        ingredient: editIngredient,
        open: true,
        onSuccess: vi.fn(),
        productId: 'product-1',
        recipeTotalCost: 20,
      }),
    )

    await waitFor(() => {
      expect(result.current.ingredientBrandId).toBe(brands[1].brand.id)
    })
    expect(mockedStock).toHaveBeenCalledWith(editIngredient.ingredientProductId)
    expect(result.current.availableBrands).toHaveLength(2)
    expect(result.current.selectedSource).toMatchObject({
      currentBalance: 6,
      name: 'Marca alternativa',
      unitCost: 5,
    })

    act(() => result.current.handleBrandChange(brands[0].brand.id))
    expect(result.current.selectedSource).toMatchObject({
      currentBalance: 10,
      name: 'Marca principal',
      unitCost: 4,
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(updateRecipeIngredient).toHaveBeenCalledWith({
      lineId: ingredient.id,
      input: { ingredientBrandId: brands[0].brand.id, quantity: ingredient.quantity },
    })
  })

  it('defaults an existing by-brand ingredient to its primary brand outside the catalog page', async () => {
    const product = fakeByBrandProduct()
    const brands = fakeBrands(product.id)
    const editIngredient = {
      ...ingredient,
      ingredientProductId: product.id,
      ingredientProductName: product.name,
      unit: product.unit,
    }
    mockedProducts.mockReturnValue({ data: { items: [] } } as never)
    mockedStock.mockReturnValue(fakeStockResponse(product, brands) as never)

    const { result } = renderHook(() =>
      useRecipeIngredientDialog({
        existingProductIds: [],
        ingredient: editIngredient,
        open: true,
        onSuccess: vi.fn(),
        productId: 'product-1',
        recipeTotalCost: 20,
      }),
    )

    await waitFor(() => {
      expect(result.current.ingredientBrandId).toBe(brands[0].brand.id)
    })
    expect(result.current.availableBrands).toHaveLength(2)
    expect(result.current.selectedSource).toMatchObject({
      name: 'Marca principal',
      unitCost: 4,
    })
  })

  it('selects the primary brand when adding a by-brand ingredient', async () => {
    const addRecipeIngredient = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    const product = fakeByBrandProduct()
    const brands = fakeBrands(product.id)
    mockedAdd.mockReturnValue({ addRecipeIngredient, isPending: false } as never)
    mockedProducts.mockReturnValue({
      data: { items: [fakeCatalogRow(product)] },
    } as never)
    mockedQueries.mockReturnValue([fakeStockResponse(product, brands)] as never)

    const { result } = renderHook(() =>
      useRecipeIngredientDialog({
        existingProductIds: [],
        open: true,
        onSuccess,
        productId: 'product-1',
        recipeTotalCost: 0,
      }),
    )

    act(() => result.current.handleIngredientProductChange(product.id))
    await waitFor(() => {
      expect(result.current.ingredientBrandId).toBe(brands[0].brand.id)
    })
    setQuantity(result, '3')

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(addRecipeIngredient).toHaveBeenCalledWith({
      ingredientBrandId: brands[0].brand.id,
      ingredientProductId: product.id,
      quantity: 3,
    })
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('uses single stock without a brand and exposes update failures', async () => {
    const updateRecipeIngredient = vi.fn().mockRejectedValue(new Error('Falha ao salvar'))
    const product = ProductFaker.fake({
      id: ingredient.ingredientProductId,
      name: ingredient.ingredientProductName,
      categories: ['ingredient'],
      currentUnitCost: 3,
      stockControl: 'single',
      unit: ingredient.unit,
    })
    const onSuccess = vi.fn()
    mockedUpdate.mockReturnValue({ updateRecipeIngredient, isPending: false } as never)
    mockedProducts.mockReturnValue({ data: { items: [] } } as never)
    mockedStock.mockReturnValue(fakeStockResponse(product, []) as never)

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

    await waitFor(() => expect(result.current.selectedSource?.name).toBe('Estoque único'))
    expect(result.current.availableBrands).toEqual([])

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(updateRecipeIngredient).toHaveBeenCalledWith({
      lineId: ingredient.id,
      input: { quantity: ingredient.quantity },
    })
    expect(result.current.actionError).toBe(
      'Não foi possível salvar o ingrediente. Tente novamente.',
    )
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

function setQuantity(
  result: { current: ReturnType<typeof useRecipeIngredientDialog> },
  value: string,
) {
  const field = document.createElement('input')
  document.body.append(field)
  const registered = result.current.register('quantity', { valueAsNumber: true })
  field.name = registered.name
  field.type = 'number'
  field.value = value
  registered.ref(field)
  act(() => {
    registered.onChange({ target: field, type: 'change' })
  })
  field.remove()
}

function fakeByBrandProduct() {
  return ProductFaker.fake({
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Leite',
    categories: ['ingredient'],
    stockControl: 'by-brand',
    unit: 'kg',
  })
}

function fakeCatalogRow(product: ReturnType<typeof fakeByBrandProduct>) {
  return {
    product,
    brandCount: product.stockControl === 'by-brand' ? 2 : 0,
    idealStock: 10,
    stockQuantity: 16,
    stockSituation: 'normal' as const,
  }
}

function fakeBrands(productId: string) {
  const now = new Date('2026-08-22T12:00:00.000Z')
  return [
    {
      brand: {
        id: '33333333-3333-4333-8333-333333333333',
        productId,
        name: 'Marca principal',
        packageQuantity: 1,
        packagePrice: 4,
        isPrimary: true,
        unit: 'kg' as const,
        createdAt: now,
        updatedAt: now,
      },
      stockQuantity: 10,
      unitPrice: 4,
    },
    {
      brand: {
        id: '44444444-4444-4444-8444-444444444444',
        productId,
        name: 'Marca alternativa',
        packageQuantity: 1,
        packagePrice: 5,
        isPrimary: false,
        unit: 'kg' as const,
        createdAt: now,
        updatedAt: now,
      },
      stockQuantity: 6,
      unitPrice: 5,
    },
  ]
}

function fakeStockResponse(
  product: ReturnType<typeof fakeByBrandProduct>,
  brands: ReturnType<typeof fakeBrands>,
) {
  return {
    data: {
      product,
      stockQuantity: brands.reduce((total, item) => total + item.stockQuantity, 0),
      stockSituation: 'normal' as const,
      brands,
    },
    isError: false,
    isPending: false,
  }
}
