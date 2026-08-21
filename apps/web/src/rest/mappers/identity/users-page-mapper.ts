import { AppError } from '@scoops/core/shared/domain/errors'
import type { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'
import { UsersPage } from '@scoops/core/identity/domain/structures'
import type { UsersSummary } from '@scoops/core/identity/domain/structures'

import {
  UserSummaryMapper,
  type UserSummary,
  type UserSummaryJson,
} from './user-summary-mapper'

export type PaginationJson<Item> = Omit<PaginationResponse<Item>, 'items'> & {
  items: readonly Item[]
}

export type UsersPageJson = PaginationJson<UserSummaryJson> & {
  summary: UsersSummary
}

export const UsersPageMapper = (response: UsersPageJson): UsersPage<UserSummary> => {
  if (!response || !Array.isArray(response.items) || !response.summary) {
    throw new AppError('Unexpected users response')
  }

  return new UsersPage(
    response.items.map((user) => UserSummaryMapper(user)),
    response.page,
    response.pageSize,
    response.total,
    response.totalPages,
    response.summary,
  )
}
