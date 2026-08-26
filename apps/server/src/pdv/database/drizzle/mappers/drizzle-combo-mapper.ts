import type { Combo } from '@scoops/core/pdv/domain/entities'
import type { DiscountComponent } from '@scoops/core/pdv/domain/structures'

import type {
  DrizzleDiscount,
  DrizzleDiscountComponent,
  DrizzleDiscountComponentAccompaniment,
} from '@/pdv/database/drizzle/types'

export class DrizzleComboMapper {
  static toDomain(
    discount: DrizzleDiscount,
    components: readonly DrizzleDiscountComponent[],
    accompaniments: readonly DrizzleDiscountComponentAccompaniment[],
  ): Combo {
    const accompanimentIdsByComponentId = new Map<string, string[]>()

    for (const accompaniment of accompaniments) {
      const componentAccompanimentIds = accompanimentIdsByComponentId.get(
        accompaniment.componentId,
      )
      if (componentAccompanimentIds) {
        componentAccompanimentIds.push(accompaniment.accompanimentId)
      } else {
        accompanimentIdsByComponentId.set(accompaniment.componentId, [
          accompaniment.accompanimentId,
        ])
      }
    }

    return {
      id: discount.id,
      establishmentId: discount.establishmentId,
      name: discount.name,
      type: discount.type,
      status: discount.status,
      fixedPrice: Number(discount.fixedPrice),
      components: components.map((component) =>
        DrizzleComboMapper.toComponent(
          component,
          accompanimentIdsByComponentId.get(component.id) ?? [],
        ),
      ),
      createdAt: discount.createdAt,
      updatedAt: discount.updatedAt,
    }
  }

  private static toComponent(
    component: DrizzleDiscountComponent,
    accompanimentIds: readonly string[],
  ): DiscountComponent {
    if (component.kind === 'portion') {
      return {
        kind: component.kind,
        productId: component.productId,
        quantity: component.quantity,
        sizeId: component.sizeId as string,
        accompanimentIds,
      }
    }

    return {
      kind: component.kind,
      productId: component.productId,
      quantity: component.quantity,
      ...(component.brandId ? { brandId: component.brandId } : {}),
    }
  }
}
