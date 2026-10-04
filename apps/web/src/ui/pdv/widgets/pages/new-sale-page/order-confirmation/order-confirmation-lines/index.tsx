import type { OrderConfirmationLineView } from '../use-order-confirmation'

export type OrderConfirmationLinesProps = { lines: readonly OrderConfirmationLineView[] }

export const OrderConfirmationLines = ({ lines }: OrderConfirmationLinesProps) => (
  <div className='mt-3 divide-y divide-border-soft'>
    {lines.map((line, index) => (
      <div
        className='flex items-center justify-between gap-4 py-3 text-sm'
        key={`${line.name}-${index}`}
      >
        <div className='min-w-0'>
          <p className='truncate font-bold'>{line.name}</p>
          <p className='truncate text-xs text-muted-foreground'>{line.details}</p>
          {line.accompaniments?.length ? (
            <p className='mt-1 text-xs leading-snug text-muted-foreground'>
              Acompanhamentos: {line.accompaniments.join(', ')}
            </p>
          ) : null}
        </div>
        <strong className='shrink-0'>{line.subtotal}</strong>
      </div>
    ))}
  </div>
)
