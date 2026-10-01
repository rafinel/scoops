import type { OrderConfirmationMetadataItem } from '../use-order-confirmation'

export type OrderConfirmationMetadataProps = {
  metadata: readonly OrderConfirmationMetadataItem[]
}

export const OrderConfirmationMetadata = ({
  metadata,
}: OrderConfirmationMetadataProps) => (
  <dl className='grid gap-4 border-b border-border-soft bg-muted/45 p-5 sm:grid-cols-3 sm:p-6'>
    {metadata.map(([label, value]) => (
      <div key={label}>
        <dt className='text-xs text-muted-foreground'>{label}</dt>
        <dd className='mt-1 text-sm font-bold'>{value}</dd>
      </div>
    ))}
  </dl>
)
