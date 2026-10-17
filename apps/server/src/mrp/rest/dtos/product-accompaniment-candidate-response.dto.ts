import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ProductStockControl, ProductUnit } from '@scoops/core/mrp/domain/structures'
import type { ProductAccompanimentCandidate } from '@scoops/core/mrp/domain/structures'

import { ProductAccompanimentCandidateGlobalResponseDto } from './product-accompaniment-candidate-global-response.dto'

export class ProductAccompanimentCandidateResponseDto {
  @ApiProperty({ format: 'uuid' }) productId!: string
  @ApiProperty() name!: string
  @ApiProperty({ enum: Object.values(ProductUnit) }) unit!: ProductUnit
  @ApiProperty({ enum: Object.values(ProductStockControl) })
  stockControl!: ProductStockControl

  @ApiProperty({
    type: Number,
    nullable: true,
    example: null,
    description:
      'Saved product-wide Accompaniment sale price. Null means unconfigured; zero means free.',
  })
  accompanimentPrice!: number | null

  @ApiProperty({
    description: 'Whether the candidate is a global accompaniment of the establishment.',
  })
  isGlobal!: boolean

  @ApiProperty({
    description: 'Whether the candidate is individually linked to other Portions.',
  })
  hasPortionLinks!: boolean

  @ApiPropertyOptional({
    type: () => ProductAccompanimentCandidateGlobalResponseDto,
    description: 'Shared type and quantity, present only for global candidates.',
  })
  global?: ProductAccompanimentCandidateGlobalResponseDto

  static from(
    candidate: ProductAccompanimentCandidate,
  ): ProductAccompanimentCandidateResponseDto {
    return Object.assign(new ProductAccompanimentCandidateResponseDto(), {
      productId: candidate.productId,
      name: candidate.name,
      unit: candidate.unit,
      stockControl: candidate.stockControl,
      accompanimentPrice: candidate.accompanimentPrice,
      isGlobal: candidate.isGlobal,
      hasPortionLinks: candidate.hasPortionLinks,
      ...(candidate.global
        ? { global: ProductAccompanimentCandidateGlobalResponseDto.from(candidate.global) }
        : {}),
    })
  }
}
