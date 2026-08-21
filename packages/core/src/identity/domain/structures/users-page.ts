import { PaginationResponse } from '#shared/responses/pagination-response.ts'
import type { UsersSummary } from '#identity/domain/structures/users-summary.ts'

export class UsersPage<Item> extends PaginationResponse<Item> {
  constructor(
    items: readonly Item[],
    page: number,
    pageSize: number,
    total: number,
    totalPages: number,
    readonly summary: UsersSummary,
  ) {
    super(items, page, pageSize, total, totalPages)
  }
}
