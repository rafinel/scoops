import { OrderPrintHeader, type OrderPrintHeaderProps } from '../order-print-header'
import { OrderPrintItems, type OrderPrintItemsProps } from '../order-print-items'
import { OrderPrintSummary, type OrderPrintSummaryProps } from '../order-print-summary'

export type OrderPrintBodyProps = {
  sequence: OrderPrintHeaderProps['sequence']
  metadata: OrderPrintHeaderProps['metadata']
  lines: OrderPrintItemsProps['lines']
  totals: OrderPrintSummaryProps['totals']
  cancellation: OrderPrintSummaryProps['cancellation']
  count: OrderPrintSummaryProps['count']
}

export const OrderPrintBody = ({
  sequence,
  metadata,
  lines,
  totals,
  cancellation,
  count,
}: OrderPrintBodyProps) => (
  <article
    aria-label={`Cópia não fiscal do pedido #${sequence}`}
    className='order-print-document'
  >
    <OrderPrintHeader sequence={sequence} metadata={metadata} />
    <OrderPrintItems lines={lines} />
    <OrderPrintSummary totals={totals} cancellation={cancellation} count={count} />
  </article>
)
