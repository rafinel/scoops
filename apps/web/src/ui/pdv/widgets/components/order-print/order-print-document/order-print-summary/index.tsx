import {
  OrderPrintCancellation,
  type OrderPrintCancellationProps,
} from './order-print-cancellation'

export type OrderPrintSummaryProps = {
  totals: readonly { label: string; value: string; isTotal: boolean }[]
  count: string
  cancellation: OrderPrintCancellationProps['cancellation'] | null
}

export const OrderPrintSummary = ({
  totals,
  count,
  cancellation,
}: OrderPrintSummaryProps) => (
  <>
    <dl className='order-print-totals'>
      {totals.map((row, index) => (
        <div
          className={
            row.isTotal ? 'order-print-pair order-print-total' : 'order-print-pair'
          }
          key={`${row.label}-${index}`}
        >
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
    {cancellation ? <OrderPrintCancellation cancellation={cancellation} /> : null}
    <footer className='order-print-footer'>
      <p>{count}</p>
      <p>Cópia não fiscal</p>
    </footer>
  </>
)
