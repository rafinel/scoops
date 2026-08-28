import type { SaleItemKind } from '@scoops/core/pdv/domain/structures'

export const saleQueryKeys = {
  all: ['pdv', 'sale'] as const,
  catalog: (input: {
    search?: string
    kind?: SaleItemKind
    page: number
    pageSize: number
  }) => ['pdv', 'sale', 'catalog', input] as const,
}
