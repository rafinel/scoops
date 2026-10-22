import { ApiProperty } from '@nestjs/swagger'
import type { AccompanimentPortionDetails } from '@scoops/core/mrp/domain/structures'

import { ProductAccompanimentDetailsResponseDto } from './product-accompaniments-response.dto'

export class AccompanimentPortionResponseDto extends ProductAccompanimentDetailsResponseDto {
  @ApiProperty({ format: 'uuid', description: 'The Portion that owns the link row.' })
  portionProductId!: string

  @ApiProperty() portionProductName!: string

  static from(details: AccompanimentPortionDetails): AccompanimentPortionResponseDto {
    return Object.assign(new AccompanimentPortionResponseDto(), {
      ...AccompanimentPortionResponseDto.pickRowFields(details),
      ...AccompanimentPortionResponseDto.pickCostFields(details),
      portionProductId: details.portionProductId,
      portionProductName: details.portionProductName,
    })
  }

  private static pickRowFields(details: AccompanimentPortionDetails) {
    return {
      id: details.id,
      accompanimentProductId: details.accompanimentProductId,
      accompanimentProductName: details.accompanimentProductName,
      accompanimentTypeId: details.accompanimentTypeId,
      accompanimentTypeName: details.accompanimentTypeName,
      unit: details.unit,
      quantityPerPortion: details.quantityPerPortion,
      salePrice: details.salePrice,
      isGlobal: details.isGlobal,
      hasOtherPortionLinks: details.hasOtherPortionLinks,
    }
  }

  private static pickCostFields(details: AccompanimentPortionDetails) {
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
