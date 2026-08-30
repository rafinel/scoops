import type { OrderDetails } from '@scoops/core/pdv/domain/structures'

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'

export type OrderTotalsProps = { order: OrderDetails }

export const OrderTotals = ({ order }: OrderTotalsProps) => {
  const formatCurrency = useFormatCurrency()

  return (
    <section aria-labelledby='order-totals-title'>
      <Card>
        <CardHeader className='border-b border-border-soft'>
          <CardTitle id='order-totals-title'>Composição do total</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 pt-5'>
          <div className='flex justify-between gap-4 text-sm'>
            <span className='text-muted-foreground'>Subtotal dos produtos</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.channel ? (
            <div className='flex justify-between gap-4 text-sm text-primary'>
              <span>Acrescimo do canal</span>
              <span>+{order.channel.percentage}%</span>
            </div>
          ) : null}
          <div className='flex justify-between gap-4 border-t border-border-soft pt-4 font-extrabold'>
            <span>Total do pedido</span>
            <span className='text-xl'>{formatCurrency(order.total)}</span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
