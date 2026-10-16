import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AccompanimentTypeFaker,
  ProductAccompanimentFaker,
  ProductFaker,
} from '@scoops/core/mrp/domain/entities/fakers'

import { useAccompanimentCandidatesQuery } from '@/ui/mrp/hooks/use-accompaniment-candidates-query'
import { useAccompanimentTypesQuery } from '@/ui/mrp/hooks/use-accompaniment-types-query'
import { useLinkProductAccompanimentAction } from '@/ui/mrp/hooks/use-link-product-accompaniment-action'
import { useProductPricingQuery } from '@/ui/mrp/hooks/use-product-pricing-query'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'
import { useUpdateProductAccompanimentAction } from '@/ui/mrp/hooks/use-update-product-accompaniment-action'

import { useProductAccompanimentDialog } from '../use-product-accompaniment-dialog'

vi.mock('@/ui/mrp/hooks/use-accompaniment-candidates-query', () => ({
  useAccompanimentCandidatesQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-accompaniment-types-query', () => ({
  useAccompanimentTypesQuery: vi.fn(),
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
vi.mock('@/ui/mrp/hooks/use-update-product-accompaniment-action', () => ({
  useUpdateProductAccompanimentAction: vi.fn(),
}))

const useAccompanimentCandidatesQueryMock = vi.mocked(useAccompanimentCandidatesQuery)
const useAccompanimentTypesQueryMock = vi.mocked(useAccompanimentTypesQuery)
const useLinkProductAccompanimentActionMock = vi.mocked(useLinkProductAccompanimentAction)
const useProductPricingQueryMock = vi.mocked(useProductPricingQuery)
const useProductStockQueryMock = vi.mocked(useProductStockQuery)
const useUpdateProductAccompanimentActionMock = vi.mocked(
  useUpdateProductAccompanimentAction,
)

const candidate = ProductFaker.fake({ id: 'product-2', name: 'Granola', unit: 'g' })
const type = AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' })
const editItem = {
  ...ProductAccompanimentFaker.fake({
    id: 'link-1',
    accompanimentProductId: candidate.id,
    accompanimentTypeId: type.id,
    quantityPerPortion: 20,
  }),
  accompanimentProductName: candidate.name,
  accompanimentTypeName: type.name,
  unit: 'g' as const,
  salePrice: 3,
  estimatedCost: 0.45,
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
      data: { brands: [] },
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
      result.current.handleValueChange('accompanimentProductId', candidate.id)
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
      accompanimentProductId: candidate.id,
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
      result.current.handleValueChange('accompanimentProductId', candidate.id)
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
      result.current.handleValueChange('accompanimentProductId', candidate.id)
      result.current.handleValueChange('accompanimentTypeId', type.id)
    })
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(useProductPricingQueryMock).toHaveBeenLastCalledWith(candidate.id)
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
      productIdValue: candidate.id,
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
})
