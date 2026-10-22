import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AccompanimentTypeFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type {
  AccompanimentPortionCandidate,
  GlobalAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'
import { AppError, ConflictError, NotFoundError } from '@scoops/core/shared/domain/errors'

import { useAccompanimentPortionCandidatesQuery } from '@/ui/mrp/hooks/use-accompaniment-portion-candidates-query'
import { useAccompanimentTypesQuery } from '@/ui/mrp/hooks/use-accompaniment-types-query'
import { useGlobalAccompanimentQuery } from '@/ui/mrp/hooks/use-global-accompaniment-query'
import { useLinkAccompanimentPortionsAction } from '@/ui/mrp/hooks/use-link-accompaniment-portions-action'
import { useProductPricingQuery } from '@/ui/mrp/hooks/use-product-pricing-query'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'

import { useLinkPortionsDialog } from '../use-link-portions-dialog'

vi.mock('@/ui/mrp/hooks/use-accompaniment-portion-candidates-query', () => ({
  useAccompanimentPortionCandidatesQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-accompaniment-types-query', () => ({
  useAccompanimentTypesQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-global-accompaniment-query', () => ({
  useGlobalAccompanimentQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-link-accompaniment-portions-action', () => ({
  useLinkAccompanimentPortionsAction: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-product-pricing-query', () => ({
  useProductPricingQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-product-stock-query', () => ({
  useProductStockQuery: vi.fn(),
}))

const useCandidatesQueryMock = vi.mocked(useAccompanimentPortionCandidatesQuery)
const useTypesQueryMock = vi.mocked(useAccompanimentTypesQuery)
const useGlobalQueryMock = vi.mocked(useGlobalAccompanimentQuery)
const useLinkActionMock = vi.mocked(useLinkAccompanimentPortionsAction)
const usePricingQueryMock = vi.mocked(useProductPricingQuery)
const useStockQueryMock = vi.mocked(useProductStockQuery)

const type = AccompanimentTypeFaker.fake({ id: 'type-1', name: 'Cobertura' })
const candidates: AccompanimentPortionCandidate[] = [
  { productId: 'a', name: 'Açaí 300 ml', status: 'active' },
  { productId: 'b', name: 'Barca grande', status: 'inactive' },
  { productId: 'c', name: 'Sorvete de coco', status: 'active' },
]
const individual: GlobalAccompanimentDetails = {
  accompanimentProductId: 'accompaniment-1',
  accompanimentProductName: 'Granola',
  isGlobal: false,
  unit: 'g',
  salePrice: 3,
}
const globalDetails: GlobalAccompanimentDetails = {
  ...individual,
  isGlobal: true,
  globalAccompanimentId: 'global-1',
  accompanimentTypeId: type.id,
  accompanimentTypeName: type.name,
  quantityPerPortion: 50,
}

const candidatesRefetchMock = vi.fn()
const globalRefetchMock = vi.fn()
const linkMock = vi.fn()
const onBecameGlobalMock = vi.fn()

type HookResult = { current: ReturnType<typeof useLinkPortionsDialog> }

function mockPricing(accompanimentPrice: number | null, suggested: number | null = null) {
  usePricingQueryMock.mockReturnValue({
    pricing: {
      accompanimentPrice,
      suggestedAccompanimentPrice: suggested,
      mode: suggested === null ? 'accompaniment' : 'resale-single',
    },
    pricingError: false,
    isLoadingPricing: false,
    isRefreshingPricing: false,
    retryPricing: vi.fn(),
  } as never)
}

function mockGlobal(data: GlobalAccompanimentDetails | undefined) {
  useGlobalQueryMock.mockReturnValue({ data, refetch: globalRefetchMock } as never)
}

function mockCandidates(items: AccompanimentPortionCandidate[], overrides = {}) {
  useCandidatesQueryMock.mockReturnValue({
    data: items,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: candidatesRefetchMock,
    ...overrides,
  } as never)
}

function registerInput(
  result: HookResult,
  name: 'accompanimentPrice' | 'quantityPerPortion',
) {
  const registration =
    name === 'accompanimentPrice'
      ? result.current.priceRegistration
      : result.current.quantityRegistration
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

function renderDialog(open = true) {
  return renderHook(
    ({ isOpen }) =>
      useLinkPortionsDialog({
        onBecameGlobal: onBecameGlobalMock,
        onSuccess: onSuccessMock,
        open: isOpen,
        productId: 'accompaniment-1',
      }),
    { initialProps: { isOpen: open } },
  )
}

const onSuccessMock = vi.fn()

async function fillValidForm(result: HookResult, ids = ['a']) {
  const quantity = registerInput(result, 'quantityPerPortion')
  const price = registerInput(result, 'accompanimentPrice')
  act(() => {
    result.current.handleSelectedIdsChange(ids)
    result.current.handleTypeChange(type.id)
  })
  await act(async () => {
    await typeValue(quantity, '25,5')
    await typeValue(price, '4,50')
  })
}

describe('useLinkPortionsDialog', () => {
  afterEach(() => {
    cleanup()
    document.body.replaceChildren()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockGlobal(individual)
    mockCandidates(candidates)
    useTypesQueryMock.mockReturnValue({
      data: { items: [{ type, usageCount: 1 }] },
      isError: false,
      isFetching: false,
      isPending: false,
    } as never)
    mockPricing(null, 4)
    useStockQueryMock.mockReturnValue({
      data: {
        brands: [{ brand: { isPrimary: true, name: 'Mãe Terra' }, unitPrice: 0.00899 }],
        product: { currentUnitCost: 0.01, unit: 'g' },
      },
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)
    linkMock.mockResolvedValue(undefined)
    useLinkActionMock.mockReturnValue({
      isPending: false,
      linkAccompanimentPortions: linkMock,
    } as never)
    candidatesRefetchMock.mockResolvedValue({ data: candidates })
    globalRefetchMock.mockResolvedValue({ data: individual })
  })

  it('reads the Accompaniment scoped data while the dialog is open', () => {
    renderDialog()

    expect(useGlobalQueryMock).toHaveBeenCalledWith('accompaniment-1', true)
    expect(useCandidatesQueryMock).toHaveBeenCalledWith('accompaniment-1', true)
    expect(usePricingQueryMock).toHaveBeenCalledWith('accompaniment-1')
    expect(useStockQueryMock).toHaveBeenCalledWith('accompaniment-1')
    expect(useLinkActionMock).toHaveBeenCalledWith('accompaniment-1')
    expect(useTypesQueryMock).toHaveBeenCalledWith({ page: 1, pageSize: 100 })
  })

  it('does not read candidates or the global state while the dialog is closed', () => {
    renderDialog(false)

    expect(useGlobalQueryMock).toHaveBeenCalledWith('accompaniment-1', false)
    expect(useCandidatesQueryMock).toHaveBeenCalledWith('accompaniment-1', false)
  })

  it('exposes the Accompaniment, candidates, types and the unit for the shared fields', () => {
    const { result } = renderDialog()

    expect(result.current.accompanimentName).toBe('Granola')
    expect(result.current.candidates).toEqual(candidates)
    expect(result.current.candidatesError).toBe(false)
    expect(result.current.candidatesLoading).toBe(false)
    expect(result.current.types).toEqual([{ type, usageCount: 1 }])
    expect(result.current.typesError).toBe(false)
    expect(result.current.typesLoading).toBe(false)
    expect(result.current.unit).toBe('g')
    expect('isGlobal' in result.current).toBe(false)
    expect(result.current.typeId).toBe('')
    expect(result.current.portionProductIds).toEqual([])
    expect(result.current.actionError).toBeNull()
  })

  it('falls back when the global read or the lists are not available yet', () => {
    mockGlobal(undefined)
    useCandidatesQueryMock.mockReturnValue({
      data: undefined,
      isError: true,
      isFetching: false,
      isPending: true,
      refetch: candidatesRefetchMock,
    } as never)
    useTypesQueryMock.mockReturnValue({
      data: undefined,
      isError: true,
      isFetching: false,
      isPending: true,
    } as never)
    const { result } = renderDialog()

    expect(result.current.accompanimentName).toBe('')
    expect(result.current.candidates).toEqual([])
    expect(result.current.candidatesError).toBe(true)
    expect(result.current.candidatesLoading).toBe(true)
    expect(result.current.types).toEqual([])
    expect(result.current.typesError).toBe(true)
    expect(result.current.typesLoading).toBe(true)
    expect(result.current.unit).toBe('g')
  })

  it('prefills the saved price and shows its state', async () => {
    mockPricing(3)
    const { result } = renderDialog()
    const price = registerInput(result, 'accompanimentPrice')

    expect(price.field.value).toBe('3,00')
    expect(result.current.accompanimentPriceIsSaved).toBe(true)
    expect(result.current.accompanimentPriceSuggestion).toBeNull()
  })

  it('proposes the Resale price when no price is saved', () => {
    const { result } = renderDialog()
    const price = registerInput(result, 'accompanimentPrice')

    expect(price.field.value).toBe('4,00')
    expect(result.current.accompanimentPriceIsSaved).toBe(false)
    expect(result.current.accompanimentPriceSuggestion).toBe(4)
    expect(result.current.accompanimentPriceSuggestionMode).toBe('resale-single')
  })

  it('leaves the price empty when nothing is saved or proposed', () => {
    mockPricing(null, null)
    mockGlobal({ ...individual, salePrice: null })
    const { result } = renderDialog()

    expect(registerInput(result, 'accompanimentPrice').field.value).toBe('')
  })

  it('never prefills shared values: type and quantity start empty and the price is the default even when the read reports a global', () => {
    mockPricing(3)
    mockGlobal(globalDetails)
    const { result } = renderDialog()

    expect('isGlobal' in result.current).toBe(false)
    expect(result.current.typeId).toBe('')
    expect(registerInput(result, 'quantityPerPortion').field.value).toBe('')
    expect(registerInput(result, 'accompanimentPrice').field.value).toBe('3,00')
  })

  it('starts empty for an individual Accompaniment', () => {
    const { result } = renderDialog()

    expect(result.current.typeId).toBe('')
    expect(registerInput(result, 'quantityPerPortion').field.value).toBe('')
  })

  it('computes the cost per Portion from the primary brand and names the brand', async () => {
    const { result } = renderDialog()
    const quantity = registerInput(result, 'quantityPerPortion')

    await act(async () => {
      await typeValue(quantity, '50')
    })

    expect(result.current.brandName).toBe('Mãe Terra')
    expect(result.current.sourceUnitCost).toBe(0.00899)
    expect(result.current.numericQuantity).toBe(50)
    expect(result.current.estimatedCost).toBeCloseTo(0.4495)
  })

  it('uses the single-stock unit cost and name when there is no primary brand price', () => {
    useStockQueryMock.mockReturnValue({
      data: { brands: [], product: { currentUnitCost: 0.01, unit: 'g' } },
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)
    const { result } = renderDialog()

    expect(result.current.brandName).toBe('Estoque único')
    expect(result.current.sourceUnitCost).toBe(0.01)
  })

  it('reports an unavailable brand and cost, and the stock loading and error flags', () => {
    useStockQueryMock.mockReturnValue({
      data: { brands: [], product: { unit: 'g' } },
      isError: true,
      isFetching: false,
      isPending: false,
      refetch: vi.fn(),
    } as never)
    const { result } = renderDialog()

    expect(result.current.brandName).toBe('Não disponível')
    expect(result.current.estimatedCost).toBeUndefined()
    expect(result.current.selectedStockError).toBe(true)
    cleanup()
    useStockQueryMock.mockReturnValue({
      data: undefined,
      isError: false,
      isFetching: false,
      isPending: true,
      refetch: vi.fn(),
    } as never)
    const loading = renderDialog()

    expect(loading.result.current.brandName).toBe('Carregando…')
    expect(loading.result.current.selectedStockLoading).toBe(true)
  })

  it('reflects the selection in the plural submit label and enables saving only with a selection', () => {
    const { result } = renderDialog()
    expect(result.current.submitLabel).toBe('Vincular porções')
    expect(result.current.canSubmit).toBe(false)

    act(() => result.current.handleSelectedIdsChange(['a']))
    expect(result.current.submitLabel).toBe('Vincular 1 porção')
    expect(result.current.canSubmit).toBe(true)
    act(() => result.current.handleSelectedIdsChange(['a', 'b']))

    expect(result.current.submitLabel).toBe('Vincular 2 porções')
    expect(result.current.portionProductIds).toEqual(['a', 'b'])
  })

  it('blocks saving while pricing is loading, refreshing or failed', () => {
    for (const overrides of [
      { isLoadingPricing: true },
      { isRefreshingPricing: true },
      { pricingError: true },
    ]) {
      usePricingQueryMock.mockReturnValue({
        pricing: undefined,
        pricingError: false,
        isLoadingPricing: false,
        isRefreshingPricing: false,
        retryPricing: vi.fn(),
        ...overrides,
      } as never)
      const { result } = renderDialog()
      act(() => result.current.handleSelectedIdsChange(['a']))

      expect(result.current.canSubmit).toBe(false)
      cleanup()
    }
  })

  it('describes the price field by its help, validation and read errors', () => {
    usePricingQueryMock.mockReturnValue({
      pricing: undefined,
      pricingError: true,
      isLoadingPricing: false,
      isRefreshingPricing: false,
      retryPricing: vi.fn(),
    } as never)
    const { result } = renderDialog()

    expect(result.current.priceDescribedBy).toBe(
      'accompaniment-price-help accompaniment-price-read-error',
    )
    expect(result.current.accompanimentPriceError).toBe(true)
  })

  it('selects a type by id, clears the error and exposes the type name', () => {
    const { result } = renderDialog()

    act(() => result.current.handleTypeChange(type.id))
    expect(result.current.typeId).toBe(type.id)
    expect(result.current.selectedTypeName).toBe(type.name)
    act(() => result.current.handleTypeChange(null))

    expect(result.current.typeId).toBe('')
  })

  it('sends the selected Portions, shared values and the entered price for an individual Accompaniment', async () => {
    const { result } = renderDialog()
    await fillValidForm(result, ['a', 'c'])

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(linkMock).toHaveBeenCalledWith({
      portionProductIds: ['a', 'c'],
      accompanimentTypeId: type.id,
      quantityPerPortion: 25.5,
      accompanimentPrice: 4.5,
    })
    expect(linkMock.mock.calls[0]?.[0]).not.toHaveProperty('isGlobal')
    expect(onSuccessMock).toHaveBeenCalledTimes(1)
  })

  it('always sends the entered price, even when it equals the default, and never sends isGlobal', async () => {
    mockPricing(3)
    mockGlobal(globalDetails)
    const { result } = renderDialog()
    const quantity = registerInput(result, 'quantityPerPortion')
    act(() => {
      result.current.handleSelectedIdsChange(['b'])
      result.current.handleTypeChange(type.id)
    })
    await act(async () => {
      await typeValue(quantity, '60')
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(linkMock).toHaveBeenCalledWith({
      portionProductIds: ['b'],
      accompanimentTypeId: type.id,
      quantityPerPortion: 60,
      accompanimentPrice: 3,
    })
    expect(linkMock.mock.calls[0]?.[0]).not.toHaveProperty('isGlobal')
  })

  it('sends a zero price as an intentional change from the saved price', async () => {
    mockPricing(3)
    const { result } = renderDialog()
    const quantity = registerInput(result, 'quantityPerPortion')
    const price = registerInput(result, 'accompanimentPrice')
    act(() => {
      result.current.handleSelectedIdsChange(['a'])
      result.current.handleTypeChange(type.id)
    })
    await act(async () => {
      await typeValue(quantity, '10')
      await typeValue(price, '0')
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(linkMock.mock.calls[0]?.[0].accompanimentPrice).toBe(0)
  })

  it('validates a missing selection, type and quantity without calling the action', async () => {
    const { result } = renderDialog()
    registerInput(result, 'quantityPerPortion')

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(linkMock).not.toHaveBeenCalled()
    expect(result.current.errors.portionProductIds?.message).toBe(
      'Selecione ao menos uma porção.',
    )
    expect(result.current.errors.accompanimentTypeId?.message).toBe('Selecione um tipo.')
    expect(result.current.errors.quantityPerPortion).toBeDefined()
  })

  it('rejects an invalid price before calling the action', async () => {
    const { result } = renderDialog()
    const price = registerInput(result, 'accompanimentPrice')
    const quantity = registerInput(result, 'quantityPerPortion')
    act(() => {
      result.current.handleSelectedIdsChange(['a'])
      result.current.handleTypeChange(type.id)
    })
    await act(async () => {
      await typeValue(quantity, '10')
      await typeValue(price, '1,234')
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(linkMock).not.toHaveBeenCalled()
    expect(result.current.errors.accompanimentPrice?.message).toBe(
      'Informe um preço maior ou igual a zero, com até duas casas decimais.',
    )
  })

  it('keeps the dialog open on a rejection, refetches candidates, drops ineligible ids and keeps the values', async () => {
    linkMock.mockRejectedValue(new NotFoundError('Porção não encontrada.'))
    candidatesRefetchMock.mockResolvedValue({ data: [candidates[1], candidates[2]] })
    const { result } = renderDialog()
    await fillValidForm(result, ['a', 'b'])

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(candidatesRefetchMock).toHaveBeenCalledTimes(1)
    expect(result.current.actionError).toBe('Porção não encontrada.')
    expect(result.current.portionProductIds).toEqual(['b'])
    expect(result.current.typeId).toBe(type.id)
    expect(onSuccessMock).not.toHaveBeenCalled()
    expect(globalRefetchMock).not.toHaveBeenCalled()
    expect(onBecameGlobalMock).not.toHaveBeenCalled()
    expect(registerInputValue(result)).toBe('25,5')
  })

  it('shows the generic message for failures that are not errors and drops everything when no candidate remains', async () => {
    linkMock.mockRejectedValue('boom')
    candidatesRefetchMock.mockResolvedValue({ data: undefined })
    const { result } = renderDialog()
    await fillValidForm(result, ['a'])

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.actionError).toBe('Não foi possível vincular. Tente novamente.')
    expect(result.current.portionProductIds).toEqual([])
  })

  it('keeps the server message for an unclassified failure', async () => {
    linkMock.mockRejectedValue(new AppError('Erro inesperado.'))
    const { result } = renderDialog()
    await fillValidForm(result, ['a'])

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.actionError).toBe('Erro inesperado.')
    expect(globalRefetchMock).not.toHaveBeenCalled()
  })

  it('keeps the server text for a conflict while the Accompaniment is still individual', async () => {
    linkMock.mockRejectedValue(
      new ConflictError('Uma ou mais porções não estão disponíveis.'),
    )
    globalRefetchMock.mockResolvedValue({ data: individual })
    const { result } = renderDialog()
    await fillValidForm(result, ['a'])

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(globalRefetchMock).toHaveBeenCalledTimes(1)
    expect(result.current.actionError).toBe('Uma ou mais porções não estão disponíveis.')
  })

  it('closes through the became-global recovery without showing the server text when a conflict reveals a global', async () => {
    linkMock.mockRejectedValue(
      new ConflictError(
        'Este acompanhamento é global. Ative “Disponível para todas as porções”.',
      ),
    )
    globalRefetchMock.mockResolvedValue({ data: globalDetails })
    const { result } = renderDialog()
    await fillValidForm(result, ['a', 'b'])

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(globalRefetchMock).toHaveBeenCalledTimes(1)
    expect(onBecameGlobalMock).toHaveBeenCalledTimes(1)
    expect(result.current.actionError).toBeNull()
    expect(onSuccessMock).not.toHaveBeenCalled()
    expect(candidatesRefetchMock).not.toHaveBeenCalled()
  })

  it('treats a conflict whose global read has no data as a plain rejection', async () => {
    linkMock.mockRejectedValue(new ConflictError('Conflito.'))
    globalRefetchMock.mockResolvedValue({ data: undefined })
    candidatesRefetchMock.mockResolvedValue({ data: [candidates[1]] })
    const { result } = renderDialog()
    await fillValidForm(result, ['a', 'b'])

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(onBecameGlobalMock).not.toHaveBeenCalled()
    expect(result.current.actionError).toBe('Conflito.')
    expect(result.current.portionProductIds).toEqual(['b'])
  })

  it('clears the error when the selection or the type changes', async () => {
    linkMock.mockRejectedValue(new AppError('Erro inesperado.'))
    const { result } = renderDialog()
    await fillValidForm(result, ['a'])
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })
    expect(result.current.actionError).toBe('Erro inesperado.')

    act(() => result.current.handleSelectedIdsChange(['c']))
    expect(result.current.actionError).toBeNull()
  })

  it('reports the pending state of the link action', () => {
    useLinkActionMock.mockReturnValue({
      isPending: true,
      linkAccompanimentPortions: linkMock,
    } as never)
    const { result } = renderDialog()

    expect(result.current.isPending).toBe(true)
  })

  it('reports a refresh only when a background fetch already has data', () => {
    mockCandidates(candidates, { isFetching: true })
    expect(renderDialog().result.current.isRefreshing).toBe(true)
    cleanup()
    mockCandidates(candidates)
    expect(renderDialog().result.current.isRefreshing).toBe(false)
  })

  it('resets the selection and the entered values every time the dialog opens', async () => {
    const { result, rerender } = renderDialog()
    await fillValidForm(result, ['a'])
    expect(result.current.portionProductIds).toEqual(['a'])

    rerender({ isOpen: false })
    rerender({ isOpen: true })

    expect(result.current.portionProductIds).toEqual([])
    expect(result.current.typeId).toBe('')
  })

  it('keeps the entered values when the global state refetches while the dialog stays open', async () => {
    const { result, rerender } = renderDialog()
    await fillValidForm(result, ['a'])

    mockGlobal({ ...individual })
    rerender({ isOpen: true })

    expect(result.current.portionProductIds).toEqual(['a'])
    expect(result.current.typeId).toBe(type.id)
  })

  it('exposes the retry handlers of the underlying reads', () => {
    const retryPricing = vi.fn()
    const stockRefetch = vi.fn()
    usePricingQueryMock.mockReturnValue({
      pricing: undefined,
      pricingError: false,
      isLoadingPricing: false,
      isRefreshingPricing: false,
      retryPricing,
    } as never)
    useStockQueryMock.mockReturnValue({
      data: undefined,
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: stockRefetch,
    } as never)
    const { result } = renderDialog()

    result.current.retryAccompanimentPrice()
    result.current.retrySelectedStock()
    result.current.retryCandidates()

    expect(retryPricing).toHaveBeenCalledTimes(1)
    expect(stockRefetch).toHaveBeenCalledTimes(1)
    expect(candidatesRefetchMock).toHaveBeenCalledTimes(1)
  })
})

function registerInputValue(result: HookResult) {
  const registration = result.current.quantityRegistration
  const field = document.querySelector<HTMLInputElement>(
    `input[name="${registration.name}"]`,
  )
  return field?.value
}
