import {
  OrderConfirmationActions,
  type OrderConfirmationActionsProps,
} from '../order-confirmation-actions'
import {
  OrderConfirmationCard,
  type OrderConfirmationCardProps,
} from '../order-confirmation-card'
import { OrderConfirmationHeading } from '../order-confirmation-heading'

export type OrderConfirmationBodyProps = {
  order: OrderConfirmationActionsProps['order']
  sequence: OrderConfirmationCardProps['sequence']
  metadata: OrderConfirmationCardProps['metadata']
  lines: OrderConfirmationCardProps['lines']
  total: OrderConfirmationCardProps['total']
  breakdown?: OrderConfirmationCardProps['breakdown']
  onNewSale: OrderConfirmationActionsProps['onNewSale']
}

export const OrderConfirmationBody = (props: OrderConfirmationBodyProps) => (
  <section
    aria-labelledby='order-confirmation-title'
    className='mx-auto w-full max-w-3xl py-8 sm:py-12'
  >
    <OrderConfirmationHeading />
    <OrderConfirmationCard {...props} />
    <OrderConfirmationActions {...props} />
  </section>
)
