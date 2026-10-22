import type { Product } from '@scoops/core/mrp/domain/entities'
import { Badge } from '@/ui/shadcn/badge'
import { TooltipProvider } from '@/ui/shadcn/tooltip'

import { ProductCategoryChip } from './product-category-chip'
import { useProductDetailsHeader } from './use-product-details-header'

export type ProductDetailsHeaderProps = {
  product: Product
}

export const ProductDetailsHeader = ({ product }: ProductDetailsHeaderProps) => {
  const { isCategoryGlobal } = useProductDetailsHeader({ product })
  const stockControlLabel = product.stockControl === 'by-brand' ? 'Por marca' : 'Único'

  return (
    <header className='rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6'>
      <h1 className='text-2xl font-extrabold tracking-tight'>{product.name}</h1>
      <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground'>
        <span>Unidade: {product.unit}</span>
        <span aria-hidden='true'>•</span>
        <span>Status:</span>
        <Badge
          className={
            product.status === 'active'
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-border bg-muted text-muted-foreground'
          }
          variant='outline'
        >
          {product.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>
      <div className='mt-4 flex flex-wrap items-center gap-2'>
        <TooltipProvider delay={300}>
          {product.categories.map((category) => (
            <ProductCategoryChip
              category={category}
              isGlobal={isCategoryGlobal(category)}
              key={category}
            />
          ))}
        </TooltipProvider>
        <Badge
          className='h-7 gap-1.5 border-border bg-muted/50 text-muted-foreground'
          variant='outline'
        >
          Controle de estoque: {stockControlLabel}
        </Badge>
      </div>
    </header>
  )
}
