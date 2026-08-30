import { OrderStatus } from '@scoops/core/pdv/domain/structures'
import type { OrderDetails } from '@scoops/core/pdv/domain/structures'

import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@/ui/shadcn/accordion'
import { Badge } from '@/ui/shadcn/badge'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatDate } from '@/ui/shared/hooks/use-format-date'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrderSummaryProps = { order: OrderDetails }

export const OrderSummary = ({ order }: OrderSummaryProps) => {
  const formatCurrency = useFormatCurrency()
  const formatDate = useFormatDate()
  const totalItems = order.lines.reduce((total, line) => total + line.quantity, 0)

  return (
    <div className='space-y-5'>
      <Accordion
        className='space-y-5'
        defaultValue={
          order.channel ? ['order-information', 'order-totals'] : ['order-information']
        }
        multiple
      >
        <AccordionItem value='order-information'>
          <AccordionHeader>
            <AccordionTrigger>
              <span className='flex items-center gap-2'>
                <Icon className='size-5 text-primary' name='clipboard-list' /> Informações
                do pedido
              </span>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>
            <div className='grid gap-4 p-5 sm:p-6'>
              <div>
                <p className='text-xs text-muted-foreground'>Status</p>
                <Badge
                  className='mt-1'
                  variant={
                    order.status === OrderStatus.Canceled ? 'destructive' : 'default'
                  }
                >
                  {order.status === OrderStatus.Canceled ? 'Cancelado' : 'Registrado'}
                </Badge>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>
                  {order.status === OrderStatus.Canceled
                    ? 'Registrado em'
                    : 'Data e hora'}
                </p>
                <p className='mt-1 font-semibold'>
                  {formatDate(order.createdAt, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Itens</p>
                <p className='mt-1 font-semibold'>{totalItems} unidades</p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Registrado por</p>
                <p className='mt-1 font-semibold'>{order.createdByName}</p>
              </div>
              {order.cancellation ? (
                <>
                  <div>
                    <p className='text-xs text-muted-foreground'>Cancelado em</p>
                    <p className='mt-1 font-semibold'>
                      {formatDate(order.cancellation.canceledAt, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>Cancelado por</p>
                    <p className='mt-1 font-semibold'>
                      {order.cancellation.canceledByName}
                    </p>
                  </div>
                  {order.cancellation.reason ? (
                    <div>
                      <p className='text-xs text-muted-foreground'>
                        Motivo do cancelamento
                      </p>
                      <p className='mt-1 font-semibold'>{order.cancellation.reason}</p>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </AccordionPanel>
        </AccordionItem>
        {order.channel ? (
          <AccordionItem value='order-totals'>
            <AccordionHeader>
              <AccordionTrigger>
                <span className='flex items-center gap-2'>
                  <Icon className='size-5 text-primary' name='store' />
                  {order.channel.name}
                </span>
              </AccordionTrigger>
            </AccordionHeader>
            <AccordionPanel>
              <div className='space-y-3 p-5 sm:p-6'>
                <div className='hidden justify-between gap-4 text-sm text-primary xl:flex'>
                  <span>Acrescimo do canal</span>
                  <span>+{order.channel.percentage}%</span>
                </div>
                <div className='space-y-3 xl:hidden'>
                  <div className='flex justify-between gap-4 text-sm'>
                    <span className='text-muted-foreground'>Subtotal dos produtos</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className='flex justify-between gap-4 text-sm text-primary'>
                    <span>Acrescimo do canal</span>
                    <span>+{order.channel.percentage}%</span>
                  </div>
                  <div className='flex justify-between gap-4 border-t border-border-soft pt-4 font-extrabold'>
                    <span>Total do pedido</span>
                    <span className='text-xl'>{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </AccordionPanel>
          </AccordionItem>
        ) : null}
      </Accordion>
    </div>
  )
}
