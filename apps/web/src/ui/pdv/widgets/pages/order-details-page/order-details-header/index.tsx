import { OrderStatus } from '@scoops/core/pdv/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { PageRefreshStatus } from '@/ui/pdv/widgets/pages/query-refresh-status'
import { BackLink } from '@/ui/shared/widgets/components/back-link'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrderDetailsHeaderProps = {
  canCancel: boolean
  canceledAt?: Date
  createdAt: Date
  isRefreshing: boolean
  onBack: () => void
  onOpenCancel: () => void
  sequenceNumber: number
  status: OrderStatus
}

export const OrderDetailsHeader = (props: OrderDetailsHeaderProps) => (
  <>
    <PageRefreshStatus isRefreshing={props.isRefreshing} label='Atualizando pedido…' />
    <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <div>
        <BackLink
          aria-label='Voltar para pedidos'
          onClick={props.onBack}
          route='orders'
        />
        <h1 className='mt-2 text-[28px] font-extrabold tracking-tight'>
          Pedido #{String(props.sequenceNumber).padStart(5, '0')}
        </h1>
      </div>
      <div className='flex flex-col items-start gap-2 sm:items-end'>
        {props.status === OrderStatus.Canceled ? (
          <p className='text-sm font-bold text-danger'>
            Cancelado em{' '}
            {new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            }).format(props.canceledAt)}
          </p>
        ) : (
          <p className='text-sm text-muted-foreground'>
            {new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            }).format(props.createdAt)}
          </p>
        )}
        {props.canCancel ? (
          <Button
            color='danger'
            className='bg-danger text-white hover:bg-danger/80'
            onClick={props.onOpenCancel}
            type='button'
            variant='destructive'
          >
            <Icon name='x' /> Cancelar pedido
          </Button>
        ) : null}
      </div>
    </header>
  </>
)
