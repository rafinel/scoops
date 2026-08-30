import type { Order } from '@scoops/core/pdv/domain/entities'
import { OrderStatus } from '@scoops/core/pdv/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Pagination } from '@/ui/shared/widgets/components/pagination'

import { useOrdersList } from './use-orders-list'

export type OrdersListProps = {
  onOpenOrder: (orderId: string) => void
  onPageChange: (page: number) => void
  ordersPage: {
    items: readonly Order[]
    page: number
    pageSize: number
    total: number
  }
}

export const OrdersList = ({
  onOpenOrder,
  onPageChange,
  ordersPage,
}: OrdersListProps) => {
  const { formatOrderDate, formatOrderTotal } = useOrdersList()

  return (
    <section
      className='overflow-hidden rounded-2xl border border-border bg-card shadow-card'
      aria-label='Lista de pedidos'
    >
      <div className='grid gap-3 p-3 lg:hidden'>
        {ordersPage.items.map((order) => (
          <article className='rounded-xl border border-border-soft p-4' key={order.id}>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <p className='font-extrabold'>
                  Pedido #{String(order.sequenceNumber).padStart(5, '0')}
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {formatOrderDate(order.createdAt)}
                </p>
              </div>
              <Badge
                variant={
                  order.status === OrderStatus.Canceled ? 'destructive' : 'default'
                }
              >
                {order.status === OrderStatus.Canceled ? 'Cancelado' : 'Registrado'}
              </Badge>
            </div>
            <dl className='mt-4 grid grid-cols-2 gap-3 text-sm'>
              <div>
                <dt className='text-xs text-muted-foreground'>Operador</dt>
                <dd className='font-semibold'>{order.createdByName}</dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>Canal</dt>
                <dd className='font-semibold'>{order.channel?.name ?? 'Sem canal'}</dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>Itens</dt>
                <dd className='font-semibold'>
                  {order.lines.reduce((total, line) => total + line.quantity, 0)} unidades
                </dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>Total</dt>
                <dd className='font-extrabold'>{formatOrderTotal(order.total)}</dd>
              </div>
            </dl>
            <Button
              className='mt-4 w-full'
              onClick={() => onOpenOrder(order.id)}
              type='button'
              variant='outline'
            >
              <Icon name='eye' /> Ver detalhes
            </Button>
          </article>
        ))}
      </div>
      <div className='hidden overflow-x-auto lg:block'>
        <table className='w-full min-w-[850px] text-left text-sm'>
          <caption className='sr-only'>Pedidos mais recentes primeiro</caption>
          <thead className='bg-muted text-[11px] font-extrabold uppercase tracking-[0.08em] text-muted-foreground'>
            <tr>
              <th className='px-4 py-3 sm:px-5'>Pedido</th>
              <th className='px-4 py-3'>Data e hora</th>
              <th className='px-4 py-3'>Operador</th>
              <th className='px-4 py-3'>Canal</th>
              <th className='px-4 py-3'>Itens</th>
              <th className='px-4 py-3'>Total</th>
              <th className='px-4 py-3'>Status</th>
              <th className='px-4 py-3 text-center'>AÇÃO</th>
            </tr>
          </thead>
          <tbody>
            {ordersPage.items.map((order) => (
              <tr className='border-t border-border-soft' key={order.id}>
                <td className='px-4 py-4 font-extrabold sm:px-5'>
                  #{String(order.sequenceNumber).padStart(5, '0')}
                </td>
                <td className='px-4 py-4 text-muted-foreground'>
                  {formatOrderDate(order.createdAt)}
                </td>
                <td className='px-4 py-4'>{order.createdByName}</td>
                <td className='px-4 py-4'>{order.channel?.name ?? 'Sem canal'}</td>
                <td className='px-4 py-4 text-muted-foreground'>
                  {order.lines.reduce((total, line) => total + line.quantity, 0)} itens
                </td>
                <td className='px-4 py-4 font-extrabold'>
                  {formatOrderTotal(order.total)}
                </td>
                <td className='px-4 py-4'>
                  <Badge
                    variant={
                      order.status === OrderStatus.Canceled ? 'destructive' : 'default'
                    }
                  >
                    {order.status === OrderStatus.Canceled ? 'Cancelado' : 'Registrado'}
                  </Badge>
                </td>
                <td className='px-4 py-4 text-center'>
                  <Button
                    aria-label={`Ver pedido ${order.sequenceNumber}`}
                    className='h-auto gap-1 rounded-none border-0 bg-transparent px-0 py-0 font-bold hover:bg-transparent hover:text-primary'
                    onClick={() => onOpenOrder(order.id)}
                    type='button'
                    variant='link'
                  >
                    Detalhes <Icon name='arrow' />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={ordersPage.page}
        itemLabel='pedidos'
        onPageChange={onPageChange}
        pageSize={ordersPage.pageSize}
        totalItems={ordersPage.total}
      />
    </section>
  )
}
