import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ProductUnit } from '@scoops/core/mrp/domain/structures'

import { ProductResponseDto } from './product-stock-response.dto'

export class RecipeIngredientResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty({ format: 'uuid' }) ingredientProductId!: string
  @ApiProperty() ingredientProductName!: string
  @ApiPropertyOptional({ format: 'uuid' }) ingredientBrandId?: string
  @ApiPropertyOptional() ingredientBrandName?: string
  @ApiProperty({ enum: Object.values(ProductUnit) }) unit!: ProductUnit
  @ApiProperty() quantity!: number
  @ApiProperty() unitCost!: number
  @ApiProperty() lineCost!: number
  @ApiProperty() cogsPercentage!: number
  @ApiProperty() currentBalance!: number
  @ApiProperty() capacity!: number
  @ApiProperty() isLimiting!: boolean
}

export class RecipeDetailsResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string
  @ApiProperty() yieldQuantity!: number
  @ApiProperty() totalCost!: number
  @ApiProperty() unitCost!: number
  @ApiProperty() maximumProducibleQuantity!: number
  @ApiProperty({ type: () => RecipeIngredientResponseDto, isArray: true })
  ingredients!: RecipeIngredientResponseDto[]
}

export class RecipeResponseDto {
  @ApiProperty({ type: () => ProductResponseDto }) product!: ProductResponseDto
  @ApiPropertyOptional({ type: () => RecipeDetailsResponseDto, nullable: true })
  recipe!: RecipeDetailsResponseDto | null
}
