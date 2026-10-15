import type { OrderRegistrationChange } from '@scoops/core/pdv/domain/structures'

import { Icon } from '@/ui/shared/widgets/components/icon'

import { ChangedValueRow } from './changed-value-row'

export type ChangedValuesCardProps = {
  formatCurrency: (amount: number) => string
  valueChanges: readonly OrderRegistrationChange[]
}

export const ChangedValuesCard = ({
  formatCurrency,
  valueChanges,
}: ChangedValuesCardProps) => (
  <section className='rounded-xl border !border-warning bg-warning-soft p-3 text-sm text-warning'>
    <div className='flex items-start gap-3'>
      <span className='grid size-9 shrink-0 place-items-center rounded-lg border !border-warning bg-card'>
        <Icon className='size-4' name='tag' />
      </span>
      <div className='min-w-0'>
        <p className='text-xs font-extrabold uppercase'>Preço atualizado</p>
        {valueChanges.length > 0 ? (
          <ul className='mt-1 grid gap-1'>
            {valueChanges.map((change, index) => (
              <ChangedValueRow
                change={change}
                formatCurrency={formatCurrency}
                index={index}
                key={`${change.kind}-${change.previous.label}-${change.current.label}-${change.previous.amount}-${change.current.amount}`}
              />
            ))}
          </ul>
        ) : (
          <p className='mt-1 font-extrabold'>Os valores do pedido foram atualizados.</p>
        )}
      </div>
    </div>
  </section>
)
