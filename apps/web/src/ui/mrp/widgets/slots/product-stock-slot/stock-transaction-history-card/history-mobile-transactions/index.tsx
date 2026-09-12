import type { StockTransaction } from '@scoops/core/mrp/domain/entities'

import { Avatar } from '@/ui/shared/widgets/components/avatar'

import { HistoryDetail } from '../history-detail'
import { JustificationButton } from '../justification-button'
import { SignedQuantity } from '../signed-quantity'
import { STOCK_TRANSACTION_TYPE_LABELS, TransactionType } from '../transaction-type'

export type HistoryMobileTransactionsProps = {
  formatDate: (date: Date, options: Intl.DateTimeFormatOptions) => string
  onJustification: (justification: string) => void
  transactions: readonly StockTransaction[]
}

export const HistoryMobileTransactions = ({
  formatDate,
  onJustification,
  transactions,
}: HistoryMobileTransactionsProps) => (
  <div className='grid gap-3 px-4 pb-4 lg:hidden'>
    {transactions.map((transaction) => (
      <article className='rounded-xl border border-border-soft p-4' key={transaction.id}>
        <div className='flex items-center justify-between gap-3'>
          <TransactionType
            label={STOCK_TRANSACTION_TYPE_LABELS[transaction.type]}
            type={transaction.type}
          />
          <SignedQuantity
            quantity={transaction.quantity}
            type={transaction.type}
            unit={transaction.unit}
          />
        </div>
        <dl className='mt-3 grid gap-2 text-sm'>
          <HistoryDetail
            label='Data/hora'
            value={formatDate(transaction.occurredAt, {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          />
          <HistoryDetail label='Marca' value={transaction.brandName ?? 'Produto'} />
          {transaction.justification ? (
            <HistoryDetail
              label='Justificativa'
              value={
                <JustificationButton
                  onClick={() => onJustification(transaction.justification ?? '')}
                />
              }
            />
          ) : null}
        </dl>
        <div className='mt-3 flex items-center gap-2 border-t border-border-soft pt-3'>
          <Avatar
            className='size-7 text-[10px]'
            name={transaction.performedByName.normalize('NFC')}
          />
          <span className='font-medium'>{transaction.performedByName}</span>
        </div>
      </article>
    ))}
  </div>
)
