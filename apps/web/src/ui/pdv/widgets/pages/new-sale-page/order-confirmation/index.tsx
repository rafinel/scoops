import type { OrderDetails } from '@scoops/core/pdv/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { Card } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatDate } from '@/ui/shared/hooks/use-format-date'

export type OrderConfirmationProps = {
  order: OrderDetails
  onNewSale: () => void
}

export const OrderConfirmation = ({ order, onNewSale }: OrderConfirmationProps) => {
  const formatCurrency = useFormatCurrency()
  const formatDate = useFormatDate()

  return (
    <section
      aria-labelledby='order-confirmation-title'
      className='mx-auto w-full max-w-3xl py-8 sm:py-12'
    >
      <div className='text-center'>
        <span className='mx-auto grid size-16 place-items-center rounded-full bg-success-soft text-success'>
          <Icon name='circle-check' className='size-9' />
        </span>
        <h1
          className='mt-5 text-3xl font-black tracking-tight'
          id='order-confirmation-title'
        >
          Pedido registrado
        </h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          A venda foi concluída e já está disponível no histórico de pedidos.
        </p>
      </div>

      <Card className='mt-8 rounded-2xl shadow-card'>
        <div className='border-b border-border-soft p-5 sm:p-6'>
          <p className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
            Pedido
          </p>
          <p className='mt-1 text-2xl font-black'>
            #{String(order.sequenceNumber).padStart(4, '0')}
          </p>
        </div>
        <dl className='grid gap-4 border-b border-border-soft bg-muted/45 p-5 sm:grid-cols-3 sm:p-6'>
          <div>
            <dt className='text-xs text-muted-foreground'>Data e hora</dt>
            <dd className='mt-1 text-sm font-bold'>
              {formatDate(order.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
            </dd>
          </div>
          <div>
            <dt className='text-xs text-muted-foreground'>Canal de venda</dt>
            <dd className='mt-1 text-sm font-bold'>
              {order.channel
                ? `${order.channel.name} · ${order.channel.percentage > 0 ? '+' : ''}${order.channel.percentage}%`
                : 'Sem canal'}
            </dd>
          </div>
          <div>
            <dt className='text-xs text-muted-foreground'>Quantidade</dt>
            <dd className='mt-1 text-sm font-bold'>
              {order.lines.reduce((total, line) => total + line.quantity, 0)} itens
            </dd>
          </div>
        </dl>
        <div className='p-5 sm:p-6'>
          <h2 className='font-extrabold'>Itens do pedido</h2>
          <div className='mt-3 divide-y divide-border-soft'>
            {order.lines.map((line) => (
              <div
                className='flex items-center justify-between gap-4 py-3 text-sm'
                key={line.product.productId}
              >
                <div className='min-w-0'>
                  <p className='truncate font-bold'>{line.product.name}</p>
                  <p className='truncate text-xs text-muted-foreground'>
                    {line.size?.name ?? line.brand?.name ?? 'Unidade'} · {line.quantity}{' '}
                    un.
                  </p>
                </div>
                <strong className='shrink-0'>{formatCurrency(line.subtotal)}</strong>
              </div>
            ))}
          </div>
          <div className='mt-3 flex items-center justify-between gap-4 border-t border-border-soft pt-4'>
            <span className='font-extrabold'>Total do pedido</span>
            <strong className='text-2xl font-black'>{formatCurrency(order.total)}</strong>
          </div>
        </div>
      </Card>
      <div className='mt-6 flex flex-col justify-center gap-3 sm:flex-row'>
        <Button disabled type='button' variant='outline'>
          <Icon name='clipboard-list' /> Ver pedido
        </Button>
        <Button onClick={onNewSale} type='button'>
          <Icon name='plus' /> Iniciar nova venda
        </Button>
      </div>
      <p className='mt-4 text-center text-xs text-muted-foreground'>
        Este pedido também pode ser consultado em Pedidos.
      </p>
    </section>
  )
}
