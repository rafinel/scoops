import { SalesCatalogAvailability } from '@scoops/core/pdv/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { SalesCatalogAvailabilityPill } from '@/ui/pdv/widgets/components/sales-catalog-availability-pill'
import { cn } from '@/ui/shared/lib/utils'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { NewSaleCatalogCard } from '../use-new-sale-catalog'

export type NewSaleCatalogCardStatusProps = {
  card: NewSaleCatalogCard
}

export const NewSaleCatalogCardStatus = ({ card }: NewSaleCatalogCardStatusProps) => {
  const { isAdded, unavailableReason } = card

  return (
    <div className='mt-auto flex items-end justify-between gap-2 pt-4'>
      <span
        className={cn(
          'text-sm font-extrabold',
          unavailableReason && 'text-text-tertiary',
          unavailableReason === SalesCatalogAvailability.MissingPrice &&
            'text-xs font-semibold',
        )}
      >
        {card.priceLabel}
      </span>
      {unavailableReason ? (
        <SalesCatalogAvailabilityPill
          availability={unavailableReason}
          id={card.availabilityPillId}
        />
      ) : (
        <Badge
          className={cn(
            'shrink-0',
            isAdded ? 'bg-accent text-primary' : 'bg-success-soft text-success',
          )}
        >
          <Icon name={isAdded ? 'check' : 'circle-check'} />
          {isAdded ? 'Adicionado' : 'Disponível'}
        </Badge>
      )}
    </div>
  )
}
