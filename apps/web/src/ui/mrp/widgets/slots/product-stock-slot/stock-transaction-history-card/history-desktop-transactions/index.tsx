import type { StockTransaction } from '@scoops/core/mrp/domain/entities'

import { Avatar } from '@/ui/shared/widgets/components/avatar'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'

import { JustificationButton } from '../justification-button'
import { SignedQuantity } from '../signed-quantity'
import { STOCK_TRANSACTION_TYPE_LABELS, TransactionType } from '../transaction-type'

export type HistoryDesktopTransactionsProps = {
  formatDate: (date: Date, options: Intl.DateTimeFormatOptions) => string
  onJustification: (justification: string) => void
  transactions: readonly StockTransaction[]
}

export const HistoryDesktopTransactions = ({
  formatDate,
  onJustification,
  transactions,
}: HistoryDesktopTransactionsProps) => (
  <div className='hidden border-y border-border-soft lg:block'>
    <Table className='min-w-[850px] text-left text-sm'>
      <TableCaption className='sr-only'>
        Movimentações de estoque mais recentes primeiro
      </TableCaption>
      <TableHeader className='bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground'>
        <TableRow className='hover:bg-transparent'>
          <TableHead className='px-4 py-3 font-semibold sm:px-6'>Data/hora</TableHead>
          <TableHead className='px-4 py-3 font-semibold'>Tipo</TableHead>
          <TableHead className='px-4 py-3 font-semibold'>Marca</TableHead>
          <TableHead className='px-4 py-3 font-semibold'>Quantidade</TableHead>
          <TableHead className='px-4 py-3 font-semibold'>Responsável</TableHead>
          <TableHead className='px-4 py-3 font-semibold'>Justificativa</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow
            className='border-b-0 border-t border-border-soft hover:bg-transparent'
            key={transaction.id}
          >
            <TableCell className='px-4 py-4 sm:px-6'>
              {formatDate(transaction.occurredAt, {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </TableCell>
            <TableCell className='px-4 py-4'>
              <TransactionType
                label={STOCK_TRANSACTION_TYPE_LABELS[transaction.type]}
                type={transaction.type}
              />
            </TableCell>
            <TableCell className='px-4 py-4'>
              {transaction.brandName ?? 'Produto'}
            </TableCell>
            <TableCell className='px-4 py-4'>
              <SignedQuantity
                quantity={transaction.quantity}
                type={transaction.type}
                unit={transaction.unit}
              />
            </TableCell>
            <TableCell className='px-4 py-4'>
              <div className='flex items-center gap-2'>
                <Avatar
                  className='size-7 text-[10px]'
                  name={transaction.performedByName.normalize('NFC')}
                />
                <span>{transaction.performedByName}</span>
              </div>
            </TableCell>
            <TableCell className='max-w-64 px-4 py-4'>
              {transaction.justification ? (
                <JustificationButton
                  onClick={() => onJustification(transaction.justification ?? '')}
                />
              ) : (
                '—'
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)
