import { ProductDetailsPage } from '@/ui/mrp/widgets/pages/product-details-page'
import { QueryRefreshStatus } from '@/ui/shared/widgets/components/query-refresh-status'

import { PortionsContent } from './portions-content'
import { PortionsError } from './portions-error'
import { PortionsLoading } from './portions-loading'
import { useProductPortionsSlot } from './use-product-portions-slot'

export type ProductPortionsSlotProps = {
  productId: string
}

export const ProductPortionsSlot = ({ productId }: ProductPortionsSlotProps) => {
  const {
    isError,
    isLoading,
    isRefreshing,
    isUnsupported,
    product,
    handleBack,
    handleRetry,
    ...content
  } = useProductPortionsSlot(productId)

  return (
    <ProductDetailsPage onBack={handleBack} product={product} selectedTab='portions'>
      <QueryRefreshStatus isRefreshing={isRefreshing} />
      {isLoading ? <PortionsLoading /> : null}
      {isError && !isUnsupported ? <PortionsError onRetry={handleRetry} /> : null}
      {isUnsupported || isLoading || isError ? null : (
        <PortionsContent {...content} productId={productId} />
      )}
    </ProductDetailsPage>
  )
}
