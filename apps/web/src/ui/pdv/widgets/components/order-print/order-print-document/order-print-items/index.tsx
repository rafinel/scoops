import type { OrderPrintLineView } from '../use-order-print-document'
import { OrderPrintLine } from '../order-print-line'

export type OrderPrintItemsProps = { lines: readonly OrderPrintLineView[] }

export const OrderPrintItems = ({ lines }: OrderPrintItemsProps) => (
  <section className='order-print-items' aria-label='Itens do pedido'>
    <h2>Itens do pedido</h2>
    <table>
      <thead>
        <tr>
          <th>Produto / configuração</th>
          <th>Qtd.</th>
          <th>Unitário</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, index) => (
          <OrderPrintLine key={`${line.name}-${index}`} line={line} />
        ))}
      </tbody>
    </table>
  </section>
)
