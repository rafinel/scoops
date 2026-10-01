import type { OrderDetails } from '@scoops/core/pdv/domain/structures'
import { createPortal } from 'react-dom'

import { OrderPrintAction } from './order-print-action'
import { OrderPrintDocument } from './order-print-document'
import { useOrderPrint } from './use-order-print'
import './order-print.css'

export type OrderPrintProps = {
  order: OrderDetails
  disabled?: boolean
}

export const OrderPrint = ({ order, disabled }: OrderPrintProps) => {
  const { portalTarget, isPrinting, isDisabled, handlePrint } = useOrderPrint(disabled)
  return (
    <>
      <OrderPrintAction {...{ isPrinting, isDisabled, onPrint: handlePrint }} />
      {portalTarget && createPortal(<OrderPrintDocument order={order} />, portalTarget)}
    </>
  )
}
