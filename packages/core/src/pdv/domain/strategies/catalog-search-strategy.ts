import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

const MAX_SEARCH_LENGTH = 120

type CatalogSearch = {
  readonly search: string | undefined
  readonly isValid: boolean
}

/** Trims a name search, treats an empty one as absent and checks its length limit. */
export class CatalogSearchStrategy
  implements BusinessRuleStrategy<string | undefined, CatalogSearch>
{
  execute(input: string | undefined): CatalogSearch {
    const search = input?.trim() || undefined
    const isValid = search === undefined || search.length <= MAX_SEARCH_LENGTH

    return { search, isValid }
  }
}
