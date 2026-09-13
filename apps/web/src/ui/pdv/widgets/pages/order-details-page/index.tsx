import { CancelOrderDialog } from './cancel-order-dialog'
import { OrderDetailsError } from './order-details-error'
import { OrderDetailsHeader } from './order-details-header'
import { OrderDetailsLoading } from './order-details-loading'
import { OrderItems } from './order-items'
import { OrderSummary } from './order-summary'
import { OrderTotals } from './order-totals'
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
        canCancel={canCancel}
        canceledAt={order.cancellation?.canceledAt}
        createdAt={order.createdAt}
        isRefreshing={isRefreshingOrder}
        onBack={handleBack}
        onOpenCancel={handleOpenCancel}
        sequenceNumber={order.sequenceNumber}
        status={order.status}
      />
      <div className='grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]'>
        <div className='min-w-0 xl:col-start-2 xl:row-start-1'>
          <OrderSummary order={order} />
        </div>
        <div className='min-w-0 space-y-5 xl:col-start-1 xl:row-start-1'>
          <OrderItems order={order} />
          <div className='hidden xl:block'>
            <OrderTotals order={order} />
          </div>
        </div>
      </div>
      <CancelOrderDialog
        onOpenChange={handleCancelOpenChange}
        onSuccess={() => undefined}
        open={isCancelOpen}
        order={order}
      />
    </section>
  )
}
