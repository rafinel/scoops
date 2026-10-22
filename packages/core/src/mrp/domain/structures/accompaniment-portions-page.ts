import type { AccompanimentPortionDetails } from '#mrp/domain/structures/accompaniment-portion-details.ts'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'

export type AccompanimentPortionsPage =
  PaginationResponse<AccompanimentPortionDetails> & {
    readonly hasPortionProducts: boolean
  }
