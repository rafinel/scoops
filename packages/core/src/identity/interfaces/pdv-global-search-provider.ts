import type { GlobalSearchHit } from '#identity/domain/structures/global-search-hit.ts'
import type { GlobalSearchProviderInput } from '#identity/domain/structures/global-search-provider-input.ts'

export interface PdvGlobalSearchProvider {
  searchOrders(input: GlobalSearchProviderInput): Promise<GlobalSearchHit[]>
  searchSalesChannels(input: GlobalSearchProviderInput): Promise<GlobalSearchHit[]>
  searchDiscounts(input: GlobalSearchProviderInput): Promise<GlobalSearchHit[]>
}
