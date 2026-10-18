import type { SalesCatalogListItem } from '@scoops/core/pdv/domain/structures'

import { CATEGORY_COLORS } from '@/constants/product-category-colors'
import { CATEGORY_ICONS } from '@/constants/product-category-icons'
import { SalesCatalogAvailabilityPill } from '@/ui/pdv/widgets/components/sales-catalog-availability-pill'
import { cn } from '@/ui/shared/lib/utils'
import { Icon } from '@/ui/shared/widgets/components/icon'

import type { ComboProductRow } from '../use-combo-product-dialog'

export type ComboProductRowItemProps = {
  isSelected: boolean
  onSelectProduct: (product: SalesCatalogListItem) => void
  row: ComboProductRow
}

export const ComboProductRowItem = ({
  isSelected,
  onSelectProduct,
  row,
}: ComboProductRowItemProps) => {
  const { product, unavailableReason, availabilityPillId } = row

  return (
    <button
      aria-describedby={unavailableReason && availabilityPillId}
      aria-disabled={unavailableReason ? 'true' : undefined}
      aria-pressed={unavailableReason ? undefined : isSelected}
      className={cn(
        'flex min-h-14 w-full items-center gap-3 rounded-xl border border-border-soft p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring/40',
        unavailableReason
          ? 'cursor-not-allowed'
          : 'hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary-soft',
      )}
      onClick={() => onSelectProduct(product)}
      type='button'
    >
      <span
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-lg bg-muted',
          unavailableReason && 'opacity-55',
        )}
      >
        <Icon
          name={CATEGORY_ICONS[product.kind]}
          className={`size-4 ${CATEGORY_COLORS[product.kind]}`}
        />
      </span>
      <span className={cn('min-w-0 flex-1', unavailableReason && 'opacity-55')}>
        <span className='block truncate text-sm font-extrabold'>{product.name}</span>
        <span className='block text-xs text-muted-foreground'>
          {product.kind === 'portion' ? 'Porção' : 'Revenda'}
        </span>
      </span>
      {unavailableReason ? (
        <SalesCatalogAvailabilityPill
          availability={unavailableReason}
          id={availabilityPillId}
        />
      ) : (
        <Icon name='arrow' className='size-4 text-muted-foreground' />
      )}
    </button>
  )
}
