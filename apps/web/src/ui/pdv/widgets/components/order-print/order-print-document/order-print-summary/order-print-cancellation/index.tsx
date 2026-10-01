export type OrderPrintCancellationProps = {
  cancellation: { date: string; actor: string; reason?: string }
}

export const OrderPrintCancellation = ({ cancellation }: OrderPrintCancellationProps) => (
  <section aria-label='Pedido cancelado' className='order-print-cancellation'>
    <h2>Pedido cancelado</h2>
    <p>{cancellation.date}</p>
    <p>Responsável: {cancellation.actor}</p>
    {cancellation.reason ? <p>Motivo: {cancellation.reason}</p> : null}
  </section>
)
