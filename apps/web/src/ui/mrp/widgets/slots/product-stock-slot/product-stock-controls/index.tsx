import type {
  ProductBrandStock,
  ProductStockDetails,
} from '@scoops/core/mrp/domain/structures'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { ProductBrandsCard } from '../product-brands-card'

export type ProductStockControlsProps = {
  isBrandActionPending: boolean
  onAddBrand: () => void
  onDeleteBrand: (brand: ProductBrandStock) => void
  onEditBrand: (brand: ProductBrandStock) => void
  onEntry: (brand?: ProductBrandStock) => void
  onSetPrimaryBrand: (brand: ProductBrandStock) => void
  onWriteOff: (brand?: ProductBrandStock) => void
  productStock: ProductStockDetails
}

export const ProductStockControls = ({
  isBrandActionPending,
  onAddBrand,
  onDeleteBrand,
  onEditBrand,
  onEntry,
  onSetPrimaryBrand,
  onWriteOff,
  productStock,
}: ProductStockControlsProps) => {
  if (productStock.product.stockControl !== 'single') {
    return (
      <ProductBrandsCard
        actionsDisabled={isBrandActionPending}
        brands={productStock.brands}
        onAddBrand={onAddBrand}
        onDelete={onDeleteBrand}
        onEdit={onEditBrand}
        onEntry={onEntry}
        onSetPrimary={onSetPrimaryBrand}
        onWriteOff={onWriteOff}
        unit={productStock.product.unit}
      />
    )
  }

  return (
    <section className='rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-lg font-extrabold'>Movimentar estoque</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Registre entradas e baixas em {productStock.product.unit}.
          </p>
        </div>
        <div className='grid grid-cols-2 gap-2'>
          <Button
            className='border-green-400 text-green-700'
            onClick={() => onEntry()}
            variant='outline'
          >
            <Icon name='arrow-down' /> Entrada
          </Button>
          <Button
            className='border-amber-400 text-amber-700'
            onClick={() => onWriteOff()}
            variant='outline'
          >
            <Icon name='arrow-up' /> Baixa
          </Button>
        </div>
      </div>
    </section>
  )
}
