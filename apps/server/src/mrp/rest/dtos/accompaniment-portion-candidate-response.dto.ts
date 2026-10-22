import { ApiProperty } from '@nestjs/swagger'
import {
  ProductStatus,
  type AccompanimentPortionCandidate,
} from '@scoops/core/mrp/domain/structures'

export class AccompanimentPortionCandidateResponseDto {
  @ApiProperty({ format: 'uuid' }) productId!: string
  @ApiProperty() name!: string
  @ApiProperty({ enum: Object.values(ProductStatus) }) status!: ProductStatus

  static from(
    candidate: AccompanimentPortionCandidate,
  ): AccompanimentPortionCandidateResponseDto {
    return Object.assign(new AccompanimentPortionCandidateResponseDto(), {
      productId: candidate.productId,
      name: candidate.name,
      status: candidate.status,
    })
  }
}
