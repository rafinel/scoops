import type { OrderDetails } from '@scoops/core/pdv/domain/structures'

import { OrderConfirmationBody } from './order-confirmation-body'
import { useOrderConfirmation } from './use-order-confirmation'

export type OrderConfirmationProps = {
  order: OrderDetails
  onNewSale: () => void
}

export const OrderConfirmation = (props: OrderConfirmationProps) => {
  const { sequence, metadata, lines, total, handleNewSale } = useOrderConfirmation(props)
  return (
    <OrderConfirmationBody
      {...props}
      {...{ sequence, metadata, lines, total, onNewSale: handleNewSale }}
    />
  )
}
