import { AppError } from '@scoops/core/shared/domain/errors'
import { PaginationResponse } from '@scoops/core/shared/responses/pagination-response'

import {
  UserSummaryMapper,
  type UserSummary,
  type UserSummaryJson,
} from './user-summary-mapper'

export type PaginationJson<Item> = Omit<PaginationResponse<Item>, 'items'> & {
  items: readonly Item[]
}

export const UsersPageMapper = (
  response: PaginationJson<UserSummaryJson>,
): PaginationResponse<UserSummary> => {
  if (!response || !Array.isArray(response.items)) {
    throw new AppError('Unexpected users response')
  }

  return new PaginationResponse(
    response.items.map((user) => UserSummaryMapper(user)),
    response.page,
    response.pageSize,
    response.total,
    response.totalPages,
  )
}
