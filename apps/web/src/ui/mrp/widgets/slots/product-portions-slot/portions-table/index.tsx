import type { AccompanimentPortionDetails } from '@scoops/core/mrp/domain/structures'

import { Table, TableBody, TableCaption } from '@/ui/shadcn/table'
import { useFormatCurrency } from '@/ui/shared/hooks/use-format-currency'
import { useFormatQuantity } from '@/ui/shared/hooks/use-format-quantity'

import { PortionRow } from './portion-row'
import { PortionsTableHead } from './portions-table-head'

export type PortionsTableProps = {
  canManage: boolean
  inactiveNoticeId: string
  isActive: boolean
  items: readonly AccompanimentPortionDetails[]
  onEdit: (item: AccompanimentPortionDetails) => void
  onRemove: (item: AccompanimentPortionDetails) => void
}

export const PortionsTable = ({ items, ...rowProps }: PortionsTableProps) => {
  const formatCurrency = useFormatCurrency()
  const formatQuantity = useFormatQuantity()

  return (
    <div className='relative'>
      <section
        aria-label='Tabela de porções'
        className='overflow-x-auto rounded-xl border !border-[color:var(--border-soft)] focus-visible:ring-2 focus-visible:ring-ring/40 [&_[data-slot=table-container]]:overflow-visible'
        tabIndex={rowProps.canManage ? undefined : 0}
      >
        <Table className='min-w-[780px]'>
          <TableCaption className='sr-only'>Porções com este acompanhamento</TableCaption>
          <PortionsTableHead canManage={rowProps.canManage} />
          <TableBody>
            {items.map((item) => (
              <PortionRow
                {...rowProps}
                formatCurrency={formatCurrency}
                formatQuantity={formatQuantity}
                item={item}
                key={item.id}
              />
            ))}
          </TableBody>
        </Table>
      </section>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-xl bg-gradient-to-l from-card to-transparent sm:hidden'
      />
    </div>
  )
}
