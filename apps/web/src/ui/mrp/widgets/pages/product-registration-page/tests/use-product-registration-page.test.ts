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
const analyticsMocks = vi.hoisted(() => ({
  completeWorkflow: vi.fn(),
  endWorkflow: vi.fn(),
  recordFailure: vi.fn(),
  recordValidationFailure: vi.fn(),
  startAttempt: vi.fn(),
  startWorkflow: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-analytics-context', () => ({
  useAnalyticsContext: vi.fn(() => analyticsMocks),
}))

function createSubmitEvent() {
  return { persist: vi.fn(), preventDefault: vi.fn() }
}

describe('useProductRegistrationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    analyticsMocks.startWorkflow.mockReturnValue({ occurrenceId: 'workflow-1' })
    analyticsMocks.startAttempt.mockReturnValue({ attempt: 1 })
    useRegisterProductActionMock.mockReturnValue({
      isPending: false,
      registerProduct: vi.fn().mockResolvedValue({ id: 'product-1' }),
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
      useRegisterProductActionMock.mock.results[0]?.value.registerProduct,
    ).not.toHaveBeenCalled()
    expect(analyticsMocks.recordValidationFailure).toHaveBeenCalledWith({
      attempt: { attempt: 1 },
      fields: ['name', 'categories'],
    })

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

  it('keeps one product-creation occurrence across rerenders and ends it on unmount', () => {
    const { rerender, unmount } = renderHook(() => useProductRegistrationPage())
    const workflow = { occurrenceId: 'workflow-1' }
    const entryKey = analyticsMocks.startWorkflow.mock.calls[0]?.[0]?.entryKey

    rerender()

    expect(entryKey).toBeTypeOf('string')
    expect(analyticsMocks.startWorkflow).toHaveBeenCalledTimes(1)
    unmount()
    expect(analyticsMocks.endWorkflow).toHaveBeenCalledWith({ workflow })
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
    const registerProduct = vi.fn().mockResolvedValue({ id: 'product-1' })
    useRegisterProductActionMock.mockReturnValue({
      isPending: false,
      registerProduct,
    } as never)
    const { result } = renderHook(() => useProductRegistrationPage())

    act(() => result.current.handleStockControlChange('by-brand'))
    expect(result.current.stockControl).toBe('by-brand')
    expect(result.current.brands).toHaveLength(1)

    act(() => result.current.handleNameChange('Produto fabricável'))
    act(() => result.current.handleProductCategoryToggle(ProductCategory.Manufacturable))
    expect(result.current.stockControl).toBe('single')

    await act(async () => result.current.handleRegister(createSubmitEvent() as never))
    expect(registerProduct).toHaveBeenCalledWith(
      {
        name: 'Produto fabricável',
        unit: ProductUnit.Unit,
        categories: [ProductCategory.Manufacturable],
        stockControl: 'single',
        allowNegativeStock: false,
        idealStock: 0,
        initialStock: 0,
        currentUnitCost: undefined,
        brands: undefined,
      },
      expect.anything(),
    )
    expect(analyticsMocks.startAttempt).toHaveBeenCalledWith({
      workflow: { occurrenceId: 'workflow-1' },
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
      registerProduct: mutateAsync,
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

    expect(mutateAsync).toHaveBeenCalledWith(
      {
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
      },
      expect.anything(),
    )
    expect(navigateToPath).toHaveBeenCalledWith(productDetailsRoute('product-1'))
  })

  it('submits a single-stock payload after switching from by-brand with invalid hidden fields', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'product-1' })
    useRegisterProductActionMock.mockReturnValue({
      isPending: false,
      registerProduct: mutateAsync,
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

    expect(mutateAsync).toHaveBeenCalledWith(
      {
        name: 'Chocolate',
        unit: ProductUnit.Unit,
        categories: [ProductCategory.Ingredient],
        stockControl: 'single',
        allowNegativeStock: false,
        idealStock: 0,
        initialStock: 0,
        currentUnitCost: undefined,
        brands: undefined,
      },
      expect.anything(),
    )
  })

  it('submits typed single-stock values and navigates to the created product', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'product-1' })
    const navigateToPath = vi.fn().mockResolvedValue(undefined)
    useRegisterProductActionMock.mockReturnValue({
      isPending: false,
      registerProduct: mutateAsync,
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

    expect(mutateAsync).toHaveBeenCalledWith(
      {
        name: 'Chocolate',
        unit: ProductUnit.Unit,
        categories: [ProductCategory.Ingredient],
        stockControl: 'single',
        allowNegativeStock: false,
        idealStock: 10,
        initialStock: 4,
        currentUnitCost: 3.5,
        brands: undefined,
      },
      expect.anything(),
    )
    expect(navigateToPath).toHaveBeenCalledWith(productDetailsRoute('product-1'))
  })

  it('resets invalid submission state so a corrected form can be submitted', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'product-1' })
    useRegisterProductActionMock.mockReturnValue({
      isPending: false,
      registerProduct: mutateAsync,
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
      registerProduct: mutateAsync,
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
      registerProduct: vi.fn(),
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
      registerProduct: mutateAsync,
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

  describe('sale prices', () => {
    const RESALE_MESSAGE =
      'Informe um preço de revenda maior ou igual a zero, com até duas casas decimais.'
    const ACCOMPANIMENT_MESSAGE =
      'Informe um preço maior ou igual a zero, com até duas casas decimais.'

    function renderRegistration() {
      const registerProduct = vi.fn().mockResolvedValue({ id: 'product-1' })
      useRegisterProductActionMock.mockReturnValue({
        isPending: false,
        registerProduct,
      } as never)
      const { result } = renderHook(() => useProductRegistrationPage())
      return { registerProduct, result }
    }

    type RegistrationResult = ReturnType<typeof renderRegistration>['result']

    function toggle(result: RegistrationResult, ...categories: ProductCategory[]) {
      for (const category of categories) {
        act(() => result.current.handleProductCategoryToggle(category))
      }
    }

    async function submit(result: RegistrationResult) {
      await act(async () => result.current.handleRegister(createSubmitEvent() as never))
    }

    function sentInput(registerProduct: ReturnType<typeof vi.fn>) {
      return registerProduct.mock.calls[0]?.[0] as Record<string, unknown>
    }

    it('starts with empty hidden prices and updates each price independently', () => {
      const { result } = renderRegistration()

      expect(result.current.resalePrice).toBe('')
      expect(result.current.accompanimentPrice).toBe('')
      expect(result.current.isResalePriceVisible).toBe(false)
      expect(result.current.isAccompanimentPriceVisible).toBe(false)

      act(() => result.current.handleResalePriceChange('12,00'))
      expect(result.current.resalePrice).toBe('12,00')
      expect(result.current.accompanimentPrice).toBe('')

      act(() => result.current.handleAccompanimentPriceChange('9'))
      expect(result.current.resalePrice).toBe('12,00')
      expect(result.current.accompanimentPrice).toBe('9')
    })

    it.each([
      [
        'Resale',
        (r: RegistrationResult) => toggle(r, ProductCategory.Resale),
        true,
        false,
      ],
      [
        'Accompaniment',
        (r: RegistrationResult) => toggle(r, ProductCategory.Accompaniment),
        false,
        true,
      ],
      [
        'Resale and Accompaniment',
        (r: RegistrationResult) =>
          toggle(r, ProductCategory.Resale, ProductCategory.Accompaniment),
        true,
        true,
      ],
      [
        'Resale on By-brand stock then Manufacturable (forced Single)',
        (r: RegistrationResult) => {
          act(() => r.current.handleStockControlChange('by-brand'))
          toggle(r, ProductCategory.Resale)
          expect(r.current.isResalePriceVisible).toBe(false)
          toggle(r, ProductCategory.Manufacturable)
        },
        true,
        false,
      ],
      [
        'Portion',
        (r: RegistrationResult) => toggle(r, ProductCategory.Portion),
        false,
        false,
      ],
      [
        'Portion and Accompaniment',
        (r: RegistrationResult) =>
          toggle(r, ProductCategory.Portion, ProductCategory.Accompaniment),
        false,
        false,
      ],
      [
        'Resale with By-brand stock',
        (r: RegistrationResult) => {
          toggle(r, ProductCategory.Resale)
          act(() => r.current.handleStockControlChange('by-brand'))
        },
        false,
        false,
      ],
      [
        'Accompaniment with By-brand stock',
        (r: RegistrationResult) => {
          toggle(r, ProductCategory.Accompaniment)
          act(() => r.current.handleStockControlChange('by-brand'))
        },
        false,
        false,
      ],
      [
        'Ingredient only',
        (r: RegistrationResult) => toggle(r, ProductCategory.Ingredient),
        false,
        false,
      ],
    ])(
      'shows the price fields for %s',
      (_name, setup, isResalePriceVisible, isAccompanimentPriceVisible) => {
        const { result } = renderRegistration()

        setup(result)

        expect(result.current.isResalePriceVisible).toBe(isResalePriceVisible)
        expect(result.current.isAccompanimentPriceVisible).toBe(
          isAccompanimentPriceVisible,
        )
      },
    )

    it('keeps the other entered values while categories and stock control change', () => {
      const { result } = renderRegistration()

      act(() => {
        result.current.handleNameChange('Paçoca')
        result.current.handleUnitChange(ProductUnit.Kilogram)
        result.current.handleInitialStockChange('4')
        result.current.handleIdealStockChange('10')
      })
      toggle(result, ProductCategory.Resale, ProductCategory.Accompaniment)
      act(() => result.current.handleStockControlChange('by-brand'))
      toggle(result, ProductCategory.Resale)

      expect(result.current.name).toBe('Paçoca')
      expect(result.current.unit).toBe(ProductUnit.Kilogram)
      expect(result.current.initialStock).toBe('4')
      expect(result.current.idealStock).toBe('10')
      expect(result.current.categories).toEqual([ProductCategory.Accompaniment])
    })

    it('keeps a hidden price, neither validates nor sends it, and restores it when shown again', async () => {
      const { registerProduct, result } = renderRegistration()
      act(() => result.current.handleNameChange('Paçoca'))
      toggle(
        result,
        ProductCategory.Ingredient,
        ProductCategory.Resale,
        ProductCategory.Accompaniment,
      )
      act(() => {
        result.current.handleResalePriceChange('12,50')
        result.current.handleAccompanimentPriceChange('-1')
      })
      toggle(result, ProductCategory.Resale, ProductCategory.Accompaniment)

      expect(result.current.isResalePriceVisible).toBe(false)
      expect(result.current.isAccompanimentPriceVisible).toBe(false)
      await submit(result)

      expect(registerProduct).toHaveBeenCalledOnce()
      expect(sentInput(registerProduct)).not.toHaveProperty('resalePrice')
      expect(sentInput(registerProduct)).not.toHaveProperty('accompanimentPrice')
      expect(result.current.fieldErrors.resalePrice).toBeUndefined()
      expect(result.current.fieldErrors.accompanimentPrice).toBeUndefined()

      toggle(result, ProductCategory.Resale, ProductCategory.Accompaniment)
      expect(result.current.resalePrice).toBe('12,50')
      expect(result.current.accompanimentPrice).toBe('-1')
    })

    it.each([
      ['resalePrice', RESALE_MESSAGE],
      ['accompanimentPrice', ACCOMPANIMENT_MESSAGE],
    ] as const)(
      'rejects invalid %s input without a request and keeps every entered value',
      async (field, message) => {
        for (const value of ['-1', '1,234', 'abc', '10000000000000000']) {
          const { registerProduct, result } = renderRegistration()
          act(() => result.current.handleNameChange('Paçoca'))
          toggle(result, ProductCategory.Resale, ProductCategory.Accompaniment)
          act(() => {
            result.current.handleResalePriceChange('3,00')
            result.current.handleAccompanimentPriceChange('4,00')
          })
          act(() =>
            field === 'resalePrice'
              ? result.current.handleResalePriceChange(value)
              : result.current.handleAccompanimentPriceChange(value),
          )

          await submit(result)

          expect(registerProduct).not.toHaveBeenCalled()
          expect(result.current.fieldErrors[field]).toBe(message)
          expect(result.current[field]).toBe(value)
          expect(result.current.name).toBe('Paçoca')
          expect(analyticsMocks.recordValidationFailure).toHaveBeenLastCalledWith({
            attempt: { attempt: 1 },
            fields: [field],
          })
        }
      },
    )

    it('clears a price error once the value becomes valid', async () => {
      const { result } = renderRegistration()
      act(() => result.current.handleNameChange('Paçoca'))
      toggle(result, ProductCategory.Resale)
      act(() => result.current.handleResalePriceChange('-1'))
      await submit(result)
      expect(result.current.fieldErrors.resalePrice).toBe(RESALE_MESSAGE)

      act(() => result.current.handleResalePriceChange('10'))

      await waitFor(() => expect(result.current.fieldErrors.resalePrice).toBeUndefined())
    })

    it.each([
      ['0', 0],
      ['12,5', 12.5],
      ['12.50', 12.5],
    ])('sends %s as the number %s for both visible prices', async (typed, expected) => {
      const { registerProduct, result } = renderRegistration()
      act(() => result.current.handleNameChange('Paçoca'))
      toggle(result, ProductCategory.Resale, ProductCategory.Accompaniment)
      act(() => {
        result.current.handleResalePriceChange(typed)
        result.current.handleAccompanimentPriceChange(typed)
      })

      await submit(result)

      expect(sentInput(registerProduct)).toMatchObject({
        categories: [ProductCategory.Resale, ProductCategory.Accompaniment],
        resalePrice: expected,
        accompanimentPrice: expected,
      })
    })

    it('sends no price key for an empty or blank visible price', async () => {
      const { registerProduct, result } = renderRegistration()
      act(() => result.current.handleNameChange('Paçoca'))
      toggle(result, ProductCategory.Resale, ProductCategory.Accompaniment)
      act(() => result.current.handleAccompanimentPriceChange('   '))

      await submit(result)

      expect(registerProduct).toHaveBeenCalledOnce()
      expect(sentInput(registerProduct)).not.toHaveProperty('resalePrice')
      expect(sentInput(registerProduct)).not.toHaveProperty('accompanimentPrice')
    })

    it('never copies one price into the other', async () => {
      const { registerProduct, result } = renderRegistration()
      act(() => result.current.handleNameChange('Paçoca'))
      toggle(result, ProductCategory.Resale, ProductCategory.Accompaniment)

      act(() => result.current.handleResalePriceChange('12,00'))
      expect(result.current.accompanimentPrice).toBe('')
      await submit(result)

      expect(sentInput(registerProduct)).toMatchObject({ resalePrice: 12 })
      expect(sentInput(registerProduct)).not.toHaveProperty('accompanimentPrice')
    })

    it('keeps both typed prices after a server rejection of the prices', async () => {
      const { registerProduct, result } = renderRegistration()
      registerProduct.mockRejectedValueOnce(
        new Error(
          'O preço de revenda é permitido apenas para produtos de revenda com estoque único.',
        ),
      )
      act(() => result.current.handleNameChange('Paçoca'))
      toggle(result, ProductCategory.Resale, ProductCategory.Accompaniment)
      act(() => {
        result.current.handleResalePriceChange('12,00')
        result.current.handleAccompanimentPriceChange('9,00')
      })

      await submit(result)

      expect(result.current.formError).toBe(
        'O preço de revenda é permitido apenas para produtos de revenda com estoque único.',
      )
      expect(result.current.resalePrice).toBe('12,00')
      expect(result.current.accompanimentPrice).toBe('9,00')
    })
  })
  describe('sizes', () => {
    function renderRegistration() {
      const registerProduct = vi.fn().mockResolvedValue({ id: 'product-1' })
      useRegisterProductActionMock.mockReturnValue({
        isPending: false,
        registerProduct,
      } as never)
      const { result } = renderHook(() => useProductRegistrationPage())
      return { registerProduct, result }
    }

    type RegistrationResult = ReturnType<typeof renderRegistration>['result']

    function toggle(result: RegistrationResult, ...categories: ProductCategory[]) {
      for (const category of categories) {
        act(() => result.current.handleProductCategoryToggle(category))
      }
    }

    function fillRow(
      result: RegistrationResult,
      index: number,
      values: { name?: string; quantity?: string; price?: string },
    ) {
      const sizeId = result.current.sizeFields.sizes[index]?.id as string
      act(() => result.current.sizeFields.onSizeChange(sizeId, values))
    }

    async function submit(result: RegistrationResult) {
      await act(async () => result.current.handleRegister(createSubmitEvent() as never))
    }

    function sentInput(registerProduct: ReturnType<typeof vi.fn>) {
      return registerProduct.mock.calls[0]?.[0] as Record<string, unknown>
    }

    it('starts with one empty row and shows the section only while Portion is selected', () => {
      const { result } = renderRegistration()

      expect(result.current.sizeFields.sizes).toEqual([
        { id: 'size-0', name: '', quantity: '', price: '' },
      ])
      expect(result.current.isSizesSectionVisible).toBe(false)
      toggle(result, ProductCategory.Portion)
      expect(result.current.isSizesSectionVisible).toBe(true)
      toggle(result, ProductCategory.Portion)
      expect(result.current.isSizesSectionVisible).toBe(false)
      toggle(result, ProductCategory.Ingredient)
      expect(result.current.isSizesSectionVisible).toBe(false)
    })

    it('keeps the section visible for a By-brand Portion', () => {
      const { result } = renderRegistration()
      toggle(result, ProductCategory.Portion)

      act(() => result.current.handleStockControlChange('by-brand'))

      expect(result.current.isSizesSectionVisible).toBe(true)
    })

    it('adds rows with fresh ids, edits one row and removes rows without limit', () => {
      const { result } = renderRegistration()
      toggle(result, ProductCategory.Portion)

      act(() => result.current.sizeFields.onAddSize())
      act(() => result.current.sizeFields.onAddSize())
      expect(result.current.sizeFields.sizes.map((size) => size.id)).toEqual([
        'size-0',
        'size-1',
        'size-2',
      ])

      fillRow(result, 1, { name: 'Médio', quantity: '0,5' })
      expect(result.current.sizeFields.sizes[1]).toEqual({
        id: 'size-1',
        name: 'Médio',
        quantity: '0,5',
        price: '',
      })
      expect(result.current.sizeFields.sizes[0]?.name).toBe('')

      act(() => result.current.sizeFields.onRemoveSize('size-0'))
      expect(result.current.sizeFields.sizes.map((size) => size.id)).toEqual([
        'size-1',
        'size-2',
      ])
      act(() => result.current.sizeFields.onRemoveSize('size-1'))
      act(() => result.current.sizeFields.onRemoveSize('size-2'))
      expect(result.current.sizeFields.sizes).toEqual([])
    })

    it('sends the typed rows as numbers, trims names and omits empty rows', async () => {
      const { registerProduct, result } = renderRegistration()
      act(() => result.current.handleNameChange('Açaí'))
      toggle(result, ProductCategory.Portion)
      act(() => result.current.sizeFields.onAddSize())
      act(() => result.current.sizeFields.onAddSize())
      fillRow(result, 0, { name: ' Pequeno ', quantity: '1,5', price: '12.50' })
      fillRow(result, 2, { name: 'Grande', quantity: '2', price: ',50' })

      await submit(result)

      expect(registerProduct).toHaveBeenCalledOnce()
      expect(sentInput(registerProduct)).toMatchObject({
        categories: [ProductCategory.Portion],
        sizes: [
          { name: 'Pequeno', quantity: 1.5, price: 12.5 },
          { name: 'Grande', quantity: 2, price: 0.5 },
        ],
      })
    })

    it('sends a zero size price', async () => {
      const { registerProduct, result } = renderRegistration()
      act(() => result.current.handleNameChange('Açaí'))
      toggle(result, ProductCategory.Portion)
      fillRow(result, 0, { name: 'Grande', quantity: '2', price: '0' })

      await submit(result)

      expect(sentInput(registerProduct)).toMatchObject({
        sizes: [{ name: 'Grande', quantity: 2, price: 0 }],
      })
    })

    it('sends no sizes key when every row is empty', async () => {
      const { registerProduct, result } = renderRegistration()
      act(() => result.current.handleNameChange('Açaí'))
      toggle(result, ProductCategory.Portion)
      act(() => result.current.sizeFields.onAddSize())

      await submit(result)

      expect(registerProduct).toHaveBeenCalledOnce()
      expect(sentInput(registerProduct)).not.toHaveProperty('sizes')
      expect(result.current.sizeFields.sizeErrors).toEqual(
        [{}, {}].map(() => ({
          name: undefined,
          quantity: undefined,
          price: undefined,
        })),
      )
    })

    it.each([
      [
        'a row with only a name',
        { name: 'Pequeno' },
        {
          quantity: 'Informe uma quantidade maior que zero, com até três casas decimais.',
          price: 'Informe um preço válido, com até duas casas decimais.',
        },
      ],
      [
        'an invalid quantity and price',
        { name: 'Pequeno', quantity: '1,2345', price: '-1' },
        {
          quantity: 'Informe uma quantidade maior que zero, com até três casas decimais.',
          price: 'Informe um preço válido, com até duas casas decimais.',
        },
      ],
      [
        'a quantity at the numeric limit',
        { name: 'Pequeno', quantity: '1000000000000000', price: '5' },
        {
          quantity: 'Informe uma quantidade maior que zero, com até três casas decimais.',
        },
      ],
      [
        'a price at the numeric limit',
        { name: 'Pequeno', quantity: '1', price: '10000000000000000' },
        { price: 'Informe um preço válido, com até duas casas decimais.' },
      ],
      [
        'a name over 120 characters',
        { name: 'a'.repeat(121), quantity: '1', price: '5' },
        { name: 'Informe o nome do tamanho.' },
      ],
      [
        'a quantity of zero',
        { name: 'Pequeno', quantity: '0', price: '5' },
        {
          quantity: 'Informe uma quantidade maior que zero, com até três casas decimais.',
        },
      ],
      [
        'text instead of numbers',
        { name: 'Pequeno', quantity: 'abc', price: 'abc' },
        {
          quantity: 'Informe uma quantidade maior que zero, com até três casas decimais.',
          price: 'Informe um preço válido, com até duas casas decimais.',
        },
      ],
    ])(
      'blocks submit with %s and reports the field errors beside the row',
      async (_name, values, expectedErrors) => {
        const { registerProduct, result } = renderRegistration()
        act(() => result.current.handleNameChange('Açaí'))
        toggle(result, ProductCategory.Portion)
        fillRow(result, 0, values)

        await submit(result)

        expect(registerProduct).not.toHaveBeenCalled()
        expect(result.current.sizeFields.sizeErrors[0]).toEqual({
          name: undefined,
          quantity: undefined,
          price: undefined,
          ...expectedErrors,
        })
        expect(result.current.sizeFields.sizes[0]).toMatchObject(values)
        expect(analyticsMocks.recordValidationFailure).toHaveBeenCalledWith({
          attempt: { attempt: 1 },
          fields: Object.keys(expectedErrors).map((field) => `sizes.*.${field}`),
        })
      },
    )

    it('accepts the largest values below the numeric limits', async () => {
      const { registerProduct, result } = renderRegistration()
      act(() => result.current.handleNameChange('Açaí'))
      toggle(result, ProductCategory.Portion)
      fillRow(result, 0, {
        name: 'Máximo',
        quantity: '999999999999999',
        price: '9999999999999998',
      })

      await submit(result)

      expect(registerProduct).toHaveBeenCalledOnce()
    })

    it('reports a duplicate name on the later row only', async () => {
      const { registerProduct, result } = renderRegistration()
      act(() => result.current.handleNameChange('Açaí'))
      toggle(result, ProductCategory.Portion)
      act(() => result.current.sizeFields.onAddSize())
      fillRow(result, 0, { name: 'Médio', quantity: '1', price: '5' })
      fillRow(result, 1, { name: ' médio ', quantity: '2', price: '8' })

      await submit(result)

      expect(registerProduct).not.toHaveBeenCalled()
      expect(result.current.sizeFields.sizeErrors[0]?.name).toBeUndefined()
      expect(result.current.sizeFields.sizeErrors[1]?.name).toBe(
        'Já existe um tamanho com esse nome.',
      )
    })

    it('shows no row error while typing before the first submit', async () => {
      const { result } = renderRegistration()
      toggle(result, ProductCategory.Portion)

      fillRow(result, 0, { name: 'Pequeno' })
      act(() => result.current.sizeFields.onAddSize())
      await waitFor(() => expect(result.current.sizeFields.sizes).toHaveLength(2))

      expect(result.current.sizeFields.sizeErrors).toEqual([
        { name: undefined, quantity: undefined, price: undefined },
        { name: undefined, quantity: undefined, price: undefined },
      ])
    })

    it('clears a row error once the field becomes valid', async () => {
      const { result } = renderRegistration()
      act(() => result.current.handleNameChange('Açaí'))
      toggle(result, ProductCategory.Portion)
      fillRow(result, 0, { name: 'Pequeno' })
      await submit(result)
      expect(result.current.sizeFields.sizeErrors[0]?.price).toBeDefined()

      fillRow(result, 0, { quantity: '1', price: '5' })

      await waitFor(() => {
        expect(result.current.sizeFields.sizeErrors[0]?.quantity).toBeUndefined()
        expect(result.current.sizeFields.sizeErrors[0]?.price).toBeUndefined()
      })
    })

    it('keeps the rows while Portion is unselected, neither validating nor sending them', async () => {
      const { registerProduct, result } = renderRegistration()
      act(() => result.current.handleNameChange('Açaí'))
      toggle(result, ProductCategory.Portion)
      act(() => result.current.sizeFields.onAddSize())
      fillRow(result, 0, { name: 'Pequeno' })
      fillRow(result, 1, { name: 'Grande', quantity: '2', price: '9' })
      toggle(result, ProductCategory.Portion, ProductCategory.Ingredient)

      await submit(result)

      expect(registerProduct).toHaveBeenCalledOnce()
      expect(sentInput(registerProduct)).not.toHaveProperty('sizes')
      expect(result.current.sizeFields.sizeErrors[0]?.quantity).toBeUndefined()

      toggle(result, ProductCategory.Portion)
      expect(result.current.sizeFields.sizes).toEqual([
        { id: 'size-0', name: 'Pequeno', quantity: '', price: '' },
        { id: 'size-1', name: 'Grande', quantity: '2', price: '9' },
      ])
    })

    it('keeps the typed rows after a server rejection', async () => {
      const { registerProduct, result } = renderRegistration()
      registerProduct.mockRejectedValueOnce(
        new Error('Já existe um tamanho com esse nome para o produto.'),
      )
      act(() => result.current.handleNameChange('Açaí'))
      toggle(result, ProductCategory.Portion)
      fillRow(result, 0, { name: 'Pequeno', quantity: '1', price: '5' })

      await submit(result)

      expect(result.current.formError).toBe(
        'Já existe um tamanho com esse nome para o produto.',
      )
      expect(result.current.sizeFields.sizes[0]).toMatchObject({
        name: 'Pequeno',
        quantity: '1',
        price: '5',
      })
    })
  })
})
