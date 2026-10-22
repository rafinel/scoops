import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AccompanimentTypeFaker,
  ProductAccompanimentFaker,
} from '@scoops/core/mrp/domain/entities/fakers'
import type {
  GlobalAccompanimentDetails,
  ProductAccompanimentCandidate,
  ProductAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'

import { useAccompanimentCandidatesQuery } from '@/ui/mrp/hooks/use-accompaniment-candidates-query'
import { useAccompanimentTypesQuery } from '@/ui/mrp/hooks/use-accompaniment-types-query'
import { useLinkAccompanimentPortionsAction } from '@/ui/mrp/hooks/use-link-accompaniment-portions-action'
import { useLinkProductAccompanimentAction } from '@/ui/mrp/hooks/use-link-product-accompaniment-action'
import { useProductPricingQuery } from '@/ui/mrp/hooks/use-product-pricing-query'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'
import { useUpdateGlobalAccompanimentAction } from '@/ui/mrp/hooks/use-update-global-accompaniment-action'
import { useUpdateProductAccompanimentAction } from '@/ui/mrp/hooks/use-update-product-accompaniment-action'

import { useProductAccompanimentDialog } from '../use-product-accompaniment-dialog'

vi.mock('@/ui/mrp/hooks/use-accompaniment-candidates-query', () => ({
  useAccompanimentCandidatesQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-accompaniment-types-query', () => ({
  useAccompanimentTypesQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-link-accompaniment-portions-action', () => ({
  useLinkAccompanimentPortionsAction: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-link-product-accompaniment-action', () => ({
  useLinkProductAccompanimentAction: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-product-pricing-query', () => ({
  useProductPricingQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-product-stock-query', () => ({
  useProductStockQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-update-global-accompaniment-action', () => ({
  useUpdateGlobalAccompanimentAction: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-update-product-accompaniment-action', () => ({
  useUpdateProductAccompanimentAction: vi.fn(),
}))

const useAccompanimentCandidatesQueryMock = vi.mocked(useAccompanimentCandidatesQuery)
const useAccompanimentTypesQueryMock = vi.mocked(useAccompanimentTypesQuery)
const useLinkAccompanimentPortionsActionMock = vi.mocked(
  useLinkAccompanimentPortionsAction,
)
const useLinkProductAccompanimentActionMock = vi.mocked(useLinkProductAccompanimentAction)
const useProductPricingQueryMock = vi.mocked(useProductPricingQuery)
const useProductStockQueryMock = vi.mocked(useProductStockQuery)
const useUpdateGlobalAccompanimentActionMock = vi.mocked(
  useUpdateGlobalAccompanimentAction,
)
const useUpdateProductAccompanimentActionMock = vi.mocked(
  useUpdateProductAccompanimentAction,
)

const candidate: ProductAccompanimentCandidate = {
  productId: 'product-2',
  name: 'Granola',
  unit: 'g',
  stockControl: 'single',
  accompanimentPrice: null,
  isGlobal: false,
  hasPortionLinks: false,
}
const type = AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' })
const editItem: ProductAccompanimentDetails = {
  ...ProductAccompanimentFaker.fake({
    id: 'link-1',
    accompanimentProductId: candidate.productId,
    accompanimentTypeId: type.id,
    quantityPerPortion: 20,
  }),
  accompanimentProductName: candidate.name,
  accompanimentTypeName: type.name,
  unit: 'g' as const,
  salePrice: 3,
  estimatedCost: 0.45,
  isGlobal: false,
  hasOtherPortionLinks: false,
}

describe('useProductAccompanimentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAccompanimentCandidatesQueryMock.mockReturnValue({
      data: [candidate],
      isError: false,
      isFetching: true,
      isPending: false,
      refetch: vi.fn(),
    } as never)
    useAccompanimentTypesQueryMock.mockReturnValue({
      data: { items: [{ type, usageCount: 0 }] },
      isError: false,
      isFetching: true,
      isPending: false,
    } as never)
    useProductStockQueryMock.mockReturnValue({
      data: { brands: [], product: {} },
      isError: false,
      isFetching: true,
      isPending: false,
      refetch: vi.fn(),
    } as never)
    useProductPricingQueryMock.mockReturnValue({
      pricing: {
        accompanimentPrice: null,
        suggestedAccompanimentPrice: 3,
        mode: 'resale-single',
      },
      pricingError: false,
      isLoadingPricing: false,
      isRefreshingPricing: false,
      retryPricing: vi.fn(),
    } as never)
    useLinkProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      linkProductAccompaniment: vi.fn().mockResolvedValue(undefined),
    } as never)
    useLinkAccompanimentPortionsActionMock.mockReturnValue({
      isPending: false,
      linkAccompanimentPortions: vi.fn().mockResolvedValue(undefined),
    } as never)
    useUpdateGlobalAccompanimentActionMock.mockReturnValue({
      isPending: false,
      updateGlobalAccompaniment: vi.fn().mockResolvedValue(undefined),
    } as never)
    useUpdateProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      updateProductAccompaniment: vi.fn().mockResolvedValue(undefined),
    } as never)
  })

  afterEach(() => {
    cleanup()
  })

  it('links a selected accompaniment with the parsed portion quantity', async () => {
    const linkProductAccompaniment = vi.fn().mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    useLinkProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      linkProductAccompaniment,
    } as never)

    const { result } = renderHook(() =>
      useProductAccompanimentDialog({
        onSuccess,
        open: true,
        productId: 'product-1',
      }),
    )

    expect(result.current.isRefreshing).toBe(true)

    const quantity = result.current.register('quantityPerPortion')
    const quantityField = document.createElement('input')
    quantityField.name = quantity.name
    document.body.append(quantityField)
    quantity.ref(quantityField)
    const price = result.current.register('accompanimentPrice')
    const priceField = document.createElement('input')
    priceField.name = price.name
    document.body.append(priceField)
    price.ref(priceField)

    act(() => {
      result.current.handleValueChange('accompanimentProductId', candidate.productId)
      result.current.handleValueChange('accompanimentTypeId', type.id)
    })
    await act(async () => {
      quantityField.value = '20,5'
      await quantity.onChange({ target: quantityField })
      priceField.value = '3,00'
      await price.onChange({ target: priceField })
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(linkProductAccompaniment).toHaveBeenCalledWith({
      accompanimentProductId: candidate.productId,
      accompanimentPrice: 3,
      accompanimentTypeId: type.id,
      quantityPerPortion: 20.5,
    })
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('updates an existing link and maps action failures', async () => {
    const updateProductAccompaniment = vi
      .fn()
      .mockRejectedValue(new Error('request failed'))
    useUpdateProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      updateProductAccompaniment,
    } as never)
    useProductPricingQueryMock.mockReturnValue({
      pricing: {
        accompanimentPrice: 3,
        suggestedAccompanimentPrice: null,
        mode: 'accompaniment',
      },
      pricingError: false,
      isLoadingPricing: false,
      isRefreshingPricing: false,
      retryPricing: vi.fn(),
    } as never)

    const { result } = renderHook(() =>
      useProductAccompanimentDialog({
        item: editItem,
        onSuccess: vi.fn(),
        open: true,
        productId: 'product-1',
      }),
    )
    const quantity = result.current.register('quantityPerPortion')
    const quantityField = document.createElement('input')
    quantityField.name = quantity.name
    document.body.append(quantityField)
    quantity.ref(quantityField)
    const price = result.current.register('accompanimentPrice')
    const priceField = document.createElement('input')
    priceField.name = price.name
    document.body.append(priceField)
    price.ref(priceField)

    await act(async () => {
      quantityField.value = '25'
      await quantity.onChange({ target: quantityField })
      priceField.value = '3,00'
      await price.onChange({ target: priceField })
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(updateProductAccompaniment).toHaveBeenCalledWith({
      linkId: 'link-1',
      input: { accompanimentTypeId: type.id, quantityPerPortion: 25 },
    })
    expect(result.current.actionError).toBe('request failed')
  })

  it('sends an intentional zero price while keeping zero distinct from unset', async () => {
    const updateProductAccompaniment = vi.fn().mockResolvedValue(undefined)
    useUpdateProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      updateProductAccompaniment,
    } as never)
    useProductPricingQueryMock.mockReturnValue({
      pricing: {
        accompanimentPrice: 3,
        suggestedAccompanimentPrice: null,
        mode: 'accompaniment',
      },
      pricingError: false,
      isLoadingPricing: false,
      isRefreshingPricing: false,
      retryPricing: vi.fn(),
    } as never)

    const { result } = renderHook(() =>
      useProductAccompanimentDialog({
        item: editItem,
        onSuccess: vi.fn(),
        open: true,
        productId: 'product-1',
      }),
    )
    const price = result.current.register('accompanimentPrice')
    const priceField = document.createElement('input')
    priceField.name = price.name
    document.body.append(priceField)
    price.ref(priceField)

    await act(async () => {
      priceField.value = '0'
      await price.onChange({ target: priceField })
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(updateProductAccompaniment).toHaveBeenCalledWith({
      linkId: 'link-1',
      input: {
        accompanimentPrice: 0,
        accompanimentTypeId: type.id,
        quantityPerPortion: 20,
      },
    })
  })

  it('rejects a price above the shared numeric precision limit before linking', async () => {
    const linkProductAccompaniment = vi.fn().mockResolvedValue(undefined)
    useLinkProductAccompanimentActionMock.mockReturnValue({
      isPending: false,
      linkProductAccompaniment,
    } as never)

    const { result } = renderHook(() =>
      useProductAccompanimentDialog({
        onSuccess: vi.fn(),
        open: true,
        productId: 'product-1',
      }),
    )
    const quantity = result.current.register('quantityPerPortion')
    const quantityField = document.createElement('input')
    quantityField.name = quantity.name
    document.body.append(quantityField)
    quantity.ref(quantityField)
    const price = result.current.register('accompanimentPrice')
    const priceField = document.createElement('input')
    priceField.name = price.name
    document.body.append(priceField)
    price.ref(priceField)

    act(() => {
      result.current.handleValueChange('accompanimentProductId', candidate.productId)
      result.current.handleValueChange('accompanimentTypeId', type.id)
    })
    await act(async () => {
      quantityField.value = '20'
      await quantity.onChange({ target: quantityField })
      priceField.value = '10000000000000000'
      await price.onChange({ target: priceField })
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(linkProductAccompaniment).not.toHaveBeenCalled()
    expect(result.current.errors.accompanimentPrice?.message).toBe(
      'Informe um preço maior ou igual a zero, com até duas casas decimais.',
    )
  })

  it('keeps the selected type ID while exposing its registered name', () => {
    const { result } = renderHook(() =>
      useProductAccompanimentDialog({
        item: editItem,
        onSuccess: vi.fn(),
        open: true,
        productId: 'product-1',
      }),
    )

    expect(result.current.typeId).toBe(type.id)
    expect(result.current.selectedTypeName).toBe(type.name)
  })

  it('uses the linked type name when it is missing from the loaded page', () => {
    useAccompanimentTypesQueryMock.mockReturnValue({
      data: { items: [] },
      isError: false,
      isFetching: false,
      isPending: false,
    } as never)

    const { result } = renderHook(() =>
      useProductAccompanimentDialog({
        item: editItem,
        onSuccess: vi.fn(),
        open: true,
        productId: 'product-1',
      }),
    )

    expect(result.current.typeId).toBe(type.id)
    expect(result.current.selectedTypeName).toBe(type.name)
  })

  it('keeps the linked sale price visible while pricing refreshes', () => {
    useProductPricingQueryMock.mockReturnValue({
      pricing: {
        accompanimentPrice: null,
        suggestedAccompanimentPrice: null,
        mode: 'accompaniment',
      },
      pricingError: false,
      isLoadingPricing: false,
      isRefreshingPricing: true,
      retryPricing: vi.fn(),
    } as never)

    const { result } = renderHook(() =>
      useProductAccompanimentDialog({
        item: editItem,
        onSuccess: vi.fn(),
        open: true,
        productId: 'product-1',
      }),
    )
    const price = result.current.register('accompanimentPrice')
    const priceField = document.createElement('input')
    priceField.name = price.name
    document.body.append(priceField)
    price.ref(priceField)

    expect(priceField.value).toBe('3,00')
    expect(result.current.canSave).toBe(false)
  })

  it('projects form and query fields while cached pricing is refreshing', async () => {
    const retryCandidates = vi.fn()
    const retrySelectedStock = vi.fn()
    const retryPricing = vi.fn()

    useAccompanimentCandidatesQueryMock.mockReturnValue({
      data: [candidate],
      isError: true,
      isFetching: true,
      isPending: false,
      refetch: retryCandidates,
    } as never)
    useAccompanimentTypesQueryMock.mockReturnValue({
      data: { items: [{ type, usageCount: 0 }] },
      isError: true,
      isFetching: true,
      isPending: true,
    } as never)
    useProductStockQueryMock.mockReturnValue({
      data: undefined,
      isError: true,
      isFetching: true,
      isPending: false,
      refetch: retrySelectedStock,
    } as never)
    useProductPricingQueryMock.mockReturnValue({
      pricing: {
        accompanimentPrice: null,
        suggestedAccompanimentPrice: 3,
        mode: 'resale-single',
      },
      pricingError: true,
      isLoadingPricing: false,
      isRefreshingPricing: true,
      retryPricing,
    } as never)

    const { result } = renderHook(() =>
      useProductAccompanimentDialog({
        onSuccess: vi.fn(),
        open: true,
        productId: 'product-1',
      }),
    )

    act(() => {
      result.current.handleValueChange('accompanimentProductId', candidate.productId)
      result.current.handleValueChange('accompanimentTypeId', type.id)
    })
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(useProductPricingQueryMock).toHaveBeenLastCalledWith(candidate.productId)
    expect(result.current.canSave).toBe(false)
    expect(result.current.fields).toMatchObject({
      actionError: result.current.actionError,
      accompanimentPriceError: true,
      accompanimentPriceIsSaved: false,
      accompanimentPriceLoading: false,
      accompanimentPriceSuggestion: 3,
      accompanimentPriceSuggestionMode: 'resale-single',
      brandName: result.current.source?.name ?? 'Não disponível',
      canSave: false,
      candidates: [candidate],
      candidatesError: true,
      candidatesLoading: false,
      estimatedCost: result.current.estimatedCost,
      numericQuantity: result.current.numericQuantity,
      priceError: result.current.errors.accompanimentPrice?.message,
      priceDescribedBy: `accompaniment-price-help${result.current.errors.accompanimentPrice ? ' accompaniment-price-validation-error' : ''} accompaniment-price-read-error`,
      productError: result.current.errors.accompanimentProductId?.message,
      productIdValue: candidate.productId,
      quantityError: result.current.errors.quantityPerPortion?.message,
      selectedProductName: candidate.name,
      selectedProductUnit: candidate.unit,
      selectedStockError: true,
      selectedStockLoading: false,
      selectedTypeName: type.name,
      sourceUnitCost: result.current.source?.unitCost,
      typeError: result.current.errors.accompanimentTypeId?.message,
      typeId: type.id,
      types: [{ type, usageCount: 0 }],
      typesError: true,
      typesLoading: true,
    })
    expect(result.current.fields.handleValueChange).toBe(result.current.handleValueChange)
    expect(result.current.fields.register).toBe(result.current.register)
    expect(result.current.fields.retryAccompanimentPrice).toBe(retryPricing)
    expect(result.current.fields.retryCandidates).toBe(retryCandidates)
    expect(result.current.fields.retrySelectedStock).toBe(retrySelectedStock)
  })

  it('does not show the disabled candidate query as loading while editing', () => {
    useAccompanimentCandidatesQueryMock.mockReturnValue({
      data: undefined,
      isError: false,
      isFetching: false,
      isPending: true,
      refetch: vi.fn(),
    } as never)

    const { result } = renderHook(() =>
      useProductAccompanimentDialog({
        item: editItem,
        onSuccess: vi.fn(),
        open: true,
        productId: 'product-1',
      }),
    )

    expect(result.current.candidatesLoading).toBe(false)
    expect(result.current.candidatesError).toBe(false)
    expect(result.current.fields.candidatesLoading).toBe(false)
    expect(result.current.fields.candidatesError).toBe(false)
  })

  describe('global availability', () => {
    const globalCandidate: ProductAccompanimentCandidate = {
      ...candidate,
      productId: 'product-3',
      name: 'Banana',
      accompanimentPrice: 2,
      isGlobal: true,
      hasPortionLinks: false,
      global: { accompanimentTypeId: 'type-1', quantityPerPortion: 0.05 },
    }
    const linkedCandidate: ProductAccompanimentCandidate = {
      ...candidate,
      productId: 'product-4',
      name: 'Morango',
      hasPortionLinks: true,
    }

    type HookResult = { current: ReturnType<typeof useProductAccompanimentDialog> }

    function mockCandidates(candidates: ProductAccompanimentCandidate[]) {
      useAccompanimentCandidatesQueryMock.mockReturnValue({
        data: candidates,
        isError: false,
        isFetching: false,
        isPending: false,
        refetch: vi.fn(),
      } as never)
    }

    function registerInput(
      result: HookResult,
      name: 'accompanimentPrice' | 'quantityPerPortion',
    ) {
      const registration = result.current.register(name)
      const field = document.createElement('input')
      field.name = registration.name
      document.body.append(field)
      registration.ref(field)
      return { field, registration }
    }

    async function typeValue(input: ReturnType<typeof registerInput>, value: string) {
      input.field.value = value
      await input.registration.onChange({ target: input.field })
    }

    function renderLink() {
      return renderHook(() =>
        useProductAccompanimentDialog({
          onSuccess: vi.fn(),
          open: true,
          productId: 'product-1',
        }),
      )
    }

    function renderEdit(item: ProductAccompanimentDetails) {
      return renderHook(() =>
        useProductAccompanimentDialog({
          item,
          onSuccess: vi.fn(),
          open: true,
          productId: 'product-1',
        }),
      )
    }

    function mockSavedPrice() {
      useProductPricingQueryMock.mockReturnValue({
        pricing: {
          accompanimentPrice: 3,
          suggestedAccompanimentPrice: null,
          mode: 'accompaniment',
        },
        pricingError: false,
        isLoadingPricing: false,
        isRefreshingPricing: false,
        retryPricing: vi.fn(),
      } as never)
    }

    afterEach(() => {
      document.body.replaceChildren()
    })

    it('loads Link candidates for the Portion while the dialog is open', () => {
      renderLink()

      expect(useAccompanimentCandidatesQueryMock).toHaveBeenCalledWith('product-1', true)
    })

    it('starts Link with the switch off, unlocked and without notices', () => {
      mockCandidates([candidate])
      const { result } = renderLink()

      expect(result.current.fields).toMatchObject({
        isGlobalLocked: false,
        isGlobalValue: false,
        shouldShowReplacementNotice: false,
      })
      expect(result.current.isGlobalValue).toBe(false)
    })

    it('keeps Type and Quantity empty when the switch is turned on for a non-global candidate', () => {
      mockCandidates([candidate])
      const { result } = renderLink()

      act(() => {
        result.current.handleValueChange('accompanimentProductId', candidate.productId)
      })
      act(() => result.current.handleGlobalChange(true))

      expect(result.current.isGlobalValue).toBe(true)
      expect(result.current.isGlobalLocked).toBe(false)
      expect(result.current.typeId).toBe('')
      expect(result.current.fields.selectedTypeName).toBeUndefined()
      expect(result.current.shouldShowReplacementNotice).toBe(false)
    })

    it('shows the replacement notice only while on for a candidate linked to other Portions', () => {
      mockCandidates([candidate, linkedCandidate])
      const { result } = renderLink()

      act(() => {
        result.current.handleValueChange(
          'accompanimentProductId',
          linkedCandidate.productId,
        )
      })
      expect(result.current.shouldShowReplacementNotice).toBe(false)
      act(() => result.current.handleGlobalChange(true))
      expect(result.current.shouldShowReplacementNotice).toBe(true)
      act(() => result.current.handleGlobalChange(false))
      expect(result.current.shouldShowReplacementNotice).toBe(false)
    })

    it('posts isGlobal true with the entered values when Link turns the switch on', async () => {
      const linkProductAccompaniment = vi.fn().mockResolvedValue(undefined)
      useLinkProductAccompanimentActionMock.mockReturnValue({
        isPending: false,
        linkProductAccompaniment,
      } as never)
      mockCandidates([linkedCandidate])
      const { result } = renderLink()
      const quantity = registerInput(result, 'quantityPerPortion')
      const price = registerInput(result, 'accompanimentPrice')

      act(() => {
        result.current.handleValueChange(
          'accompanimentProductId',
          linkedCandidate.productId,
        )
        result.current.handleValueChange('accompanimentTypeId', type.id)
        result.current.handleGlobalChange(true)
      })
      await act(async () => {
        await typeValue(quantity, '25')
        await typeValue(price, '3,00')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(linkProductAccompaniment).toHaveBeenCalledWith({
        accompanimentProductId: linkedCandidate.productId,
        accompanimentPrice: 3,
        accompanimentTypeId: type.id,
        isGlobal: true,
        quantityPerPortion: 25,
      })
    })

    it('omits isGlobal from the Link payload when the switch is off', async () => {
      const linkProductAccompaniment = vi.fn().mockResolvedValue(undefined)
      useLinkProductAccompanimentActionMock.mockReturnValue({
        isPending: false,
        linkProductAccompaniment,
      } as never)
      mockCandidates([candidate])
      const { result } = renderLink()
      const quantity = registerInput(result, 'quantityPerPortion')
      const price = registerInput(result, 'accompanimentPrice')

      act(() => {
        result.current.handleValueChange('accompanimentProductId', candidate.productId)
        result.current.handleValueChange('accompanimentTypeId', type.id)
      })
      await act(async () => {
        await typeValue(quantity, '25')
        await typeValue(price, '3,00')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(linkProductAccompaniment).toHaveBeenCalledTimes(1)
      expect(linkProductAccompaniment.mock.calls[0]?.[0]).not.toHaveProperty('isGlobal')
    })

    it('fixes a global candidate as global without a switch and prefills its shared Type and Quantity', async () => {
      const linkProductAccompaniment = vi.fn().mockResolvedValue(undefined)
      useLinkProductAccompanimentActionMock.mockReturnValue({
        isPending: false,
        linkProductAccompaniment,
      } as never)
      mockCandidates([candidate, globalCandidate])
      const { result } = renderLink()
      registerInput(result, 'quantityPerPortion')
      const price = registerInput(result, 'accompanimentPrice')

      act(() => {
        result.current.handleValueChange(
          'accompanimentProductId',
          globalCandidate.productId,
        )
      })

      expect(result.current.isGlobalValue).toBe(true)
      expect(result.current.isGlobalLocked).toBe(true)
      expect(result.current.hasGlobalSwitch).toBe(false)
      expect(result.current.fields.hasGlobalSwitch).toBe(false)
      expect(result.current.typeId).toBe('type-1')
      expect(result.current.shouldShowReplacementNotice).toBe(false)
      expect(result.current.fields.selectedProductName).toBe('Banana')
      await act(async () => {
        await typeValue(price, '2,50')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(linkProductAccompaniment).toHaveBeenCalledWith({
        accompanimentProductId: globalCandidate.productId,
        accompanimentPrice: 2.5,
        accompanimentTypeId: 'type-1',
        isGlobal: true,
        quantityPerPortion: 0.05,
      })
    })

    it('prefills the shared price of a global candidate, not the default price, and omits it while unchanged', async () => {
      const linkProductAccompaniment = vi.fn().mockResolvedValue(undefined)
      useLinkProductAccompanimentActionMock.mockReturnValue({
        isPending: false,
        linkProductAccompaniment,
      } as never)
      useProductPricingQueryMock.mockReturnValue({
        pricing: {
          accompanimentPrice: 5,
          suggestedAccompanimentPrice: null,
          mode: 'accompaniment',
        },
        pricingError: false,
        isLoadingPricing: false,
        isRefreshingPricing: false,
        retryPricing: vi.fn(),
      } as never)
      mockCandidates([candidate, globalCandidate])
      const { result } = renderLink()
      registerInput(result, 'quantityPerPortion')
      const price = registerInput(result, 'accompanimentPrice')

      act(() => {
        result.current.handleValueChange(
          'accompanimentProductId',
          globalCandidate.productId,
        )
      })

      expect(price.field.value).toBe('2,00')
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(linkProductAccompaniment).toHaveBeenCalledWith({
        accompanimentProductId: globalCandidate.productId,
        accompanimentTypeId: 'type-1',
        isGlobal: true,
        quantityPerPortion: 0.05,
      })
    })

    it('ignores attempts to turn off a fixed global and keeps the switch hidden', () => {
      mockCandidates([globalCandidate])
      const { result } = renderLink()

      act(() => {
        result.current.handleValueChange(
          'accompanimentProductId',
          globalCandidate.productId,
        )
      })
      act(() => result.current.handleGlobalChange(false))

      expect(result.current.isGlobalValue).toBe(true)
      expect(result.current.isGlobalLocked).toBe(true)
      expect(result.current.hasGlobalSwitch).toBe(false)
    })

    it('clears the shared values and restores the switch when switching from a global to an individual candidate', () => {
      mockCandidates([candidate, globalCandidate])
      const { result } = renderLink()

      act(() => {
        result.current.handleValueChange(
          'accompanimentProductId',
          globalCandidate.productId,
        )
      })
      act(() => {
        result.current.handleValueChange('accompanimentProductId', candidate.productId)
      })

      expect(result.current.isGlobalValue).toBe(false)
      expect(result.current.isGlobalLocked).toBe(false)
      expect(result.current.hasGlobalSwitch).toBe(true)
      expect(result.current.typeId).toBe('')
    })

    it('keeps typed values when switching between individual candidates', () => {
      mockCandidates([candidate, linkedCandidate])
      const { result } = renderLink()

      act(() => {
        result.current.handleValueChange('accompanimentProductId', candidate.productId)
        result.current.handleValueChange('accompanimentTypeId', type.id)
      })
      act(() => {
        result.current.handleValueChange(
          'accompanimentProductId',
          linkedCandidate.productId,
        )
      })

      expect(result.current.typeId).toBe(type.id)
    })

    it('starts Edit of an individual row with the switch off and enabled', () => {
      const { result } = renderEdit(editItem)

      expect(result.current.isGlobalValue).toBe(false)
      expect(result.current.isGlobalLocked).toBe(false)
      expect(result.current.hasGlobalSwitch).toBe(true)
      expect(result.current.shouldShowReplacementNotice).toBe(false)
      expect(result.current.typeId).toBe(type.id)
    })

    it('converts from Edit with isGlobal true and warns only when other Portions are linked', async () => {
      const updateProductAccompaniment = vi.fn().mockResolvedValue(undefined)
      useUpdateProductAccompanimentActionMock.mockReturnValue({
        isPending: false,
        updateProductAccompaniment,
      } as never)
      mockSavedPrice()
      const { result } = renderEdit({ ...editItem, hasOtherPortionLinks: true })
      const price = registerInput(result, 'accompanimentPrice')

      act(() => result.current.handleGlobalChange(true))
      expect(result.current.isGlobalValue).toBe(true)
      expect(result.current.shouldShowReplacementNotice).toBe(true)
      await act(async () => {
        await typeValue(price, '3,00')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(updateProductAccompaniment).toHaveBeenCalledWith({
        linkId: 'link-1',
        input: { accompanimentTypeId: type.id, isGlobal: true, quantityPerPortion: 20 },
      })
    })

    it('shows only the global notice when Edit converts a row without other Portion links', () => {
      const { result } = renderEdit({ ...editItem, hasOtherPortionLinks: false })

      act(() => result.current.handleGlobalChange(true))

      expect(result.current.isGlobalValue).toBe(true)
      expect(result.current.shouldShowReplacementNotice).toBe(false)
    })

    it('fixes Edit of a global row as global without a switch and keeps its shared values', async () => {
      const updateProductAccompaniment = vi.fn().mockResolvedValue(undefined)
      useUpdateProductAccompanimentActionMock.mockReturnValue({
        isPending: false,
        updateProductAccompaniment,
      } as never)
      mockSavedPrice()
      const { result } = renderEdit({ ...editItem, isGlobal: true })
      const quantity = registerInput(result, 'quantityPerPortion')

      expect(result.current.isGlobalValue).toBe(true)
      expect(result.current.isGlobalLocked).toBe(true)
      expect(result.current.hasGlobalSwitch).toBe(false)
      expect(result.current.shouldShowReplacementNotice).toBe(false)
      act(() => result.current.handleGlobalChange(false))
      expect(result.current.isGlobalValue).toBe(true)
      await act(async () => {
        await typeValue(quantity, '30')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(updateProductAccompaniment).toHaveBeenCalledWith({
        linkId: 'link-1',
        input: { accompanimentTypeId: type.id, isGlobal: true, quantityPerPortion: 30 },
      })
    })

    it('omits isGlobal when Edit of an individual row keeps the switch off', async () => {
      const updateProductAccompaniment = vi.fn().mockResolvedValue(undefined)
      useUpdateProductAccompanimentActionMock.mockReturnValue({
        isPending: false,
        updateProductAccompaniment,
      } as never)
      mockSavedPrice()
      const { result } = renderEdit(editItem)

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(updateProductAccompaniment).toHaveBeenCalledTimes(1)
      expect(updateProductAccompaniment.mock.calls[0]?.[0].input).not.toHaveProperty(
        'isGlobal',
      )
    })

    it('estimates the cost from the selected product single-stock unit cost', () => {
      useProductStockQueryMock.mockReturnValue({
        data: { brands: [], product: { currentUnitCost: 0.01 } },
        isError: false,
        isFetching: false,
        isPending: false,
        refetch: vi.fn(),
      } as never)
      mockCandidates([candidate])
      const { result } = renderLink()

      act(() => {
        result.current.handleValueChange('accompanimentProductId', candidate.productId)
      })

      expect(useProductStockQueryMock).toHaveBeenLastCalledWith(candidate.productId)
      expect(result.current.source).toEqual({ name: 'Estoque único', unitCost: 0.01 })
      expect(result.current.fields.sourceUnitCost).toBe(0.01)
      expect(result.current.fields.brandName).toBe('Estoque único')
    })

    it('prefers the primary brand unit price over the single-stock unit cost', () => {
      useProductStockQueryMock.mockReturnValue({
        data: {
          brands: [{ brand: { name: 'Mãe Terra', isPrimary: true }, unitPrice: 0.02 }],
          product: { currentUnitCost: 0.01 },
        },
        isError: false,
        isFetching: false,
        isPending: false,
        refetch: vi.fn(),
      } as never)
      mockCandidates([candidate])
      const { result } = renderLink()

      expect(result.current.source).toEqual({ name: 'Mãe Terra', unitCost: 0.02 })
    })
  })

  describe('Portions tab modes', () => {
    const accompaniment: GlobalAccompanimentDetails = {
      accompanimentProductId: 'accompaniment-1',
      accompanimentProductName: 'Granola',
      isGlobal: false,
      unit: 'g',
      salePrice: 3,
    }
    const globalAccompaniment: GlobalAccompanimentDetails = {
      ...accompaniment,
      isGlobal: true,
      globalAccompanimentId: 'global-1',
      accompanimentTypeId: type.id,
      accompanimentTypeName: type.name,
      quantityPerPortion: 50,
      brandName: 'Mãe Terra',
      unitCost: 0.00899,
      estimatedCost: 0.45,
    }

    // Stable references: the dialog resets its form whenever the item or scope changes identity.
    const pricedItem = { ...editItem, salePrice: 4.5 }
    const unpricedItem = { ...editItem, salePrice: null }
    const pricedGlobal = { ...globalAccompaniment, salePrice: 5 }
    const pricedAccompaniment = { ...accompaniment, salePrice: 9 }

    function registerInput(
      result: { current: ReturnType<typeof useProductAccompanimentDialog> },
      name: 'accompanimentPrice' | 'quantityPerPortion',
    ) {
      const registration = result.current.register(name)
      const field = document.createElement('input')
      field.name = registration.name
      document.body.append(field)
      registration.ref(field)
      return { field, registration }
    }

    async function typeValue(input: ReturnType<typeof registerInput>, value: string) {
      input.field.value = value
      await input.registration.onChange({ target: input.field })
    }

    function mockSavedPrice(price: number | null) {
      useProductPricingQueryMock.mockReturnValue({
        pricing: {
          accompanimentPrice: price,
          suggestedAccompanimentPrice: price === null ? 3 : null,
          mode: price === null ? 'resale-single' : 'accompaniment',
        },
        pricingError: false,
        isLoadingPricing: false,
        isRefreshingPricing: false,
        retryPricing: vi.fn(),
      } as never)
    }

    afterEach(() => {
      document.body.replaceChildren()
    })

    it('names the Portion in the copy of a per-row Edit and keeps the switch hidden', async () => {
      const updateProductAccompaniment = vi.fn().mockResolvedValue(undefined)
      useUpdateProductAccompanimentActionMock.mockReturnValue({
        isPending: false,
        updateProductAccompaniment,
      } as never)
      mockSavedPrice(3)
      const { result } = renderHook(() =>
        useProductAccompanimentDialog({
          item: editItem,
          mode: 'portion-row',
          onSuccess: vi.fn(),
          open: true,
          portionName: 'Açaí 300 ml',
          productId: 'portion-1',
        }),
      )
      const quantity = registerInput(result, 'quantityPerPortion')

      expect(result.current.dialogCopy).toEqual({
        description: 'Atualize como Granola aparece em Açaí 300 ml no PDV.',
        submitLabel: 'Salvar alterações',
        title: 'Editar Acompanhamento',
      })
      expect(result.current.hasGlobalSwitch).toBe(false)
      expect(result.current.isGlobalValue).toBe(false)
      expect(result.current.fields.readOnlyProductName).toBe('Granola')
      await act(async () => {
        await typeValue(quantity, '30')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(updateProductAccompaniment).toHaveBeenCalledWith({
        linkId: 'link-1',
        input: { accompanimentTypeId: type.id, quantityPerPortion: 30 },
      })
      expect(useAccompanimentCandidatesQueryMock).toHaveBeenLastCalledWith(
        'portion-1',
        false,
      )
    })

    it('edits the shared values of a global through the Accompaniment-scoped update', async () => {
      const updateGlobalAccompaniment = vi.fn().mockResolvedValue(undefined)
      const updateProductAccompaniment = vi.fn()
      const onSuccess = vi.fn()
      useUpdateGlobalAccompanimentActionMock.mockReturnValue({
        isPending: false,
        updateGlobalAccompaniment,
      } as never)
      useUpdateProductAccompanimentActionMock.mockReturnValue({
        isPending: false,
        updateProductAccompaniment,
      } as never)
      mockSavedPrice(3)
      const { result } = renderHook(() =>
        useProductAccompanimentDialog({
          accompaniment: globalAccompaniment,
          mode: 'global',
          onSuccess,
          open: true,
          productId: 'accompaniment-1',
        }),
      )
      const quantity = registerInput(result, 'quantityPerPortion')
      const price = registerInput(result, 'accompanimentPrice')

      expect(result.current.dialogCopy).toEqual({
        description: 'Atualize como Granola aparece em todas as porções no PDV.',
        submitLabel: 'Salvar alterações',
        title: 'Editar Acompanhamento',
      })
      expect(result.current.isGlobalValue).toBe(true)
      expect(result.current.isGlobalLocked).toBe(false)
      expect(result.current.hasGlobalSwitch).toBe(false)
      expect(result.current.typeId).toBe(type.id)
      expect(result.current.selectedTypeName).toBe(type.name)
      expect(result.current.fields.readOnlyProductName).toBe('Granola')
      expect(result.current.fields.unit).toBe('g')
      expect(result.current.shouldShowReplacementNotice).toBe(false)
      expect(result.current.source).toEqual({ name: 'Mãe Terra', unitCost: 0.00899 })
      await act(async () => {
        await typeValue(quantity, '60')
        await typeValue(price, '3,50')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(updateGlobalAccompaniment).toHaveBeenCalledWith({
        accompanimentPrice: 3.5,
        accompanimentTypeId: type.id,
        quantityPerPortion: 60,
      })
      expect(updateProductAccompaniment).not.toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(useAccompanimentCandidatesQueryMock).toHaveBeenLastCalledWith(
        'accompaniment-1',
        false,
      )
      expect(useProductPricingQueryMock).toHaveBeenLastCalledWith('accompaniment-1')
    })

    it('omits an unchanged price when editing a global and maps a failure to an inline error', async () => {
      const updateGlobalAccompaniment = vi.fn().mockRejectedValue(new Error('rejected'))
      useUpdateGlobalAccompanimentActionMock.mockReturnValue({
        isPending: false,
        updateGlobalAccompaniment,
      } as never)
      mockSavedPrice(3)
      const { result } = renderHook(() =>
        useProductAccompanimentDialog({
          accompaniment: globalAccompaniment,
          mode: 'global',
          onSuccess: vi.fn(),
          open: true,
          productId: 'accompaniment-1',
        }),
      )
      const price = registerInput(result, 'accompanimentPrice')

      await act(async () => {
        await typeValue(price, '3,00')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(updateGlobalAccompaniment).toHaveBeenCalledWith({
        accompanimentTypeId: type.id,
        quantityPerPortion: 50,
      })
      expect(result.current.actionError).toBe('rejected')
    })

    it("prefills a per-row Edit with the link's own price, not the default, and compares changes with it", async () => {
      const updateProductAccompaniment = vi.fn().mockResolvedValue(undefined)
      useUpdateProductAccompanimentActionMock.mockReturnValue({
        isPending: false,
        updateProductAccompaniment,
      } as never)
      mockSavedPrice(3)
      const { result } = renderHook(() =>
        useProductAccompanimentDialog({
          item: pricedItem,
          mode: 'portion-row',
          onSuccess: vi.fn(),
          open: true,
          portionName: 'Açaí 300 ml',
          productId: 'portion-1',
        }),
      )
      const price = registerInput(result, 'accompanimentPrice')
      const quantity = registerInput(result, 'quantityPerPortion')

      expect(price.field.value).toBe('4,50')
      expect(result.current.fields.isGlobalValue).toBe(false)
      await act(async () => {
        await typeValue(quantity, '30')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })
      expect(updateProductAccompaniment).toHaveBeenLastCalledWith({
        linkId: 'link-1',
        input: { accompanimentTypeId: type.id, quantityPerPortion: 30 },
      })
      await act(async () => {
        await typeValue(price, '3,00')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(updateProductAccompaniment).toHaveBeenLastCalledWith({
        linkId: 'link-1',
        input: {
          accompanimentPrice: 3,
          accompanimentTypeId: type.id,
          quantityPerPortion: 30,
        },
      })
    })

    it('always sends the price of an edited link that has none yet', async () => {
      const updateProductAccompaniment = vi.fn().mockResolvedValue(undefined)
      useUpdateProductAccompanimentActionMock.mockReturnValue({
        isPending: false,
        updateProductAccompaniment,
      } as never)
      mockSavedPrice(3)
      const { result } = renderHook(() =>
        useProductAccompanimentDialog({
          item: unpricedItem,
          mode: 'portion-row',
          onSuccess: vi.fn(),
          open: true,
          portionName: 'Açaí 300 ml',
          productId: 'portion-1',
        }),
      )
      const price = registerInput(result, 'accompanimentPrice')

      await act(async () => {
        await typeValue(price, '3,00')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(updateProductAccompaniment).toHaveBeenCalledWith({
        linkId: 'link-1',
        input: {
          accompanimentPrice: 3,
          accompanimentTypeId: type.id,
          quantityPerPortion: 20,
        },
      })
    })

    it('prefills the page Edit of a global with the shared price and explains it applies to every Portion', () => {
      mockSavedPrice(3)
      const { result } = renderHook(() =>
        useProductAccompanimentDialog({
          accompaniment: pricedGlobal,
          mode: 'global',
          onSuccess: vi.fn(),
          open: true,
          productId: 'accompaniment-1',
        }),
      )

      expect(registerInput(result, 'accompanimentPrice').field.value).toBe('5,00')
      expect(result.current.fields.isGlobalValue).toBe(true)
    })

    it('compares the make-global price with the default price, not with the read price, and shares the help', async () => {
      const linkAccompanimentPortions = vi.fn().mockResolvedValue(undefined)
      useLinkAccompanimentPortionsActionMock.mockReturnValue({
        isPending: false,
        linkAccompanimentPortions,
      } as never)
      mockSavedPrice(3)
      const { result } = renderHook(() =>
        useProductAccompanimentDialog({
          accompaniment: pricedAccompaniment,
          mode: 'make-global',
          onSuccess: vi.fn(),
          open: true,
          productId: 'accompaniment-1',
        }),
      )
      const quantity = registerInput(result, 'quantityPerPortion')
      const price = registerInput(result, 'accompanimentPrice')
      expect(result.current.fields.isGlobalValue).toBe(true)
      act(() => {
        result.current.handleValueChange('accompanimentTypeId', type.id)
      })

      await act(async () => {
        await typeValue(quantity, '50')
        await typeValue(price, '9,00')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })
      expect(linkAccompanimentPortions).toHaveBeenLastCalledWith({
        accompanimentPrice: 9,
        accompanimentTypeId: type.id,
        isGlobal: true,
        quantityPerPortion: 50,
      })
      await act(async () => {
        await typeValue(price, '3,00')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(linkAccompanimentPortions).toHaveBeenLastCalledWith({
        accompanimentTypeId: type.id,
        isGlobal: true,
        quantityPerPortion: 50,
      })
    })

    it('shares the price help of a Portion-side link only while the global switch is on', () => {
      const { result } = renderHook(() =>
        useProductAccompanimentDialog({
          onSuccess: vi.fn(),
          open: true,
          productId: 'product-1',
        }),
      )
      expect(result.current.fields.isGlobalValue).toBe(false)

      act(() => result.current.handleGlobalChange(true))

      expect(result.current.fields.isGlobalValue).toBe(true)
    })

    it('starts the make-global mode empty, with a warning only when individual links exist', () => {
      mockSavedPrice(null)
      const { result, rerender } = renderHook(
        ({ hasIndividualLinks }) =>
          useProductAccompanimentDialog({
            accompaniment,
            hasIndividualLinks,
            mode: 'make-global',
            onSuccess: vi.fn(),
            open: true,
            productId: 'accompaniment-1',
          }),
        { initialProps: { hasIndividualLinks: true } },
      )

      expect(result.current.dialogCopy).toEqual({
        description:
          'Granola passará a aparecer em todas as porções, incluindo as novas.',
        submitLabel: 'Tornar global',
        title: 'Tornar acompanhamento global',
      })
      expect(result.current.typeId).toBe('')
      expect(result.current.isGlobalValue).toBe(true)
      expect(result.current.hasGlobalSwitch).toBe(false)
      expect(result.current.shouldShowReplacementNotice).toBe(true)
      expect(result.current.fields.replacementNoticeWording).toBe('accompaniment-side')
      expect(useProductStockQueryMock).toHaveBeenLastCalledWith('accompaniment-1')
      expect(useAccompanimentCandidatesQueryMock).toHaveBeenLastCalledWith(
        'accompaniment-1',
        false,
      )
      rerender({ hasIndividualLinks: false })
      expect(result.current.shouldShowReplacementNotice).toBe(false)
    })

    it('makes the Accompaniment global with isGlobal true and no Portion ids', async () => {
      const linkAccompanimentPortions = vi.fn().mockResolvedValue(undefined)
      const onSuccess = vi.fn()
      useLinkAccompanimentPortionsActionMock.mockReturnValue({
        isPending: false,
        linkAccompanimentPortions,
      } as never)
      mockSavedPrice(3)
      const { result } = renderHook(() =>
        useProductAccompanimentDialog({
          accompaniment,
          hasIndividualLinks: true,
          mode: 'make-global',
          onSuccess,
          open: true,
          productId: 'accompaniment-1',
        }),
      )
      const quantity = registerInput(result, 'quantityPerPortion')
      const price = registerInput(result, 'accompanimentPrice')

      act(() => {
        result.current.handleValueChange('accompanimentTypeId', type.id)
      })
      await act(async () => {
        await typeValue(quantity, '50')
        await typeValue(price, '3,00')
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(linkAccompanimentPortions).toHaveBeenCalledWith({
        accompanimentTypeId: type.id,
        isGlobal: true,
        quantityPerPortion: 50,
      })
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('requires a type and a quantity before making the Accompaniment global', async () => {
      const linkAccompanimentPortions = vi.fn().mockResolvedValue(undefined)
      useLinkAccompanimentPortionsActionMock.mockReturnValue({
        isPending: false,
        linkAccompanimentPortions,
      } as never)
      mockSavedPrice(3)
      const { result } = renderHook(() =>
        useProductAccompanimentDialog({
          accompaniment,
          mode: 'make-global',
          onSuccess: vi.fn(),
          open: true,
          productId: 'accompaniment-1',
        }),
      )
      registerInput(result, 'quantityPerPortion')

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
      })

      expect(linkAccompanimentPortions).not.toHaveBeenCalled()
      expect(result.current.errors.accompanimentTypeId?.message).toBe(
        'Selecione um tipo.',
      )
      expect(result.current.errors.quantityPerPortion).toBeDefined()
    })

    it.each([
      ['portion-row', { item: editItem, portionName: 'Açaí 300 ml' }],
      ['global', { accompaniment: globalAccompaniment }],
      ['make-global', { accompaniment }],
    ] as const)(
      'never reports the disabled candidates query as loading or failed in %s mode',
      (mode, extra) => {
        useAccompanimentCandidatesQueryMock.mockReturnValue({
          data: undefined,
          isError: true,
          isFetching: false,
          isPending: true,
          refetch: vi.fn(),
        } as never)
        const { result } = renderHook(() =>
          useProductAccompanimentDialog({
            ...extra,
            mode,
            onSuccess: vi.fn(),
            open: true,
            productId: 'product-1',
          }),
        )

        expect(useAccompanimentCandidatesQueryMock).toHaveBeenLastCalledWith(
          'product-1',
          false,
        )
        expect(result.current.candidatesLoading).toBe(false)
        expect(result.current.candidatesError).toBe(false)
        expect(result.current.fields.candidatesLoading).toBe(false)
        expect(result.current.fields.candidatesError).toBe(false)
      },
    )

    it('still reports the candidates query state in the Portion-side link mode', () => {
      useAccompanimentCandidatesQueryMock.mockReturnValue({
        data: undefined,
        isError: false,
        isFetching: false,
        isPending: true,
        refetch: vi.fn(),
      } as never)
      const { result } = renderHook(() =>
        useProductAccompanimentDialog({
          onSuccess: vi.fn(),
          open: true,
          productId: 'product-1',
        }),
      )

      expect(result.current.candidatesLoading).toBe(true)
    })

    it('reports a pending state while any of the save actions is pending', () => {
      useLinkAccompanimentPortionsActionMock.mockReturnValue({
        isPending: true,
        linkAccompanimentPortions: vi.fn(),
      } as never)
      const { result } = renderHook(() =>
        useProductAccompanimentDialog({
          accompaniment,
          mode: 'make-global',
          onSuccess: vi.fn(),
          open: true,
          productId: 'accompaniment-1',
        }),
      )

      expect(result.current.isPending).toBe(true)
    })
  })
})
