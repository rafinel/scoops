import type { SalesCatalogListItem } from '@scoops/core/pdv/domain/structures'

import { CATEGORY_ICONS } from '@/constants/product-category-icons'
import { CATEGORY_SOFT_CLASSES } from '@/constants/product-category-colors'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { cn } from '@/ui/shared/lib/utils'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { NewSaleCatalogCardStatus } from '../new-sale-catalog-card-status'
import type { NewSaleCatalogCard as NewSaleCatalogCardData } from '../use-new-sale-catalog'

export type NewSaleCatalogCardProps = {
  card: NewSaleCatalogCardData
  onSelectProduct: (product: SalesCatalogListItem) => void
}

export const NewSaleCatalogCard = ({
  card,
  onSelectProduct,
}: NewSaleCatalogCardProps) => {
  const { product, isAdded, unavailableReason } = card

  return (
    <Card
      className={cn(
        'min-w-0 rounded-2xl transition-colors',
        isAdded && 'border-primary ring-1 ring-primary',
        unavailableReason && 'bg-muted opacity-70',
      )}
    >
      <CardContent className='flex min-h-44 flex-col p-4'>
        <div className='flex items-start justify-between gap-3'>
          <span
            className={cn(
              'grid size-10 place-items-center rounded-xl',
              CATEGORY_SOFT_CLASSES[product.kind],
            )}
          >
            <Icon className='size-5' name={CATEGORY_ICONS[product.kind]} />
          </span>
          <Badge className={CATEGORY_SOFT_CLASSES[product.kind]}>{card.kindLabel}</Badge>
        </div>
        <h3 className='mt-4 line-clamp-2 font-extrabold'>{product.name}</h3>
        <p className='mt-1 min-h-5 text-sm text-muted-foreground'>{card.description}</p>
        <NewSaleCatalogCardStatus card={card} />
        <Button
          aria-describedby={unavailableReason && card.availabilityPillId}
          aria-disabled={unavailableReason ? 'true' : undefined}
          aria-label={card.actionAriaLabel}
          className='mt-3 w-full aria-disabled:cursor-not-allowed'
          onClick={() => onSelectProduct(product)}
          type='button'
          variant='default'
        >
          {card.actionLabel}
        </Button>
      </CardContent>
    </Card>
  )
}
