import { OrderPrint } from '@/ui/pdv/widgets/components/order-print'

import { CancelOrderDialog } from './cancel-order-dialog'
import { OrderDetailsError } from './order-details-error'
import { OrderDetailsHeader } from './order-details-header'
import { OrderDetailsLoading } from './order-details-loading'
import { OrderDetailsContent } from './order-details-content'
import { type OrderDetailsPageProps, useOrderDetailsPage } from './use-order-details-page'

export type { OrderDetailsPageProps }

export const OrderDetailsPage = ({ orderId }: OrderDetailsPageProps) => {
  const {
    canCancel,
    isCancelOpen,
    isLoadingOrder,
    isRefreshingOrder,
    order,
    orderError,
    handleBack,
    handleCancelOpenChange,
    handleOpenCancel,
    handleRetry,
  } = useOrderDetailsPage(orderId)

  if (isLoadingOrder) return <OrderDetailsLoading />
  if (orderError || !order)
    return <OrderDetailsError onBack={handleBack} onRetry={handleRetry} />

  return (
    <section className='min-w-0 space-y-5'>
      <OrderDetailsHeader
        printAction={<OrderPrint disabled={isRefreshingOrder} order={order} />}
        canCancel={canCancel}
        canceledAt={order.cancellation?.canceledAt}
        createdAt={order.createdAt}
        isRefreshing={isRefreshingOrder}
        onBack={handleBack}
        onOpenCancel={handleOpenCancel}
        sequenceNumber={order.sequenceNumber}
        status={order.status}
      />
      <OrderDetailsContent order={order} />
      <CancelOrderDialog
        onOpenChange={handleCancelOpenChange}
        onSuccess={() => undefined}
        open={isCancelOpen}
        order={order}
      />
    </section>
  )
}
