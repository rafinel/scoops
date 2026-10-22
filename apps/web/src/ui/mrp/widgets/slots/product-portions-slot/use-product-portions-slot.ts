import { useEffect } from 'react'

import { UserProfile } from '@scoops/core/identity/domain/structures'
import { ProductCategory, ProductStatus } from '@scoops/core/mrp/domain/structures'

import { productStockRoute } from '@/constants/routes'
import { useGlobalAccompanimentQuery } from '@/ui/mrp/hooks/use-global-accompaniment-query'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { usePortionsActionState } from './use-portions-action-state'
import { PORTIONS_PAGE_SIZE, usePortionsListState } from './use-portions-list-state'

export { PORTIONS_PAGE_SIZE }
export type { ProductPortionsAction } from './use-portions-action-state'

type StockQuery = ReturnType<typeof useProductStockQuery>
type ListState = ReturnType<typeof usePortionsListState>
type ListView = Omit<ListState, 'listStatus' | 'refetchPortions'>
type GlobalQuery = ReturnType<typeof useGlobalAccompanimentQuery>

function usePortionsGuard(productId: string) {
  const { navigateToPath } = useNavigation()
  const stockQuery = useProductStockQuery(productId)
  const categories = stockQuery.data?.product.categories
  const isEligible =
    Boolean(categories?.includes(ProductCategory.Accompaniment)) &&
    !categories?.includes(ProductCategory.Portion)
  const isUnsupported = categories !== undefined && !isEligible

  useEffect(() => {
    if (isUnsupported) void navigateToPath(productStockRoute(productId))
  }, [isUnsupported, navigateToPath, productId])

  return { isEligible, isUnsupported, stockQuery }
}

function getIsLoading(
  stockQuery: StockQuery,
  list: ListState['listStatus'],
  globalQuery: GlobalQuery,
  isEligible: boolean,
) {
  if (stockQuery.data !== undefined && !isEligible) return false
  if (stockQuery.isPending) return true
  return isEligible && (list.isPending || globalQuery.isPending)
}

function getSlotStatus(
  stockQuery: StockQuery,
  list: ListState['listStatus'],
  listView: ListView,
  globalQuery: GlobalQuery,
  isEligible: boolean,
) {
  const hasStock = Boolean(stockQuery.data)
  const isListRefreshing = list.isFetching && !listView.isPageLoading
  return {
    isError: stockQuery.isError || list.isError || globalQuery.isError,
    isLoading: getIsLoading(stockQuery, list, globalQuery, isEligible),
    isRefreshing:
      (stockQuery.isFetching && hasStock) ||
      (isListRefreshing && Boolean(listView.portionsPage)),
  }
}

function usePortionsData(productId: string, isEligible: boolean, stockQuery: StockQuery) {
  const { listStatus, refetchPortions, ...listView } = usePortionsListState(
    productId,
    isEligible,
  )
  const globalQuery = useGlobalAccompanimentQuery(productId, isEligible)

  return {
    ...listView,
    ...getSlotStatus(stockQuery, listStatus, listView, globalQuery, isEligible),
    globalAccompaniment: globalQuery.data,
    refetchers: { refetchGlobal: globalQuery.refetch, refetchPortions },
  }
}

type CloseHandlers = {
  handleActionClose: () => void
  handleBecameGlobalAction: () => void
}
type Refetchers = { refetchGlobal: () => unknown; refetchPortions: () => unknown }

function usePortionsRefresh({ refetchGlobal, refetchPortions }: Refetchers) {
  return function refreshReads() {
    void refetchPortions()
    void refetchGlobal()
  }
}

// The Accompaniment became global elsewhere: close the dialog and refresh both reads so the
// tab shows the global view; the slot then explains the change.
function usePortionsRecovery(closeHandlers: CloseHandlers, refreshReads: () => void) {
  function handleBecameGlobal() {
    closeHandlers.handleBecameGlobalAction()
    refreshReads()
  }

  return { handleBecameGlobal }
}

function usePortionsSlotHandlers(
  stockQuery: StockQuery,
  closeHandlers: CloseHandlers,
  refreshReads: () => void,
) {
  const { navigateTo } = useNavigation()

  function handleActionSuccess() {
    closeHandlers.handleActionClose()
    refreshReads()
  }

  function handleBack() {
    void navigateTo('products')
  }

  function handleRetry() {
    void stockQuery.refetch()
    refreshReads()
  }

  return { handleActionSuccess, handleBack, handleRetry }
}

export function useProductPortionsSlot(productId: string) {
  const { account } = useAuthContext()
  const { isEligible, isUnsupported, stockQuery } = usePortionsGuard(productId)
  const { refetchers, ...data } = usePortionsData(productId, isEligible, stockQuery)
  const { closeHandlers, ...actions } = usePortionsActionState()
  const refreshReads = usePortionsRefresh(refetchers)
  const product = stockQuery.data?.product

  return {
    ...actions,
    ...data,
    ...usePortionsSlotHandlers(stockQuery, closeHandlers, refreshReads),
    ...usePortionsRecovery(closeHandlers, refreshReads),
    canManage: account?.profile === UserProfile.Manager,
    isActive: product?.status === ProductStatus.Active,
    isUnsupported,
    product,
  }
}
