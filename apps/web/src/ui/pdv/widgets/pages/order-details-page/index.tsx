import { OrderStatus } from '@scoops/core/pdv/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { BackLink } from '@/ui/shared/widgets/components/back-link'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { CancelOrderDialog } from './cancel-order-dialog'
import { OrderDetailsError } from './order-details-error'
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
      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <BackLink
            aria-label='Voltar para pedidos'
            onClick={handleBack}
            route='orders'
          />
          <h1 className='mt-2 text-[28px] font-extrabold tracking-tight'>
            Pedido #{String(order.sequenceNumber).padStart(5, '0')}
          </h1>
        </div>
        <div className='flex flex-col items-start gap-2 sm:items-end'>
          {order.status === OrderStatus.Canceled ? (
            <p className='text-sm font-bold text-danger'>
              Cancelado em{' '}
              {new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              }).format(order.cancellation?.canceledAt)}
            </p>
          ) : (
            <p className='text-sm text-muted-foreground'>
              {new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              }).format(order.createdAt)}
            </p>
          )}
          {canCancel ? (
            <Button
              color='danger'
              className='bg-danger text-white hover:bg-danger/80'
              onClick={handleOpenCancel}
              type='button'
              variant='destructive'
            >
              <Icon name='x' /> Cancelar pedido
            </Button>
          ) : null}
        </div>
      </header>
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
