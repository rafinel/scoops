import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UserProfile } from '@scoops/core/identity/domain/structures'
import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type {
  AccompanimentPortionDetails,
  AccompanimentPortionsPage,
  GlobalAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'

import { productStockRoute } from '@/constants/routes'
import { useAccompanimentPortionsQuery } from '@/ui/mrp/hooks/use-accompaniment-portions-query'
import { useGlobalAccompanimentQuery } from '@/ui/mrp/hooks/use-global-accompaniment-query'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useDebouncedValue } from '@/ui/shared/hooks/use-debounced-value'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { PORTIONS_PAGE_SIZE, useProductPortionsSlot } from '../use-product-portions-slot'

vi.mock('@/ui/mrp/hooks/use-accompaniment-portions-query', () => ({
  useAccompanimentPortionsQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-global-accompaniment-query', () => ({
  useGlobalAccompanimentQuery: vi.fn(),
}))
vi.mock('@/ui/mrp/hooks/use-product-stock-query', () => ({
  useProductStockQuery: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-auth-context', () => ({ useAuthContext: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-debounced-value', () => ({ useDebouncedValue: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({ useNavigation: vi.fn() }))

const useAccompanimentPortionsQueryMock = vi.mocked(useAccompanimentPortionsQuery)
const useGlobalAccompanimentQueryMock = vi.mocked(useGlobalAccompanimentQuery)
const useProductStockQueryMock = vi.mocked(useProductStockQuery)
const useAuthContextMock = vi.mocked(useAuthContext)
const useDebouncedValueMock = vi.mocked(useDebouncedValue)
const useNavigationMock = vi.mocked(useNavigation)

const navigateToMock = vi.fn()
const navigateToPathMock = vi.fn()
const portionsRefetchMock = vi.fn()
const globalRefetchMock = vi.fn()
const stockRefetchMock = vi.fn()

const accompaniment = ProductFaker.fake({
  id: 'accompaniment-1',
  categories: ['accompaniment'],
  name: 'Granola',
  status: 'active',
})
const globalDetails: GlobalAccompanimentDetails = {
  accompanimentProductId: 'accompaniment-1',
  accompanimentProductName: 'Granola',
  isGlobal: false,
  unit: 'g',
  salePrice: 3,
}
const row: AccompanimentPortionDetails = {
  id: 'link-1',
  accompanimentProductId: 'accompaniment-1',
  accompanimentProductName: 'Granola',
  accompanimentTypeId: 'type-1',
  accompanimentTypeName: 'Cobertura',
  unit: 'g',
  quantityPerPortion: 50,
  salePrice: 3,
  isGlobal: false,
  hasOtherPortionLinks: false,
  portionProductId: 'portion-1',
  portionProductName: 'Açaí 300 ml',
}

function createPage(overrides: Partial<AccompanimentPortionsPage> = {}) {
  return {
    items: [row],
    page: 1,
    pageSize: 10,
    total: 23,
    totalPages: 3,
    hasPortionProducts: true,
    ...overrides,
  } as AccompanimentPortionsPage
}

function mockQueries({
  global = globalDetails,
  page = createPage(),
  portionsOverrides = {},
  product = accompaniment,
  stockOverrides = {},
}: {
  global?: GlobalAccompanimentDetails | null
  page?: AccompanimentPortionsPage | null
  portionsOverrides?: Record<string, unknown>
  product?: ReturnType<typeof ProductFaker.fake> | null
  stockOverrides?: Record<string, unknown>
} = {}) {
  useProductStockQueryMock.mockReturnValue({
    data: product ? { product } : undefined,
    isError: false,
    isFetching: false,
    isPending: product === null,
    refetch: stockRefetchMock,
    ...stockOverrides,
  } as never)
  useAccompanimentPortionsQueryMock.mockReturnValue({
    data: page ?? undefined,
    isError: false,
    isFetching: false,
    isPending: page === null,
    isPlaceholderData: false,
    refetch: portionsRefetchMock,
    ...portionsOverrides,
  } as never)
  useGlobalAccompanimentQueryMock.mockReturnValue({
    data: global ?? undefined,
    isError: false,
    isPending: global === null,
    refetch: globalRefetchMock,
  } as never)
}

describe('useProductPortionsSlot', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Manager },
    } as never)
    useDebouncedValueMock.mockImplementation((value) => value)
    useNavigationMock.mockReturnValue({
      navigateTo: navigateToMock,
      navigateToPath: navigateToPathMock,
    } as never)
    mockQueries()
  })

  it('exposes the Accompaniment data, the Manager capability and the loaded state', () => {
    const { result } = renderHook(() => useProductPortionsSlot('accompaniment-1'))

    expect(result.current.canManage).toBe(true)
    expect(result.current.product).toBe(accompaniment)
    expect(result.current.portionsPage?.items).toEqual([row])
    expect(result.current.globalAccompaniment).toBe(globalDetails)
    expect(result.current.isActive).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.isUnsupported).toBe(false)
    expect(result.current.isRefreshing).toBe(false)
    expect(result.current.isPageLoading).toBe(false)
    expect(result.current.linkedCount).toBe(23)
    expect(result.current.searchInput).toBe('')
    expect(result.current.selectedAction).toBeUndefined()
    expect(result.current.hasBecomeGlobalNotice).toBe(false)
  })

  it('reports Operators and inactive products', () => {
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Operator },
    } as never)
    mockQueries({ product: ProductFaker.fake({ ...accompaniment, status: 'inactive' }) })

    const { result } = renderHook(() => useProductPortionsSlot('accompaniment-1'))

    expect(result.current.canManage).toBe(false)
    expect(result.current.isActive).toBe(false)
  })

  it('requests the first page with the fixed page size and no search', () => {
    renderHook(() => useProductPortionsSlot('accompaniment-1'))

    expect(PORTIONS_PAGE_SIZE).toBe(10)
    expect(useAccompanimentPortionsQueryMock).toHaveBeenCalledWith(
      'accompaniment-1',
      { page: 1, pageSize: 10, search: undefined },
      true,
    )
    expect(useGlobalAccompanimentQueryMock).toHaveBeenLastCalledWith(
      'accompaniment-1',
      true,
    )
  })

  it('enables the Portions and global queries only for an Accompaniment without Portion', () => {
    mockQueries({
      product: ProductFaker.fake({ categories: ['portion', 'accompaniment'] }),
    })

    renderHook(() => useProductPortionsSlot('accompaniment-1'))

    expect(useAccompanimentPortionsQueryMock).toHaveBeenLastCalledWith(
      'accompaniment-1',
      expect.anything(),
      false,
    )
    expect(useGlobalAccompanimentQueryMock).toHaveBeenLastCalledWith(
      'accompaniment-1',
      false,
    )
  })

  it.each([
    [['portion', 'accompaniment']],
    [['portion']],
    [['ingredient']],
    [['resale', 'manufacturable']],
  ])('redirects %j to the Stock tab and renders no content', (categories) => {
    mockQueries({ product: ProductFaker.fake({ categories: categories as never }) })

    const { result } = renderHook(() => useProductPortionsSlot('accompaniment-1'))

    expect(navigateToPathMock).toHaveBeenCalledWith(productStockRoute('accompaniment-1'))
    expect(result.current.isUnsupported).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('does not redirect while the product is loading or for an eligible Accompaniment', () => {
    mockQueries({ page: null, product: null })
    const loading = renderHook(() => useProductPortionsSlot('accompaniment-1'))
    expect(loading.result.current.isLoading).toBe(true)
    cleanup()
    mockQueries()
    renderHook(() => useProductPortionsSlot('accompaniment-1'))

    expect(navigateToPathMock).not.toHaveBeenCalled()
  })

  it('is loading while the Portions or global reads are pending and errors if any read fails', () => {
    mockQueries({ portionsOverrides: { isPending: true } })
    expect(renderHook(() => useProductPortionsSlot('a')).result.current.isLoading).toBe(
      true,
    )
    cleanup()
    mockQueries({ global: null })
    expect(renderHook(() => useProductPortionsSlot('a')).result.current.isLoading).toBe(
      true,
    )
    cleanup()
    mockQueries({ portionsOverrides: { isError: true } })
    expect(renderHook(() => useProductPortionsSlot('a')).result.current.isError).toBe(
      true,
    )
    cleanup()
    mockQueries({ stockOverrides: { isError: true } })
    expect(renderHook(() => useProductPortionsSlot('a')).result.current.isError).toBe(
      true,
    )
    cleanup()
    useGlobalAccompanimentQueryMock.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      refetch: globalRefetchMock,
    } as never)
    expect(renderHook(() => useProductPortionsSlot('a')).result.current.isError).toBe(
      true,
    )
  })

  it('reports a refresh only when a background fetch has data, not for a placeholder page', () => {
    mockQueries({ portionsOverrides: { isFetching: true } })
    expect(
      renderHook(() => useProductPortionsSlot('a')).result.current.isRefreshing,
    ).toBe(true)
    cleanup()
    mockQueries({ portionsOverrides: { isFetching: true, isPlaceholderData: true } })
    const placeholder = renderHook(() => useProductPortionsSlot('a'))
    expect(placeholder.result.current.isRefreshing).toBe(false)
    expect(placeholder.result.current.isPageLoading).toBe(true)
    cleanup()
    mockQueries({ stockOverrides: { isFetching: true } })
    expect(
      renderHook(() => useProductPortionsSlot('a')).result.current.isRefreshing,
    ).toBe(true)
  })

  it('debounces the trimmed search by 300 ms, skipping the delay when it is empty', () => {
    const { result } = renderHook(() => useProductPortionsSlot('accompaniment-1'))

    act(() => result.current.handleSearchChange('  AÇA  '))

    expect(result.current.searchInput).toBe('  AÇA  ')
    expect(useDebouncedValueMock).toHaveBeenLastCalledWith('AÇA', 300, false)
    expect(useAccompanimentPortionsQueryMock).toHaveBeenCalledWith(
      'accompaniment-1',
      { page: 1, pageSize: 10, search: 'AÇA' },
      true,
    )
    act(() => result.current.handleSearchChange('   '))
    expect(useDebouncedValueMock).toHaveBeenLastCalledWith('', 300, true)
    expect(useAccompanimentPortionsQueryMock).toHaveBeenCalledWith(
      'accompaniment-1',
      { page: 1, pageSize: 10, search: undefined },
      true,
    )
  })

  it('changes pages and returns to page 1 when the applied search changes', () => {
    const { result } = renderHook(() => useProductPortionsSlot('accompaniment-1'))

    act(() => result.current.handlePageChange(3))
    expect(useAccompanimentPortionsQueryMock).toHaveBeenCalledWith(
      'accompaniment-1',
      { page: 3, pageSize: 10, search: undefined },
      true,
    )
    act(() => result.current.handleSearchChange('sorv'))

    expect(useAccompanimentPortionsQueryMock).toHaveBeenCalledWith(
      'accompaniment-1',
      { page: 1, pageSize: 10, search: 'sorv' },
      true,
    )
    expect(result.current.isSearching).toBe(true)
    act(() => result.current.handlePageChange(2))
    expect(useAccompanimentPortionsQueryMock).toHaveBeenCalledWith(
      'accompaniment-1',
      { page: 2, pageSize: 10, search: 'sorv' },
      true,
    )
  })

  it('reads the unfiltered count from a separate one-row query only while a search is active', () => {
    const { result } = renderHook(() => useProductPortionsSlot('accompaniment-1'))

    expect(useAccompanimentPortionsQueryMock).toHaveBeenCalledWith(
      'accompaniment-1',
      { page: 1, pageSize: 1 },
      false,
    )
    act(() => result.current.handleSearchChange('pistache'))

    expect(useAccompanimentPortionsQueryMock).toHaveBeenLastCalledWith(
      'accompaniment-1',
      { page: 1, pageSize: 1 },
      true,
    )
  })

  it('keeps the unfiltered linked count while a search narrows the results and follows later mutations', () => {
    function mockSearchQueries(unfilteredTotal: number) {
      useAccompanimentPortionsQueryMock.mockImplementation(((
        _id: string,
        input: { pageSize: number },
      ) => ({
        data:
          input.pageSize === 1
            ? createPage({ items: [], total: unfilteredTotal })
            : createPage({ items: [], total: 0 }),
        isError: false,
        isFetching: false,
        isPending: false,
        isPlaceholderData: false,
        refetch: portionsRefetchMock,
      })) as never)
    }
    mockQueries()
    const { result, rerender } = renderHook(() =>
      useProductPortionsSlot('accompaniment-1'),
    )
    expect(result.current.linkedCount).toBe(23)

    act(() => result.current.handleSearchChange('pistache'))
    mockSearchQueries(23)
    rerender()
    expect(result.current.isSearching).toBe(true)
    expect(result.current.linkedCount).toBe(23)

    mockSearchQueries(0)
    rerender()
    expect(result.current.linkedCount).toBe(0)
    act(() => result.current.handleSearchChange(''))
    mockQueries({ page: createPage({ total: 22 }) })
    rerender()
    expect(result.current.linkedCount).toBe(22)
  })

  it('opens each page action and clears the selection on close', () => {
    const { result } = renderHook(() => useProductPortionsSlot('accompaniment-1'))
    const actions = [
      ['link', result.current.handleLinkAction],
      ['make-global', result.current.handleMakeGlobalAction],
      ['edit-global', result.current.handleEditGlobalAction],
      ['make-individual', result.current.handleMakeIndividualAction],
      ['remove-global', result.current.handleRemoveGlobalAction],
    ] as const

    for (const [kind, open] of actions) {
      act(() => open())
      expect(result.current.selectedAction).toEqual({ kind })
      act(() => result.current.handleActionOpenChange(false))
      expect(result.current.selectedAction).toBeUndefined()
    }
  })

  it('opens the row actions with the row and keeps the action while the dialog stays open', () => {
    const { result } = renderHook(() => useProductPortionsSlot('accompaniment-1'))

    act(() => result.current.handleEditRowAction(row))
    expect(result.current.selectedAction).toEqual({ item: row, kind: 'edit-row' })
    act(() => result.current.handleActionOpenChange(true))
    expect(result.current.selectedAction).toEqual({ item: row, kind: 'edit-row' })
    act(() => result.current.handleRemoveRowAction(row))
    expect(result.current.selectedAction).toEqual({ item: row, kind: 'remove-row' })
  })

  it('closes the action and refetches the Portions and global reads on success', () => {
    const { result } = renderHook(() => useProductPortionsSlot('accompaniment-1'))
    act(() => result.current.handleLinkAction())

    act(() => result.current.handleActionSuccess())

    expect(result.current.selectedAction).toBeUndefined()
    expect(portionsRefetchMock).toHaveBeenCalledTimes(1)
    expect(globalRefetchMock).toHaveBeenCalledTimes(1)
  })

  it('closes the dialog, refetches both reads and shows the became-global message on a recovery', () => {
    const { result } = renderHook(() => useProductPortionsSlot('accompaniment-1'))
    act(() => result.current.handleLinkAction())

    act(() => result.current.handleBecameGlobal())

    expect(result.current.selectedAction).toBeUndefined()
    expect(result.current.hasBecomeGlobalNotice).toBe(true)
    expect(portionsRefetchMock).toHaveBeenCalledTimes(1)
    expect(globalRefetchMock).toHaveBeenCalledTimes(1)
  })

  it('dismisses the became-global message when another action starts', () => {
    const { result } = renderHook(() => useProductPortionsSlot('accompaniment-1'))
    act(() => result.current.handleBecameGlobal())
    expect(result.current.hasBecomeGlobalNotice).toBe(true)

    act(() => result.current.handleEditRowAction(row))

    expect(result.current.hasBecomeGlobalNotice).toBe(false)
    expect(result.current.selectedAction).toEqual({ item: row, kind: 'edit-row' })
  })

  it('refetches every read on retry and navigates back to Products', () => {
    const { result } = renderHook(() => useProductPortionsSlot('accompaniment-1'))

    act(() => result.current.handleRetry())
    act(() => result.current.handleBack())

    expect(stockRefetchMock).toHaveBeenCalledTimes(1)
    expect(portionsRefetchMock).toHaveBeenCalledTimes(1)
    expect(globalRefetchMock).toHaveBeenCalledTimes(1)
    expect(navigateToMock).toHaveBeenCalledWith('products')
  })
})
