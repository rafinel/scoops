import { DiscountStatus } from '#pdv/domain/structures/discount-status.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { DiscountComponent } from '#pdv/domain/structures/discount-component.ts'
import type { ProductSalesConfiguration } from '#mrp/domain/structures/product-sales-configuration.ts'
import type { PdvDatabase } from '#pdv/interfaces/pdv-database.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { ListCombosUseCase } from '#pdv/use-cases/list-combos-use-case.ts'
type Request = {
  readonly establishmentId: string
  readonly productId: string
  readonly configuration: ProductSalesConfiguration | null
  readonly state: 'available' | 'deleted'
}
export class RevalidateCombosForProductUseCase
  implements UseCase<Request, readonly string[]>
{
  constructor(private readonly database: PdvDatabase) {}
  async execute(request: Request): Promise<readonly string[]> {
    return this.database.run(async (scope) => {
      const combos = await scope.discountsRepository.findManyByProductId(
        request.establishmentId,
        request.productId,
      )
      const changed: string[] = []
      for (const combo of combos) {
        if (
          combo.establishmentId !== request.establishmentId ||
          combo.status !== DiscountStatus.Active
        )
          continue
        if (
          !combo.components.some((component) => component.productId === request.productId)
        )
          continue
        if (
          combo.components.some(
            (component) =>
              component.productId === request.productId &&
              !this.valid(component, request.configuration),
          )
        ) {
          await scope.discountsRepository.setStatus(
            request.establishmentId,
            combo.id,
            DiscountStatus.Inactive,
            combo.updatedAt,
          )
          changed.push(combo.id)
        }
      }
      return changed
    })
  }
  private valid(
    component: DiscountComponent,
    configuration: ProductSalesConfiguration | null,
  ): boolean {
    if (configuration?.status !== 'active') return false
    return ListCombosUseCase.evaluate(component, {
      productId: configuration.productId,
      name: configuration.name,
      kind: configuration.categories.includes(ProductCategory.Portion)
        ? 'portion'
        : 'resale',
      stockControl: configuration.stockControl,
      isActive: configuration.status === 'active',
      isAvailable: true,
      sizes: configuration.sizes.map((size) => ({
        sizeId: size.sizeId,
        name: size.name,
        quantity: 1,
        basePrice: size.price,
        isActive: size.isActive,
        isAvailable: true,
        accompaniments: size.accompaniments.map((item) => ({
          accompanimentId: item.accompanimentId,
          name: item.name,
          type: item.type,
          quantityPerPortion: 1,
          basePrice: item.basePrice,
          isActive: item.isActive,
          isAvailable: true,
        })),
      })),
      resalePrice: configuration.resaleConfigurations.find((item) => !item.brandId)
        ?.price,
      resaleBrands: configuration.resaleConfigurations.flatMap((item) =>
        item.brandId
          ? [
              {
                brandId: item.brandId,
                name: item.brandName ?? '',
                basePrice: item.price,
                isActive: item.isActive,
                isAvailable: true,
              },
            ]
          : [],
      ),
    }).valid
  }
}
