import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

import { ProductStockError } from '../product-stock-error'
import { ProductStockLoading } from '../product-stock-loading'

export type ProductStockStatusProps = {
  isError: boolean
  isLoading: boolean
  isRefreshing: boolean
  onRetry: () => void
}

export const ProductStockStatus = ({
  isError,
  isLoading,
  isRefreshing,
  onRetry,
}: ProductStockStatusProps) => (
  <>
    <QueryRefreshStatus isRefreshing={isRefreshing} />
    {isLoading ? <ProductStockLoading /> : null}
    {isError ? <ProductStockError onRetry={onRetry} /> : null}
  </>
)
