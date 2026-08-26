import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import type { Combo } from '@scoops/core/pdv/domain/entities'
import type { ComboDetails, DiscountComponent } from '@scoops/core/pdv/domain/structures'
import { DiscountStatus, DiscountType } from '@scoops/core/pdv/domain/structures'

class DiscountComponentResponseDto {
  @ApiProperty({ enum: ['portion', 'resale'] })
  kind!: DiscountComponent['kind']

  @ApiProperty({ format: 'uuid' })
  productId!: string

  @ApiProperty({ minimum: 1 })
  quantity!: number

  @ApiPropertyOptional({ format: 'uuid' })
  sizeId?: string

  @ApiPropertyOptional({ format: 'uuid', isArray: true })
  accompanimentIds?: readonly string[]

  @ApiPropertyOptional({ format: 'uuid' })
  brandId?: string

  static from(component: DiscountComponent): DiscountComponentResponseDto {
    if (component.kind === 'portion') {
      return Object.assign(new DiscountComponentResponseDto(), {
        kind: component.kind,
        productId: component.productId,
        quantity: component.quantity,
        sizeId: component.sizeId,
        accompanimentIds: [...component.accompanimentIds],
      })
    }

    return Object.assign(new DiscountComponentResponseDto(), {
      kind: component.kind,
      productId: component.productId,
      quantity: component.quantity,
      ...(component.brandId ? { brandId: component.brandId } : {}),
    })
  }
}

class ComboEntityResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string

  @ApiProperty({ format: 'uuid' })
  establishmentId!: string

  @ApiProperty()
  name!: string

  @ApiProperty({ enum: Object.values(DiscountType) })
  type!: Combo['type']

  @ApiProperty({ enum: Object.values(DiscountStatus) })
  status!: Combo['status']

  @ApiProperty({ minimum: 0.01 })
  fixedPrice!: number

  @ApiProperty({ type: () => DiscountComponentResponseDto, isArray: true })
  components!: DiscountComponentResponseDto[]

  @ApiProperty({ format: 'date-time' })
  createdAt!: string

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string
}

class ComboComponentDetailsResponseDto {
  @ApiProperty({ type: () => DiscountComponentResponseDto })
  component!: DiscountComponentResponseDto

  @ApiProperty()
  productName!: string

  @ApiProperty()
  configurationName!: string

  @ApiProperty({ type: String, isArray: true })
  accompanimentNames!: readonly string[]

  @ApiProperty({ minimum: 0 })
  unitPrice!: number

  @ApiProperty({ minimum: 0 })
  subtotal!: number

  @ApiProperty({ enum: ['valid', 'invalid'] })
  validity!: 'valid' | 'invalid'
}

export class ComboResponseDto {
  @ApiProperty({ type: () => ComboEntityResponseDto })
  combo!: ComboEntityResponseDto

  @ApiProperty({ type: () => ComboComponentDetailsResponseDto, isArray: true })
  components!: ComboComponentDetailsResponseDto[]

  @ApiProperty({ minimum: 0 })
  normalPrice!: number

  @ApiProperty()
  savings!: number

  static from(details: ComboDetails): ComboResponseDto {
    return Object.assign(new ComboResponseDto(), {
      combo: {
        id: details.combo.id,
        establishmentId: details.combo.establishmentId,
        name: details.combo.name,
        type: details.combo.type,
        status: details.combo.status,
        fixedPrice: details.combo.fixedPrice,
        components: details.combo.components.map(DiscountComponentResponseDto.from),
        createdAt: details.combo.createdAt.toISOString(),
        updatedAt: details.combo.updatedAt.toISOString(),
      },
      components: details.components.map((component) => ({
        component: DiscountComponentResponseDto.from(component.component),
        productName: component.productName,
        configurationName: component.configurationName,
        accompanimentNames: [...component.accompanimentNames],
        unitPrice: component.unitPrice,
        subtotal: component.subtotal,
        validity: component.validity,
      })),
      normalPrice: details.normalPrice,
      savings: details.savings,
    })
  }
}
