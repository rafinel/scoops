import { act, renderHook, waitFor } from '@testing-library/react'
import { ProductCategory, ProductUnit } from '@scoops/core/mrp/domain/structures'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { productDetailsRoute } from '@/constants/routes'
import { useRegisterProductAction } from '@/ui/mrp/hooks/use-register-product-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useProductRegistrationPage } from '../use-product-registration-page'

vi.mock('@/ui/mrp/hooks/use-register-product-action', () => ({
  useRegisterProductAction: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({ useNavigation: vi.fn() }))

const useRegisterProductActionMock = vi.mocked(useRegisterProductAction)
const useNavigationMock = vi.mocked(useNavigation)

function createSubmitEvent() {
  return { persist: vi.fn(), preventDefault: vi.fn() }
}

describe('useProductRegistrationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRegisterProductActionMock.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({ id: 'product-1' }),
    } as never)
    useNavigationMock.mockReturnValue({
      navigateTo: vi.fn().mockResolvedValue(undefined),
      navigateToPath: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('exposes default values and updates every simple form field', () => {
    const { result } = renderHook(() => useProductRegistrationPage())

    expect(result.current.allowNegativeStock).toBe(false)
    expect(result.current.brandErrors).toEqual([])
    expect(result.current.brands).toEqual([])
    expect(result.current.calculatedInitialStock).toBe(0)
    expect(result.current.categories).toEqual([])
    expect(result.current.currentUnitCost).toBe('')
    expect(result.current.fieldErrors).toEqual({
      brands: undefined,
      categories: undefined,
      currentUnitCost: undefined,
      idealStock: undefined,
      initialStock: undefined,
      name: undefined,
    })
    expect(result.current.formError).toBeNull()
    expect(result.current.idealStock).toBe('0')
    expect(result.current.initialStock).toBe('0')
    expect(result.current.isPending).toBe(false)
    expect(result.current.name).toBe('')
    expect(result.current.register('name')).toEqual(
      expect.objectContaining({ name: 'name' }),
    )
    expect(result.current.stockControl).toBe('single')
    expect(result.current.unit).toBe(ProductUnit.Unit)

    act(() => {
      result.current.handleAllowNegativeStockChange(true)
      result.current.handleCurrentUnitCostChange('3,50')
      result.current.handleIdealStockChange('10')
      result.current.handleInitialStockChange('4')
      result.current.handleNameChange('Chocolate')
      result.current.handleUnitChange(ProductUnit.Kilogram)
    })

    expect(result.current.allowNegativeStock).toBe(true)
    expect(result.current.currentUnitCost).toBe('3,50')
    expect(result.current.idealStock).toBe('10')
    expect(result.current.initialStock).toBe('4')
    expect(result.current.name).toBe('Chocolate')
    expect(result.current.unit).toBe(ProductUnit.Kilogram)
  })

  it('reports validation errors and clears them as fields become valid', async () => {
    const { result } = renderHook(() => useProductRegistrationPage())

    await act(async () => result.current.handleRegister(createSubmitEvent() as never))

    expect(result.current.fieldErrors.name).toBe('Informe o nome do produto.')
    expect(result.current.fieldErrors.categories).toBe(
      'Selecione pelo menos uma categoria.',
    )
    expect(
      useRegisterProductActionMock.mock.results[0]?.value.mutateAsync,
    ).not.toHaveBeenCalled()

    act(() => {
      result.current.handleNameChange('Chocolate')
      result.current.handleProductCategoryToggle(ProductCategory.Ingredient)
    })

    await waitFor(() => {
      expect(result.current.fieldErrors.name).toBeUndefined()
      expect(result.current.fieldErrors.categories).toBeUndefined()
    })

    act(() => result.current.handleStockControlChange('by-brand'))
    await act(async () => result.current.handleRegister(createSubmitEvent() as never))

    await waitFor(() =>
      expect(result.current.brandErrors[0]?.name).toBe('Informe o nome da marca.'),
    )
    act(() => result.current.handleBrandChange('brand-1', { name: 'Frooty' }))
    await waitFor(() => expect(result.current.brandErrors[0]?.name).toBeUndefined())
  })

  it('keeps portion and resale categories exclusive and disables their opposite option', () => {
    const { result } = renderHook(() => useProductRegistrationPage())

    act(() => result.current.handleProductCategoryToggle(ProductCategory.Portion))
    expect(result.current.categories).toEqual([ProductCategory.Portion])
    expect(result.current.isCategoryDisabled(ProductCategory.Resale)).toBe(true)
    expect(result.current.isCategoryDisabled(ProductCategory.Portion)).toBe(false)

    act(() => result.current.handleProductCategoryToggle(ProductCategory.Resale))
    expect(result.current.categories).toEqual([ProductCategory.Resale])
    expect(result.current.isCategoryDisabled(ProductCategory.Portion)).toBe(true)

    act(() => result.current.handleProductCategoryToggle(ProductCategory.Resale))
    expect(result.current.categories).toEqual([])
    expect(result.current.isCategoryDisabled(ProductCategory.Portion)).toBe(false)
    expect(result.current.isCategoryDisabled(ProductCategory.Resale)).toBe(false)
  })

  it('forces manufacturable products to single stock and rejects by-brand changes', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'product-1' })
    useRegisterProductActionMock.mockReturnValue({
      isPending: false,
      mutateAsync,
    } as never)
    const { result } = renderHook(() => useProductRegistrationPage())

    act(() => result.current.handleStockControlChange('by-brand'))
    expect(result.current.stockControl).toBe('by-brand')
    expect(result.current.brands).toHaveLength(1)

    act(() => result.current.handleNameChange('Produto fabricável'))
    act(() => result.current.handleProductCategoryToggle(ProductCategory.Manufacturable))
    expect(result.current.stockControl).toBe('single')

    await act(async () => result.current.handleRegister(createSubmitEvent() as never))
    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Produto fabricável',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Manufacturable],
      stockControl: 'single',
      allowNegativeStock: false,
      idealStock: 0,
      initialStock: 0,
      currentUnitCost: undefined,
      brands: undefined,
    })

    const brandsBeforeRejectedChange = result.current.brands
    act(() => result.current.handleStockControlChange('by-brand'))
    expect(result.current.stockControl).toBe('single')
    expect(result.current.brands).toBe(brandsBeforeRejectedChange)

    act(() => result.current.handleProductCategoryToggle(ProductCategory.Manufacturable))
    act(() => result.current.handleStockControlChange('by-brand'))
    expect(result.current.stockControl).toBe('by-brand')
    expect(result.current.brands).toHaveLength(1)
  })

  it('adds, edits, promotes, removes and protects the final brand', () => {
    const { result } = renderHook(() => useProductRegistrationPage())

    act(() => result.current.handleUnitChange(ProductUnit.Kilogram))
    act(() => result.current.handleStockControlChange('by-brand'))
    expect(result.current.brands[0]).toEqual({
      id: 'brand-1',
      name: '',
      unit: ProductUnit.Kilogram,
      packageQuantity: '1',
      packagePrice: '0,00',
      packageCount: '0',
      isPrimary: true,
    })

    act(() => result.current.handleAddBrand())
    expect(result.current.brands).toHaveLength(2)
    expect(result.current.brands[1]?.isPrimary).toBe(false)

    act(() =>
      result.current.handleBrandChange('brand-2', {
        name: 'Frutamil',
        packageCount: '4',
        packagePrice: '7,25',
        packageQuantity: '2,5',
      }),
    )
    expect(result.current.brands[1]).toEqual({
      id: 'brand-2',
      name: 'Frutamil',
      unit: ProductUnit.Kilogram,
      packageQuantity: '2,5',
      packagePrice: '7,25',
      packageCount: '4',
      isPrimary: false,
    })
    expect(result.current.calculatedInitialStock).toBe(10)

    act(() =>
      result.current.handleBrandChange('brand-2', {
        packageCount: 'invalid',
        packageQuantity: 'invalid',
      }),
    )
    expect(result.current.calculatedInitialStock).toBe(0)

    act(() => result.current.handleStockControlChange('by-brand'))
    expect(result.current.brands).toHaveLength(2)
    act(() => result.current.handlePrimaryBrandChange('brand-2'))
    expect(result.current.brands.map((brand) => brand.isPrimary)).toEqual([false, true])
    act(() => result.current.handleRemoveBrand('brand-1'))
    expect(result.current.brands).toHaveLength(1)
    expect(result.current.brands[0]?.isPrimary).toBe(true)

    act(() => result.current.handleAddBrand())
    act(() => result.current.handlePrimaryBrandChange('brand-3'))
    act(() => result.current.handleRemoveBrand('brand-3'))
    expect(result.current.brands[0]?.id).toBe('brand-2')
    expect(result.current.brands[0]?.isPrimary).toBe(true)
    act(() => result.current.handleRemoveBrand('brand-2'))
    expect(result.current.brands).toHaveLength(1)
  })

  it('calculates and submits a valid by-brand payload with localized numbers', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'product-1' })
    const navigateToPath = vi.fn().mockResolvedValue(undefined)
    useRegisterProductActionMock.mockReturnValue({
      isPending: false,
      mutateAsync,
    } as never)
    useNavigationMock.mockReturnValue({ navigateTo: vi.fn(), navigateToPath })
    const { result } = renderHook(() => useProductRegistrationPage())

    act(() => result.current.handleNameChange('Polpa'))
    act(() => result.current.handleUnitChange(ProductUnit.Kilogram))
    act(() => result.current.handleProductCategoryToggle(ProductCategory.Ingredient))
    act(() => result.current.handleStockControlChange('by-brand'))
    act(() =>
      result.current.handleBrandChange('brand-1', {
        name: 'Frooty',
        packageCount: '4',
        packagePrice: '12,50',
        packageQuantity: '2,5',
      }),
    )
    act(() => result.current.handleAddBrand())
    act(() =>
      result.current.handleBrandChange('brand-2', {
        name: 'Frutamil',
        packageCount: '2',
        packagePrice: '3,25',
        packageQuantity: '1,5',
      }),
    )

    expect(result.current.calculatedInitialStock).toBe(13)
    await act(async () => result.current.handleRegister(createSubmitEvent() as never))

    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Polpa',
      unit: ProductUnit.Kilogram,
      categories: [ProductCategory.Ingredient],
      stockControl: 'by-brand',
      allowNegativeStock: false,
      idealStock: 0,
      initialStock: 13,
      currentUnitCost: undefined,
      brands: [
        {
          name: 'Frooty',
          unit: ProductUnit.Kilogram,
          packageQuantity: 2.5,
          packageValue: 12.5,
          initialQuantity: 10,
          isPrimary: true,
        },
        {
          name: 'Frutamil',
          unit: ProductUnit.Kilogram,
          packageQuantity: 1.5,
          packageValue: 3.25,
          initialQuantity: 3,
          isPrimary: false,
        },
      ],
    })
    expect(navigateToPath).toHaveBeenCalledWith(productDetailsRoute('product-1'))
  })

  it('submits a single-stock payload after switching from by-brand with invalid hidden fields', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'product-1' })
    useRegisterProductActionMock.mockReturnValue({
      isPending: false,
      mutateAsync,
    } as never)
    const { result } = renderHook(() => useProductRegistrationPage())

    act(() => {
      result.current.handleNameChange('Chocolate')
      result.current.handleProductCategoryToggle(ProductCategory.Ingredient)
      result.current.handleStockControlChange('by-brand')
      result.current.handleStockControlChange('single')
    })

    expect(result.current.stockControl).toBe('single')
    expect(result.current.brands).toHaveLength(1)
    await act(async () => result.current.handleRegister(createSubmitEvent() as never))

    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Chocolate',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Ingredient],
      stockControl: 'single',
      allowNegativeStock: false,
      idealStock: 0,
      initialStock: 0,
      currentUnitCost: undefined,
      brands: undefined,
    })
  })

  it('submits typed single-stock values and navigates to the created product', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'product-1' })
    const navigateToPath = vi.fn().mockResolvedValue(undefined)
    useRegisterProductActionMock.mockReturnValue({
      isPending: false,
      mutateAsync,
    } as never)
    useNavigationMock.mockReturnValue({ navigateTo: vi.fn(), navigateToPath })
    const { result } = renderHook(() => useProductRegistrationPage())

    act(() => {
      result.current.handleNameChange('Chocolate')
      result.current.handleProductCategoryToggle(ProductCategory.Ingredient)
      result.current.handleInitialStockChange('4')
      result.current.handleIdealStockChange('10')
      result.current.handleCurrentUnitCostChange('3.50')
    })
    await act(async () => result.current.handleRegister(createSubmitEvent() as never))

    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Chocolate',
      unit: ProductUnit.Unit,
      categories: [ProductCategory.Ingredient],
      stockControl: 'single',
      allowNegativeStock: false,
      idealStock: 10,
      initialStock: 4,
      currentUnitCost: 3.5,
      brands: undefined,
    })
    expect(navigateToPath).toHaveBeenCalledWith(productDetailsRoute('product-1'))
  })

  it('resets invalid submission state so a corrected form can be submitted', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'product-1' })
    useRegisterProductActionMock.mockReturnValue({
      isPending: false,
      mutateAsync,
    } as never)
    const { result } = renderHook(() => useProductRegistrationPage())

    await act(async () => result.current.handleRegister(createSubmitEvent() as never))
    expect(mutateAsync).not.toHaveBeenCalled()

    act(() => {
      result.current.handleNameChange('Chocolate')
      result.current.handleProductCategoryToggle(ProductCategory.Ingredient)
    })
    await act(async () => result.current.handleRegister(createSubmitEvent() as never))

    expect(mutateAsync).toHaveBeenCalledOnce()
  })

  it('prevents duplicate submissions while the first mutation is active', async () => {
    let resolveMutation: (value: { id: string }) => void = () => undefined
    const mutation = new Promise<{ id: string }>((resolve) => {
      resolveMutation = resolve
    })
    const mutateAsync = vi.fn().mockReturnValue(mutation)
    useRegisterProductActionMock.mockReturnValue({
      isPending: false,
      mutateAsync,
    } as never)
    const { result } = renderHook(() => useProductRegistrationPage())
    act(() => {
      result.current.handleNameChange('Chocolate')
      result.current.handleProductCategoryToggle(ProductCategory.Ingredient)
    })

    const firstEvent = createSubmitEvent()
    const secondEvent = createSubmitEvent()
    act(() => result.current.handleRegister(firstEvent as never))
    act(() => result.current.handleRegister(secondEvent as never))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce())
    expect(secondEvent.preventDefault).toHaveBeenCalledOnce()
    resolveMutation({ id: 'product-1' })
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce())
  })

  it('exposes pending mutation state and navigates back when cancelled', () => {
    const navigateTo = vi.fn().mockResolvedValue(undefined)
    useRegisterProductActionMock.mockReturnValue({
      isPending: true,
      mutateAsync: vi.fn(),
    } as never)
    useNavigationMock.mockReturnValue({ navigateTo, navigateToPath: vi.fn() })
    const { result } = renderHook(() => useProductRegistrationPage())

    expect(result.current.isPending).toBe(true)
    act(() => result.current.handleCancel())
    expect(navigateTo).toHaveBeenCalledWith('products')
  })

  it('preserves entered values and exposes server and fallback failures for recovery', async () => {
    const mutateAsync = vi
      .fn()
      .mockRejectedValueOnce(new Error('Produto duplicado'))
      .mockRejectedValueOnce({ code: 'UNKNOWN' })
    useRegisterProductActionMock.mockReturnValue({
      isPending: false,
      mutateAsync,
    } as never)
    const { result } = renderHook(() => useProductRegistrationPage())

    act(() => {
      result.current.handleNameChange('Produto existente')
      result.current.handleProductCategoryToggle(ProductCategory.Ingredient)
      result.current.handleIdealStockChange('5')
    })
    await act(async () => result.current.handleRegister(createSubmitEvent() as never))

    expect(result.current.formError).toBe('Produto duplicado')
    expect(result.current.name).toBe('Produto existente')
    act(() => result.current.handleNameChange('Produto corrigido'))
    expect(result.current.formError).toBeNull()

    await act(async () => result.current.handleRegister(createSubmitEvent() as never))
    expect(result.current.formError).toBe('Não foi possível criar o produto.')
  })
})
