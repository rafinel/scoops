import type { GlobalSearchHit } from '#identity/domain/structures/global-search-hit.ts'
import type { GlobalSearchProviderInput } from '#identity/domain/structures/global-search-provider-input.ts'

export interface IdentityGlobalSearchProvider {
  searchUsers(input: GlobalSearchProviderInput): Promise<GlobalSearchHit[]>
}
