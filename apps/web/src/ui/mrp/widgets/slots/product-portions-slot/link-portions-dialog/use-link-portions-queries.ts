import { useAccompanimentPortionCandidatesQuery } from '@/ui/mrp/hooks/use-accompaniment-portion-candidates-query'
import { useAccompanimentTypesQuery } from '@/ui/mrp/hooks/use-accompaniment-types-query'
import { useGlobalAccompanimentQuery } from '@/ui/mrp/hooks/use-global-accompaniment-query'
import { useProductPricingQuery } from '@/ui/mrp/hooks/use-product-pricing-query'
import { useProductStockQuery } from '@/ui/mrp/hooks/use-product-stock-query'

export function useLinkPortionsQueries(productId: string, open: boolean) {
  return {
    candidatesQuery: useAccompanimentPortionCandidatesQuery(productId, open),
    globalQuery: useGlobalAccompanimentQuery(productId, open),
    pricingQuery: useProductPricingQuery(productId),
    stockQuery: useProductStockQuery(productId),
    typesQuery: useAccompanimentTypesQuery({ page: 1, pageSize: 100 }),
  }
}

export type LinkPortionsQueries = ReturnType<typeof useLinkPortionsQueries>
