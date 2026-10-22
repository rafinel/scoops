import type { AccompanimentPortionDetails } from '@scoops/core/mrp/domain/structures'

import { TableCell, TableRow } from '@/ui/shadcn/table'

import { PortionPrice } from './portion-price'
import { PortionRowActions } from './portion-row-actions'

export type PortionRowProps = {
  canManage: boolean
  formatCurrency: (value: number) => string
  formatQuantity: (value: number, unit: string) => string
  inactiveNoticeId: string
  isActive: boolean
  item: AccompanimentPortionDetails
  onEdit: (item: AccompanimentPortionDetails) => void
  onRemove: (item: AccompanimentPortionDetails) => void
}

export const PortionRow = (props: PortionRowProps) => {
  const { item } = props

  return (
    <TableRow className='h-14 !border-[color:var(--border-soft)]'>
      <TableCell className='px-5 py-3 text-sm font-bold'>
        {item.portionProductName}
      </TableCell>
      <TableCell className='px-5 py-3 text-xs font-semibold'>
        {item.accompanimentTypeName}
      </TableCell>
      <TableCell className='px-5 py-3 text-sm font-bold'>
        {props.formatQuantity(item.quantityPerPortion, item.unit)}
      </TableCell>
      <TableCell className='px-5 py-3 text-sm font-bold'>
        <PortionPrice formatCurrency={props.formatCurrency} salePrice={item.salePrice} />
      </TableCell>
      {props.canManage ? <PortionRowActions {...props} /> : null}
    </TableRow>
  )
}
