import type { OrderRegistrationChange } from '@scoops/core/pdv/domain/structures'

import { Icon } from '@/ui/shared/widgets/components/icon'

export type OrderTotalCardProps = {
  formatCurrency: (amount: number) => string
  newTotal: number
  totalChange: OrderRegistrationChange | undefined
}

export const OrderTotalCard = ({
  formatCurrency,
  newTotal,
  totalChange,
}: OrderTotalCardProps) => (
  <section
    aria-atomic='true'
    aria-label='Total atualizado do pedido'
    aria-live='polite'
    className='rounded-xl border !border-warning bg-warning-soft p-3 text-sm text-warning'
    role='status'
  >
    <div className='flex items-start gap-3'>
      <span className='grid size-9 shrink-0 place-items-center rounded-lg border !border-warning bg-card'>
        <Icon className='size-4' name='package' />
      </span>
      <div className='min-w-0'>
        <p className='text-xs font-extrabold uppercase'>Total do pedido</p>
        <p className='mt-1 font-extrabold'>
          {totalChange
            ? `${formatCurrency(totalChange.previous.amount)} → ${formatCurrency(totalChange.current.amount)}`
            : formatCurrency(newTotal)}
        </p>
        <p className='mt-1 text-xs'>O pedido ainda não foi registrado.</p>
      </div>
    </div>
  </section>
)
