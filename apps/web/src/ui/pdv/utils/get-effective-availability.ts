import { SalesCatalogAvailability } from '@scoops/core/pdv/domain/structures'

export type EffectiveAvailabilityInput = {
  availability?: SalesCatalogAvailability
  isAvailable: boolean
}

export function getEffectiveAvailability({
  availability,
  isAvailable,
}: EffectiveAvailabilityInput): SalesCatalogAvailability {
  if (availability) return availability

  return isAvailable
    ? SalesCatalogAvailability.Available
    : SalesCatalogAvailability.OutOfStock
}
