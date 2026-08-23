import type { AccompanimentTypeListItem } from '#mrp/domain/structures/accompaniment-type-list-item.ts'
import type { PaginationResponse } from '#shared/responses/pagination-response.ts'

export type AccompanimentTypePage = PaginationResponse<AccompanimentTypeListItem>
