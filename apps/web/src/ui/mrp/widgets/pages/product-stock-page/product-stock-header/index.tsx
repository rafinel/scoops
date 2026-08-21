import type { Product } from '@scoops/core/mrp/domain/entities'
import type { ProductCategory } from '@scoops/core/mrp/domain/structures'

import { Badge } from '@/ui/shadcn/badge'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ingredient: 'Ingrediente',
  manufacturable: 'Fabricável',
  portion: 'Porção',
  accompaniment: 'Acompanhamento',
  resale: 'Revenda',
}

const CATEGORY_CLASSES: Record<ProductCategory, string> = {
  ingredient: 'border-blue-300 bg-blue-50 text-blue-700',
  manufacturable: 'border-violet-300 bg-violet-50 text-violet-700',
  portion: 'border-green-300 bg-green-50 text-green-700',
  accompaniment: 'border-amber-300 bg-amber-50 text-amber-700',
  resale: 'border-red-300 bg-red-50 text-red-700',
}

export type ProductStockHeaderProps = {
  product: Product
}

export const ProductStockHeader = ({ product }: ProductStockHeaderProps) => {
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
        {product.categories.map((category) => (
          <Badge
            className={`h-7 px-2.5 font-semibold ${CATEGORY_CLASSES[category]}`}
            key={category}
            variant='outline'
          >
            {CATEGORY_LABELS[category]}
          </Badge>
        ))}
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
