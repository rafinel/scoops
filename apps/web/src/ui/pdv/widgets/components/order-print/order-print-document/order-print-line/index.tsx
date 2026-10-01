import type { OrderPrintLineView } from '../use-order-print-document'

export type OrderPrintLineProps = {
  line: OrderPrintLineView
}

export const OrderPrintLine = ({ line }: OrderPrintLineProps) => (
  <tr className='order-print-line'>
    <td className='order-print-description'>
      <strong>{line.name}</strong>
      {line.configurations.map((configuration, index) => (
        <p key={`${configuration}-${index}`}>{configuration}</p>
      ))}
    </td>
    <td className='order-print-quantity'>{line.quantity}</td>
    <td className='order-print-unit-price'>{line.unitPrice}</td>
    <td className='order-print-line-subtotal'>{line.subtotal}</td>
  </tr>
)
