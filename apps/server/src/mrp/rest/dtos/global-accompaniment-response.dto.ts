import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  ProductUnit,
  type GlobalAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'

export class GlobalAccompanimentResponseDto {
  @ApiProperty({ format: 'uuid' }) accompanimentProductId!: string
  @ApiProperty() accompanimentProductName!: string
  @ApiProperty({ description: 'Whether the Accompaniment is global.' }) isGlobal!: boolean
  @ApiProperty({ enum: Object.values(ProductUnit) }) unit!: ProductUnit

  @ApiProperty({
    type: Number,
    nullable: true,
    example: null,
    description:
      'Saved product-wide Accompaniment sale price. Null means unconfigured; zero means free.',
  })
  salePrice!: number | null

  @ApiPropertyOptional({ format: 'uuid', description: 'Present only when global.' })
  globalAccompanimentId?: string

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Shared type; present only when global.',
  })
  accompanimentTypeId?: string

  @ApiPropertyOptional({ description: 'Shared type name; present only when global.' })
  accompanimentTypeName?: string

  @ApiPropertyOptional({ description: 'Shared quantity; present only when global.' })
  quantityPerPortion?: number

  @ApiPropertyOptional({ format: 'uuid' }) brandId?: string
  @ApiPropertyOptional() brandName?: string
  @ApiPropertyOptional() unitCost?: number
  @ApiPropertyOptional() estimatedCost?: number

  static from(details: GlobalAccompanimentDetails): GlobalAccompanimentResponseDto {
    return Object.assign(new GlobalAccompanimentResponseDto(), {
      accompanimentProductId: details.accompanimentProductId,
      accompanimentProductName: details.accompanimentProductName,
      isGlobal: details.isGlobal,
      unit: details.unit,
      salePrice: details.salePrice,
      ...GlobalAccompanimentResponseDto.pickSharedFields(details),
      ...GlobalAccompanimentResponseDto.pickCostFields(details),
    })
  }

  private static pickSharedFields(details: GlobalAccompanimentDetails) {
    return {
      ...(details.globalAccompanimentId
        ? { globalAccompanimentId: details.globalAccompanimentId }
        : {}),
      ...(details.accompanimentTypeId
        ? { accompanimentTypeId: details.accompanimentTypeId }
        : {}),
      ...(details.accompanimentTypeName
        ? { accompanimentTypeName: details.accompanimentTypeName }
        : {}),
      ...(details.quantityPerPortion !== undefined
        ? { quantityPerPortion: details.quantityPerPortion }
        : {}),
    }
  }

  private static pickCostFields(details: GlobalAccompanimentDetails) {
    return {
      ...(details.brandId ? { brandId: details.brandId } : {}),
      ...(details.brandName ? { brandName: details.brandName } : {}),
      ...(details.unitCost !== undefined ? { unitCost: details.unitCost } : {}),
      ...(details.estimatedCost !== undefined
        ? { estimatedCost: details.estimatedCost }
        : {}),
    }
  }
}
