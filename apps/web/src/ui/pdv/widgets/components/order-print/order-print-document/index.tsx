import type { OrderDetails } from '@scoops/core/pdv/domain/structures'

import { OrderPrintBody } from './order-print-body'
import { useOrderPrintDocument } from './use-order-print-document'

export type OrderPrintDocumentProps = { order: OrderDetails }

export const OrderPrintDocument = ({ order }: OrderPrintDocumentProps) => {
  const { sequence, metadata, lines, totals, cancellation, count } =
    useOrderPrintDocument(order)
  return (
    <OrderPrintBody {...{ sequence, metadata, lines, totals, cancellation, count }} />
  )
}
