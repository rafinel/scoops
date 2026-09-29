import type { ProductBrandStock } from '@scoops/core/mrp/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ProductBrandRow } from '../use-product-brands-card'
import { ProductBrandActionsMenu } from '../product-brand-actions-menu'

export type ProductBrandRowProps = {
  row: ProductBrandRow
  display: 'mobile' | 'desktop'
  canManage: boolean
  actionsDisabled?: boolean
  onEntry: (brand: ProductBrandStock) => void
  onDelete: (brand: ProductBrandStock) => void
  onEdit: (brand: ProductBrandStock) => void
  onSetPrimary: (brand: ProductBrandStock) => void
  onWriteOff: (brand: ProductBrandStock) => void
}

export const ProductBrandRowWidget = (props: ProductBrandRowProps) => {
  const { row, canManage } = props
  if (props.display === 'mobile') {
    return (
      <article className='rounded-xl border border-border-soft p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <h3 className='font-extrabold'>{row.brand.name}</h3>
          {row.brand.isPrimary ? <PrimaryBadge /> : null}
          <span className='ml-auto'>{canManage ? <ActionsMenu {...props} /> : null}</span>
        </div>
        <dl className='mt-4 grid grid-cols-2 gap-3 text-sm'>
          <Detail label='Qtd. embalagem' value={row.formattedPackageQuantity} />
          <Detail label='Valor/embalagem' value={row.formattedPackagePrice} />
          <Detail label='Preço unitário' value={row.formattedUnitPrice} />
          <Detail label='Estoque atual' value={row.formattedStockQuantity} />
        </dl>
        {canManage ? (
          <div className='mt-4 grid grid-cols-2 gap-2'>
            <StockButton kind='entry' onClick={() => props.onEntry(row)} />
            <StockButton kind='write-off' onClick={() => props.onWriteOff(row)} />
          </div>
        ) : null}
      </article>
    )
  }
  return (
    <TableRow className='border-b-0 border-t border-border-soft hover:bg-transparent'>
      <TableCell className='px-4 py-4 font-bold'>
        {row.brand.name} {row.brand.isPrimary ? <PrimaryBadge /> : null}
      </TableCell>
      <TableCell className='px-4 py-4'>{row.formattedPackageQuantity}</TableCell>
      <TableCell className='px-4 py-4'>{row.formattedPackagePrice}</TableCell>
      <TableCell className='px-4 py-4'>{row.formattedUnitPrice}</TableCell>
      <TableCell className='px-4 py-4 font-semibold'>
        {row.formattedStockQuantity}
      </TableCell>
      {canManage ? (
        <TableCell className='px-4 py-4'>
          <div className='flex items-center gap-2'>
            <StockButton kind='entry' onClick={() => props.onEntry(row)} />
            <StockButton kind='write-off' onClick={() => props.onWriteOff(row)} />
            <ActionsMenu {...props} />
          </div>
        </TableCell>
      ) : null}
    </TableRow>
  )
}

export const ProductBrandsTable = ({
  rows,
  rowProps,
}: {
  rows: ProductBrandRow[]
  rowProps: Omit<ProductBrandRowProps, 'display' | 'row'>
}) => (
  <div className='mt-5 hidden rounded-xl border border-border-soft lg:block'>
    <Table className='min-w-[900px] text-left text-sm'>
      <TableCaption className='sr-only'>Estoque por marca</TableCaption>
      <TableHeader className='bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground'>
        <TableRow className='hover:bg-transparent'>
          {[
            'Marca',
            'Qtd. embalagem',
            'Valor/embalagem',
            'Preço unitário',
            'Estoque atual',
          ].map((column) => (
            <TableHead className='px-4 py-3 font-semibold' key={column}>
              {column}
            </TableHead>
          ))}
          {rowProps.canManage ? (
            <TableHead className='px-4 py-3 font-semibold'>Ações</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <ProductBrandRowWidget
            key={row.brand.id}
            {...rowProps}
            display='desktop'
            row={row}
          />
        ))}
      </TableBody>
    </Table>
  </div>
)

const PrimaryBadge = () => <Badge className='bg-green-50 text-green-700'>Principal</Badge>

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className='text-xs text-muted-foreground'>{label}</dt>
    <dd className='mt-1 font-semibold'>{value}</dd>
  </div>
)

const ActionsMenu = (props: ProductBrandRowProps) => (
  <ProductBrandActionsMenu
    brand={props.row}
    disabled={props.actionsDisabled}
    onDelete={props.onDelete}
    onEdit={props.onEdit}
    onSetPrimary={props.onSetPrimary}
  />
)

const StockButton = ({
  kind,
  onClick,
}: {
  kind: 'entry' | 'write-off'
  onClick: () => void
}) => {
  const isEntry = kind === 'entry'
  return (
    <Button
      aria-label={`${isEntry ? 'Entrada' : 'Baixa'} de estoque`}
      className={
        isEntry ? 'border-green-400 text-green-700' : 'border-amber-400 text-amber-700'
      }
      onClick={onClick}
      size='sm'
      variant='outline'
    >
      <Icon className='size-3.5' name={isEntry ? 'arrow-down' : 'arrow-up'} />
      {isEntry ? 'Entrada' : 'Baixa'}
    </Button>
  )
}
