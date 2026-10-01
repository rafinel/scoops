export type OrderPrintHeaderProps = {
  sequence: string
  metadata: readonly (readonly [label: string, value: string])[]
}

export const OrderPrintHeader = ({ sequence, metadata }: OrderPrintHeaderProps) => (
  <>
    <header className='order-print-heading'>
      <h1>Pedido #{sequence}</h1>
      <p>Cópia não fiscal</p>
    </header>
    <dl className='order-print-metadata'>
      {metadata.map(([label, value]) => (
        <div className='order-print-pair' key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  </>
)
