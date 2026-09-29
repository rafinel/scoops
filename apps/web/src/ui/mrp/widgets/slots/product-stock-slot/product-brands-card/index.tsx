import type { ProductBrandStock, ProductUnit } from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { ProductBrandRowWidget, ProductBrandsTable } from './product-brand-row'
import { useProductBrandsCard } from './use-product-brands-card'

export type ProductBrandsCardProps = {
  brands: readonly ProductBrandStock[]
  canManage?: boolean
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
  canManage = true,
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
  const rowProps = {
    canManage,
    actionsDisabled,
    onDelete,
    onEdit,
    onEntry,
    onSetPrimary,
    onWriteOff,
  }

  return (
    <section className='min-w-0 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <h2 className='text-lg font-extrabold'>
          Marcas{' '}
          <span className='text-sm font-medium text-muted-foreground'>
            ({rows.length})
          </span>
        </h2>
        {canManage ? (
          <Button className='h-9 px-4 font-bold shadow-primary' onClick={onAddBrand}>
            <Icon className='size-4' name='plus' /> Adicionar marca
          </Button>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <EmptyState canManage={canManage} onAddBrand={onAddBrand} />
      ) : (
        <div className='mt-5 grid gap-3 lg:hidden'>
          {rows.map((row) => (
            <ProductBrandRowWidget
              key={row.brand.id}
              {...rowProps}
              display='mobile'
              row={row}
            />
          ))}
        </div>
      )}
      {rows.length > 0 ? <ProductBrandsTable rowProps={rowProps} rows={rows} /> : null}
    </section>
  )
}

const EmptyState = ({
  canManage,
  onAddBrand,
}: {
  canManage: boolean
  onAddBrand: () => void
}) => (
  <div className='mt-5 rounded-xl border border-dashed p-8 text-center'>
    <div className='mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary'>
      <Icon className='size-5' name='tags' />
    </div>
    <h3 className='mt-4 font-extrabold'>Nenhuma marca cadastrada</h3>
    <p className='mt-1 text-sm text-muted-foreground'>
      Adicione a primeira marca para começar a controlar este estoque.
    </p>
    {canManage ? (
      <Button className='mt-4 font-bold' onClick={onAddBrand}>
        <Icon className='size-4' name='plus' /> Adicionar primeira marca
      </Button>
    ) : null}
  </div>
)
