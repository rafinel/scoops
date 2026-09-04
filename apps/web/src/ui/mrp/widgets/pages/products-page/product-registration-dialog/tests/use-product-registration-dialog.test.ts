import { act, renderHook } from '@testing-library/react'
import { ProductCategory, ProductStockControl } from '@scoops/core/mrp/domain/structures'
import { describe, expect, it, vi } from 'vitest'

import { useRegisterProductAction } from '@/ui/mrp/hooks/use-register-product-action'
import { useProductRegistrationDialog } from '../use-product-registration-dialog'

vi.mock('@/ui/mrp/hooks/use-register-product-action', () => ({
  useRegisterProductAction: vi.fn(),
}))
const useRegisterProductActionMock = vi.mocked(useRegisterProductAction)

describe('useProductRegistrationDialog', () => {
  it('keeps portion and resale categories mutually exclusive and creates brands on demand', () => {
    useRegisterProductActionMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never)
    const { result } = renderHook(() =>
      useProductRegistrationDialog({ onSuccess: vi.fn() }),
    )

    act(() => result.current.handleProductCategoryToggle(ProductCategory.Portion))
    act(() => result.current.handleProductCategoryToggle(ProductCategory.Resale))
    expect(result.current.categories).toEqual([ProductCategory.Resale])

    act(() => result.current.handleStockControlChange(ProductStockControl.ByBrand))
    expect(result.current.stockControl).toBe(ProductStockControl.ByBrand)
    expect(result.current.brands).toHaveLength(1)
    expect(result.current.isCategoryDisabled(ProductCategory.Portion)).toBe(true)
  })

  it('calculates brand stock, preserves brand drafts, and prevents brand stock for manufacturable products', () => {
    useRegisterProductActionMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as never)
    const { result } = renderHook(() =>
      useProductRegistrationDialog({ onSuccess: vi.fn() }),
    )

    act(() => result.current.handleProductCategoryToggle(ProductCategory.Manufacturable))
    act(() => result.current.handleStockControlChange('by-brand'))
    expect(result.current.stockControl).toBe('single')
    expect(result.current.brands).toEqual([])

    act(() => result.current.handleProductCategoryToggle(ProductCategory.Manufacturable))
    act(() => result.current.handleProductCategoryToggle(ProductCategory.Ingredient))
    act(() => result.current.handleStockControlChange('by-brand'))
    act(() =>
      result.current.handleBrandChange('brand-1', {
        name: 'Fornecedor A',
        packageQuantity: '2',
        packageCount: '3',
        packagePrice: '12,50',
      }),
    )
    act(() => result.current.handleAddBrand())
    expect(result.current.brands).toHaveLength(2)
    expect(result.current.calculatedInitialStock).toBe(6)
    act(() => result.current.handleRemoveBrand('brand-1'))
    expect(result.current.brands).toHaveLength(1)
    act(() => result.current.handleRemoveBrand('brand-2'))
    expect(result.current.brands).toHaveLength(1)
  })

  it('submits ingredient cost and resets state after a successful single-stock registration', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    useRegisterProductActionMock.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never)
    const { result } = renderHook(() => useProductRegistrationDialog({ onSuccess }))

    act(() => {
      result.current.handleNameChange('Chocolate')
      result.current.handleProductCategoryToggle(ProductCategory.Ingredient)
      result.current.handleInitialStockChange('4')
      result.current.handleIdealStockChange('10')
      result.current.handleCurrentUnitCostChange('3.50')
      result.current.handleAllowNegativeStockChange(true)
    })
    await act(async () => result.current.handleRegister())

    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Chocolate',
      unit: 'un',
      categories: [ProductCategory.Ingredient],
      stockControl: 'single',
      allowNegativeStock: true,
      idealStock: 10,
      initialStock: 4,
      currentUnitCost: 3.5,
      brands: undefined,
    })
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(result.current.name).toBe('')
    expect(result.current.categories).toEqual([])
  })

  it('keeps the form error visible when registration fails and clears it on the next edit', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Produto duplicado'))
    useRegisterProductActionMock.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never)
    const { result } = renderHook(() =>
      useProductRegistrationDialog({ onSuccess: vi.fn() }),
    )

    act(() => {
      result.current.handleNameChange('Chocolate')
      result.current.handleProductCategoryToggle(ProductCategory.Ingredient)
      result.current.handleIdealStockChange('1')
    })
    await act(async () => result.current.handleRegister())

    expect(result.current.formError).toBe('Produto duplicado')
    act(() => result.current.handleNameChange('Chocolate branco'))
    expect(result.current.formError).toBeNull()
  })
})
