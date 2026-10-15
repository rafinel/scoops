import type { OrderRegistrationChange } from '@scoops/core/pdv/domain/structures'

import { Icon } from '@/ui/shared/widgets/components/icon'

type FormatCurrency = (amount: number) => string

export const RepricedOrderReviewSummary = ({
  formatCurrency,
  newTotal,
  totalChange,
  valueChanges,
}: {
  formatCurrency: FormatCurrency
  newTotal: number
  totalChange: OrderRegistrationChange | undefined
  valueChanges: readonly OrderRegistrationChange[]
}) => (
  <div aria-atomic='true' aria-live='polite' className='space-y-3 p-6' role='status'>
    <ChangedValuesCard formatCurrency={formatCurrency} valueChanges={valueChanges} />
    <OrderTotalCard
      formatCurrency={formatCurrency}
      newTotal={newTotal}
      totalChange={totalChange}
    />
    <p className='text-sm text-muted-foreground'>
      Revise os novos valores e confirme o pedido novamente.
    </p>
  </div>
)

const ChangedValuesCard = ({
  formatCurrency,
  valueChanges,
}: {
  formatCurrency: FormatCurrency
  valueChanges: readonly OrderRegistrationChange[]
}) => (
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

const ChangedValueRow = ({
  change,
  formatCurrency,
  index,
}: {
  change: OrderRegistrationChange
  formatCurrency: FormatCurrency
  index: number
}) => (
  <li
    className={
      index === 0 ? 'font-extrabold' : 'text-xs font-normal text-muted-foreground'
    }
  >
    {change.previous.label !== change.current.label
      ? `${change.previous.label} → ${change.current.label}`
      : change.current.label}
    : {formatCurrency(change.previous.amount)} → {formatCurrency(change.current.amount)}
  </li>
)

const OrderTotalCard = ({
  formatCurrency,
  newTotal,
  totalChange,
}: {
  formatCurrency: FormatCurrency
  newTotal: number
  totalChange: OrderRegistrationChange | undefined
}) => (
  <section className='rounded-xl border !border-warning bg-warning-soft p-3 text-sm text-warning'>
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
