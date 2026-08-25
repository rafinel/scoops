import { ApiProperty } from '@nestjs/swagger'
import type { ProductRemovalImpact } from '@scoops/core/mrp/domain/structures'

class ProductRemovalCountsResponseDto {
  @ApiProperty() brands!: number
  @ApiProperty() balances!: number
  @ApiProperty() ownedRecipe!: number
  @ApiProperty() sizes!: number
  @ApiProperty() resaleConfigurations!: number
  @ApiProperty() ownedAccompanimentLinks!: number
  @ApiProperty() consumingRecipeLinks!: number
  @ApiProperty() inverseAccompanimentLinks!: number
}

class ProductRetainedHistoryResponseDto {
  @ApiProperty() stockTransactions!: number
  @ApiProperty() productions!: number
  @ApiProperty() orders!: number
}

export class ProductRemovalImpactResponseDto {
  @ApiProperty() productName!: string
  @ApiProperty({ type: () => ProductRemovalCountsResponseDto })
  removable!: ProductRemovalImpact['removable']
  @ApiProperty({ type: () => ProductRetainedHistoryResponseDto })
  retainedHistory!: ProductRemovalImpact['retainedHistory']

  static from(impact: ProductRemovalImpact): ProductRemovalImpactResponseDto {
    return Object.assign(new ProductRemovalImpactResponseDto(), {
      productName: impact.productName,
      removable: { ...impact.removable },
      retainedHistory: { ...impact.retainedHistory },
    })
  }
}
