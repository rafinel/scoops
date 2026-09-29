import { ApiProperty } from '@nestjs/swagger'
import type { GlobalSearchResults } from '@scoops/core/identity/domain/structures'

import { GlobalSearchHitResponseDto } from '@/identity/rest/dtos/global-search-hit-response.dto'

const RESULT_GROUPS = [
  'pages',
  'products',
  'orders',
  'users',
  'salesChannels',
  'discounts',
] as const

export class GlobalSearchResponseDto {
  @ApiProperty({ type: [GlobalSearchHitResponseDto] })
  pages!: GlobalSearchHitResponseDto[]

  @ApiProperty({ type: [GlobalSearchHitResponseDto] })
  products!: GlobalSearchHitResponseDto[]

  @ApiProperty({ type: [GlobalSearchHitResponseDto] })
  orders!: GlobalSearchHitResponseDto[]

  @ApiProperty({ type: [GlobalSearchHitResponseDto] })
  users!: GlobalSearchHitResponseDto[]

  @ApiProperty({ type: [GlobalSearchHitResponseDto] })
  salesChannels!: GlobalSearchHitResponseDto[]

  @ApiProperty({ type: [GlobalSearchHitResponseDto] })
  discounts!: GlobalSearchHitResponseDto[]

  static from(results: GlobalSearchResults): GlobalSearchResponseDto {
    const dto = new GlobalSearchResponseDto()
    for (const group of RESULT_GROUPS) {
      dto[group] = results[group].map(GlobalSearchHitResponseDto.from)
    }
    return dto
  }
}
