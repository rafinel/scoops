import { TableHead, TableHeader, TableRow } from '@/ui/shadcn/table'
import { cn } from '@/ui/shared/lib/utils'

export type PortionsTableHeadProps = {
  canManage: boolean
}

const COLUMNS = [
  { label: 'PORÇÃO', width: '' },
  { label: 'TIPO', width: 'w-[150px]' },
  { label: 'QTD POR PORÇÃO', width: 'w-[170px]' },
  { label: 'PREÇO', width: 'w-[160px]' },
]
const ACTIONS_COLUMN = { label: 'AÇÕES', width: 'w-[196px]' }

export const PortionsTableHead = ({ canManage }: PortionsTableHeadProps) => (
  <TableHeader className='bg-muted [&_tr]:border-0'>
    <TableRow className='hover:bg-transparent'>
      {(canManage ? [...COLUMNS, ACTIONS_COLUMN] : COLUMNS).map(({ label, width }) => (
        <TableHead
          className={cn(
            'h-[39px] px-5 text-[11px] font-semibold tracking-[0.5px] text-muted-foreground',
            width,
          )}
          key={label}
        >
          {label}
        </TableHead>
      ))}
    </TableRow>
  </TableHeader>
)
