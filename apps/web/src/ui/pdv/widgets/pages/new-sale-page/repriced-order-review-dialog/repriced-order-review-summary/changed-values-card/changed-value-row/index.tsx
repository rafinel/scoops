import type { OrderRegistrationChange } from '@scoops/core/pdv/domain/structures'

export type ChangedValueRowProps = {
  change: OrderRegistrationChange
  formatCurrency: (amount: number) => string
  index: number
}

export const ChangedValueRow = ({
  change,
  formatCurrency,
  index,
}: ChangedValueRowProps) => (
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
