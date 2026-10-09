import type { OrderDetails } from '@scoops/core/pdv/domain/structures'

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'

export type OrderTotalsProps = { order: OrderDetails }

export const OrderTotals = ({ order }: OrderTotalsProps) => {
  const formatCurrency = useFormatCurrency()
  const baseSubtotal =
    order.lines.reduce(
      (sum, line) => sum + Math.round(line.baseUnitPrice * 100) * line.quantity,
      0,
    ) / 100
  const adjustment =
    (Math.round(order.subtotal * 100) - Math.round(baseSubtotal * 100)) / 100

  return (
    <section aria-labelledby='order-totals-title'>
      <Card>
        <CardHeader className='border-b border-border-soft'>
          <CardTitle id='order-totals-title'>Composição do total</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 pt-5'>
          <div className='flex justify-between gap-4 text-sm'>
            <span className='text-muted-foreground'>Subtotal dos produtos</span>
            <span>{formatCurrency(baseSubtotal)}</span>
          </div>
          {order.channel ? (
            <div className='flex justify-between gap-4 text-sm text-primary'>
              <span>
                {order.channel.name} · {order.channel.percentage > 0 ? '+' : ''}
                {order.channel.percentage}%
              </span>
              <span>
                {adjustment > 0 ? '+ ' : adjustment < 0 ? '− ' : ''}
                {formatCurrency(Math.abs(adjustment))}
              </span>
            </div>
          ) : null}
          {order.discounts.map((item, index) => (
            <div
              className='flex justify-between gap-4 text-sm'
              key={`${item.discount.discountId}-${index}`}
            >
              <span>{item.discount.name}</span>
              <span>− {formatCurrency(item.savings)}</span>
            </div>
          ))}
          <div className='flex justify-between gap-4 border-t border-border-soft pt-4 font-extrabold'>
            <span>Total do pedido</span>
            <span className='text-xl'>{formatCurrency(order.total)}</span>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
