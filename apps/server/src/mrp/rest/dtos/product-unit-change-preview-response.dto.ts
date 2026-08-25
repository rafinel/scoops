import { ApiProperty } from '@nestjs/swagger'
import { ProductUnit } from '@scoops/core/mrp/domain/structures'
import type { ProductUnitChangePreview } from '@scoops/core/mrp/domain/structures'

class ProductUnitChangeAffectedResponseDto {
  @ApiProperty() balances!: number
  @ApiProperty({ type: Object, isArray: true })
  brands!: readonly { brandId: string; brandName: string }[]
  @ApiProperty() recipeYields!: number
  @ApiProperty() recipeIngredients!: number
  @ApiProperty() sizes!: number
  @ApiProperty() accompanimentLinks!: number
  @ApiProperty() hasIdealStock!: boolean
  @ApiProperty() hasCurrentUnitCost!: boolean
}

export class ProductUnitChangePreviewResponseDto {
  @ApiProperty({ enum: Object.values(ProductUnit) }) currentUnit!: ProductUnit
  @ApiProperty({ enum: Object.values(ProductUnit) }) targetUnit!: ProductUnit
  @ApiProperty({ type: () => ProductUnitChangeAffectedResponseDto })
  affected!: ProductUnitChangeAffectedResponseDto

  static from(preview: ProductUnitChangePreview): ProductUnitChangePreviewResponseDto {
    return Object.assign(new ProductUnitChangePreviewResponseDto(), {
      currentUnit: preview.currentUnit,
      targetUnit: preview.targetUnit,
      affected: Object.assign(new ProductUnitChangeAffectedResponseDto(), {
        balances: preview.affected.balances,
        brands: preview.affected.brands.map((brand) => ({ ...brand })),
        recipeYields: preview.affected.recipeYields,
        recipeIngredients: preview.affected.recipeIngredients,
        sizes: preview.affected.sizes,
        accompanimentLinks: preview.affected.accompanimentLinks,
        hasIdealStock: preview.affected.hasIdealStock,
        hasCurrentUnitCost: preview.affected.hasCurrentUnitCost,
      }),
    })
  }
}
