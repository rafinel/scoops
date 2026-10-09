import { Card } from '@/ui/shadcn/card'

import {
  OrderConfirmationMetadata,
  type OrderConfirmationMetadataProps,
} from '../order-confirmation-metadata'
import {
  OrderConfirmationLines,
  type OrderConfirmationLinesProps,
} from '../order-confirmation-lines'

export type OrderConfirmationCardProps = {
  sequence: string
  metadata: OrderConfirmationMetadataProps['metadata']
  lines: OrderConfirmationLinesProps['lines']
  total: string
  breakdown?: readonly (readonly [string, string])[]
}

export const OrderConfirmationCard = ({
  sequence,
  metadata,
  lines,
  total,
  breakdown,
}: OrderConfirmationCardProps) => (
  <Card className='mt-8 rounded-2xl shadow-card'>
    <div className='border-b border-border-soft p-5 sm:p-6'>
      <p className='text-xs font-bold uppercase tracking-wide text-muted-foreground'>
        Pedido
      </p>
      <p className='mt-1 text-2xl font-black'>#{sequence}</p>
    </div>
    <OrderConfirmationMetadata metadata={metadata} />
    <div className='p-5 sm:p-6'>
      <h2 className='font-extrabold'>Itens do pedido</h2>
      <OrderConfirmationLines lines={lines} />
      <dl className='mt-3 space-y-2 border-t border-border-soft pt-4 text-sm'>
        {breakdown?.map(([label, value], index) => (
          <div className='flex justify-between gap-4' key={`${label}-${index}`}>
            <dt className='text-muted-foreground'>{label}</dt>
            <dd className='font-semibold'>{value}</dd>
          </div>
        ))}
      </dl>
      <div className='mt-3 flex items-center justify-between gap-4 border-t border-border-soft pt-4'>
        <span className='font-extrabold'>Total do pedido</span>
        <strong className='text-2xl font-black'>{total}</strong>
      </div>
    </div>
  </Card>
)
