import { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { BusinessRuleStrategy } from '#shared/domain/strategies/business-rule-strategy.ts'

type PaginationSliceInput<Item> = {
  readonly items: readonly Item[]
  readonly page: number
  readonly pageSize: number
}

/** Slices an in-memory list into one page and reports the totals of the whole list. */
export class PaginationSliceStrategy<Item>
  implements BusinessRuleStrategy<PaginationSliceInput<Item>, PaginationResponse<Item>>
{
  execute({ items, page, pageSize }: PaginationSliceInput<Item>) {
    const start = (page - 1) * pageSize
    const totalPages = Math.ceil(items.length / pageSize)
    const pageItems = items.slice(start, start + pageSize)

    return new PaginationResponse(pageItems, page, pageSize, items.length, totalPages)
  }
}
