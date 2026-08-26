import type {
  ComboListParams,
  SalesCatalogListParams,
  SaleItemKind,
} from '@scoops/core/pdv/domain/structures'

const DISCOUNTS_ROOT = ['pdv', 'discounts'] as const

export const discountQueryKeys = {
  all: DISCOUNTS_ROOT,
  list: (input: Omit<ComboListParams, 'establishmentId'>) =>
    [...DISCOUNTS_ROOT, 'list', input] as const,
  detail: (discountId: string) => [...DISCOUNTS_ROOT, 'detail', discountId] as const,
  catalog: (
    input: Omit<SalesCatalogListParams, 'establishmentId'> & { kind?: SaleItemKind },
  ) => [...DISCOUNTS_ROOT, 'catalog', input] as const,
}
