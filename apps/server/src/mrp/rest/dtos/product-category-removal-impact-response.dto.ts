import { ApiProperty } from '@nestjs/swagger'
import { ProductCategory } from '@scoops/core/mrp/domain/structures'
import type {
  ProductCategoryDependency,
  ProductCategoryRemovalImpact,
} from '@scoops/core/mrp/domain/structures'

export class ProductCategoryRemovalImpactResponseDto {
  @ApiProperty({ enum: Object.values(ProductCategory) }) category!: ProductCategory
  @ApiProperty() canRemove!: boolean
  @ApiProperty({ type: Object, isArray: true })
  dependencies!: readonly ProductCategoryDependency[]

  static from(
    impact: ProductCategoryRemovalImpact,
  ): ProductCategoryRemovalImpactResponseDto {
    return Object.assign(new ProductCategoryRemovalImpactResponseDto(), {
      category: impact.category,
      canRemove: impact.canRemove,
      dependencies: impact.dependencies.map((dependency) => ({ ...dependency })),
    })
  }
}
