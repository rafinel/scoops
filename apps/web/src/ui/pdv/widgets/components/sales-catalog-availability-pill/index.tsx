import { SalesCatalogAvailability } from '@scoops/core/pdv/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'

export type UnavailableSalesCatalogAvailability = Exclude<
  SalesCatalogAvailability,
  typeof SalesCatalogAvailability.Available
>

export type SalesCatalogAvailabilityPillProps = {
  availability: UnavailableSalesCatalogAvailability
  id: string
}

const AVAILABILITY_PRESENTATION: Record<
  UnavailableSalesCatalogAvailability,
  { label: string; icon: IconName }
> = {
  [SalesCatalogAvailability.OutOfStock]: { label: 'Sem estoque', icon: 'circle-off' },
  [SalesCatalogAvailability.MissingPrice]: {
    label: 'Sem preço',
    icon: 'circle-dollar-sign',
  },
}

export const SalesCatalogAvailabilityPill = ({
  availability,
  id,
}: SalesCatalogAvailabilityPillProps) => {
  const { label, icon } = AVAILABILITY_PRESENTATION[availability]

  return (
    <Badge
      className='h-auto shrink-0 gap-1 rounded-md bg-danger-soft px-1.5 py-1 text-[10px] font-extrabold text-danger'
      id={id}
    >
      <Icon className='size-3' name={icon} />
      {label}
    </Badge>
  )
}
