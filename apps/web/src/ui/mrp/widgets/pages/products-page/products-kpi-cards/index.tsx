import type { ProductCatalogPage } from '@scoops/core/mrp/domain/structures'

import { Card } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useProductsKpiCards } from './use-products-kpi-cards'

export function ProductsKpiCards({
  page,
  isLoading,
}: {
  page?: ProductCatalogPage
  isLoading: boolean
}) {
  const cards = useProductsKpiCards(page, isLoading)

  return (
    <div className='grid gap-4 sm:grid-cols-3'>
      {cards.map(
        ({ detail, displayValue, icon, iconTone, label, railColor, valueTone }) => (
          <Card
            className='min-h-24 rounded-2xl border border-border border-l-4 p-4'
            key={label}
            style={{ borderLeftColor: railColor }}
          >
            <div className='flex items-center gap-3'>
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${iconTone}`}
              >
                <Icon name={icon} className='size-5' />
              </span>
              <div>
                <p className='text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground'>
                  {label}
                </p>
                <p className={`mt-0.5 text-2xl font-extrabold ${valueTone}`}>
                  {displayValue}
                </p>
                <p className='text-xs text-muted-foreground'>{detail}</p>
              </div>
            </div>
          </Card>
        ),
      )}
    </div>
  )
}
