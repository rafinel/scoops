import type { ProductBrandStock, ProductUnit } from '@scoops/core/mrp/domain/structures'

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

import { useProductBrandsCard } from './use-product-brands-card'
import { ProductBrandActionsMenu } from './product-brand-actions-menu'

export type ProductBrandsCardProps = {
  brands: readonly ProductBrandStock[]
  unit: ProductUnit
  onAddBrand: () => void
  onEntry: (brand: ProductBrandStock) => void
  onDelete: (brand: ProductBrandStock) => void
  onEdit: (brand: ProductBrandStock) => void
  onSetPrimary: (brand: ProductBrandStock) => void
  onWriteOff: (brand: ProductBrandStock) => void
  actionsDisabled?: boolean
}

export const ProductBrandsCard = ({
  brands,
  unit,
  onAddBrand,
  onEntry,
  onDelete,
  onEdit,
  onSetPrimary,
  onWriteOff,
  actionsDisabled,
}: ProductBrandsCardProps) => {
  const { rows } = useProductBrandsCard(brands, unit)

  return (
    <section className='min-w-0 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <h2 className='text-lg font-extrabold'>
          Marcas{' '}
          <span className='text-sm font-medium text-muted-foreground'>
            ({rows.length})
          </span>
        </h2>
        <Button className='h-9 px-4 font-bold shadow-primary' onClick={onAddBrand}>
          <Icon className='size-4' name='plus' /> Adicionar marca
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className='mt-5 rounded-xl border border-dashed p-8 text-center'>
          <div className='mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary'>
            <Icon className='size-5' name='tags' />
          </div>
          <h3 className='mt-4 font-extrabold'>Nenhuma marca cadastrada</h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            Adicione a primeira marca para começar a controlar este estoque.
          </p>
          <Button className='mt-4 font-bold' onClick={onAddBrand}>
            <Icon className='size-4' name='plus' /> Adicionar primeira marca
          </Button>
        </div>
      ) : (
        <div className='mt-5 grid gap-3 lg:hidden'>
          {rows.map((row) => (
            <article
              className='rounded-xl border border-border-soft p-4'
              key={row.brand.id}
            >
              <div className='flex flex-wrap items-center gap-2'>
                <h3 className='font-extrabold'>{row.brand.name}</h3>
                {row.brand.isPrimary ? (
                  <Badge className='bg-green-50 text-green-700'>Principal</Badge>
                ) : null}
                <span className='ml-auto'>
                  <ProductBrandActionsMenu
                    brand={row}
                    disabled={actionsDisabled}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onSetPrimary={onSetPrimary}
                  />
                </span>
              </div>
              <dl className='mt-4 grid grid-cols-2 gap-3 text-sm'>
                <Detail label='Qtd. embalagem' value={row.formattedPackageQuantity} />
                <Detail label='Valor/embalagem' value={row.formattedPackagePrice} />
                <Detail label='Preço unitário' value={row.formattedUnitPrice} />
                <Detail label='Estoque atual' value={row.formattedStockQuantity} />
              </dl>
              <div className='mt-4 grid grid-cols-2 gap-2'>
                <StockButton kind='entry' onClick={() => onEntry(row)} />
                <StockButton kind='write-off' onClick={() => onWriteOff(row)} />
              </div>
            </article>
          ))}
        </div>
      )}

      {rows.length > 0 ? (
        <div className='mt-5 hidden rounded-xl border border-border-soft lg:block'>
          <Table className='min-w-[900px] text-left text-sm'>
            <TableCaption className='sr-only'>Estoque por marca</TableCaption>
            <TableHeader className='bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='px-4 py-3 font-semibold'>Marca</TableHead>
                <TableHead className='px-4 py-3 font-semibold'>Qtd. embalagem</TableHead>
                <TableHead className='px-4 py-3 font-semibold'>Valor/embalagem</TableHead>
                <TableHead className='px-4 py-3 font-semibold'>Preço unitário</TableHead>
                <TableHead className='px-4 py-3 font-semibold'>Estoque atual</TableHead>
                <TableHead className='px-4 py-3 font-semibold'>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  className='border-b-0 border-t border-border-soft hover:bg-transparent'
                  key={row.brand.id}
                >
                  <TableCell className='px-4 py-4 font-bold'>
                    {row.brand.name}{' '}
                    {row.brand.isPrimary ? (
                      <Badge className='ml-1 bg-green-50 text-green-700'>Principal</Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className='px-4 py-4'>
                    {row.formattedPackageQuantity}
                  </TableCell>
                  <TableCell className='px-4 py-4'>{row.formattedPackagePrice}</TableCell>
                  <TableCell className='px-4 py-4'>{row.formattedUnitPrice}</TableCell>
                  <TableCell className='px-4 py-4 font-semibold'>
                    {row.formattedStockQuantity}
                  </TableCell>
                  <TableCell className='px-4 py-4'>
                    <div className='flex items-center gap-2'>
                      <StockButton kind='entry' onClick={() => onEntry(row)} />
                      <StockButton kind='write-off' onClick={() => onWriteOff(row)} />
                      <ProductBrandActionsMenu
                        brand={row}
                        disabled={actionsDisabled}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onSetPrimary={onSetPrimary}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className='text-xs text-muted-foreground'>{label}</dt>
      <dd className='mt-1 font-semibold'>{value}</dd>
    </div>
  )
}

function StockButton({
  kind,
  onClick,
}: {
  kind: 'entry' | 'write-off'
  onClick: () => void
}) {
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
