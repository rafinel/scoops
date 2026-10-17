import { ApiProperty } from '@nestjs/swagger'
import type { ProductAccompanimentCandidate } from '@scoops/core/mrp/domain/structures'

type CandidateGlobal = NonNullable<ProductAccompanimentCandidate['global']>

export class ProductAccompanimentCandidateGlobalResponseDto {
  @ApiProperty({ format: 'uuid' }) accompanimentTypeId!: string
  @ApiProperty() quantityPerPortion!: number

  static from(global: CandidateGlobal): ProductAccompanimentCandidateGlobalResponseDto {
    return Object.assign(new ProductAccompanimentCandidateGlobalResponseDto(), {
      accompanimentTypeId: global.accompanimentTypeId,
      quantityPerPortion: global.quantityPerPortion,
    })
  }
}
