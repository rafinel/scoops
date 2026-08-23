import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import type { ProductAccompanimentDetails } from '#mrp/domain/structures/product-accompaniment-details.ts'
import type { ProductAccompanimentsDetails } from '#mrp/domain/structures/product-accompaniments-details.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { MrpDatabase, MrpDatabaseScope } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
}

export class GetProductAccompanimentsUseCase
  implements UseCase<Request, ProductAccompanimentsDetails>
{
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductAccompanimentsDetails> {
    this.validateActor(request.actor)

    return this.database.run(async (scope) => {
      const owner = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      this.validateOwner(owner, request.actor.establishmentId)

      const links = await scope.productAccompanimentsRepository.findManyByProductId(
        request.actor.establishmentId,
        owner.id,
      )
      const accompaniments = await Promise.all(
        links.map((link) =>
          link.establishmentId !== request.actor.establishmentId ||
          link.productId !== owner.id
            ? Promise.reject(new NotFoundError('Acompanhamento não encontrado.'))
            : GetProductAccompanimentsUseCase.buildDetails(
                scope,
                request.actor.establishmentId,
                link,
              ),
        ),
      )

      accompaniments.sort((left, right) => {
        const nameComparison = normalizeForSort(
          left.accompanimentProductName,
        ).localeCompare(normalizeForSort(right.accompanimentProductName))
        return (
          nameComparison ||
          left.accompanimentProductId.localeCompare(right.accompanimentProductId)
        )
      })

      return { product: owner, accompaniments }
    })
  }

  static async buildDetails(
    scope: MrpDatabaseScope,
    establishmentId: string,
    link: ProductAccompaniment,
  ): Promise<ProductAccompanimentDetails> {
    const accompanimentProduct = await scope.productsRepository.findById(
      establishmentId,
      link.accompanimentProductId,
    )
    if (
      !accompanimentProduct ||
      accompanimentProduct.establishmentId !== establishmentId
    ) {
      throw new NotFoundError('Produto de acompanhamento não encontrado.')
    }

    const type = await scope.accompanimentTypesRepository.findById(
      establishmentId,
      link.accompanimentTypeId,
    )
    if (!type || type.establishmentId !== establishmentId) {
      throw new NotFoundError('Tipo de acompanhamento não encontrado.')
    }

    const source = await GetProductAccompanimentsUseCase.resolveCurrentSource(
      scope,
      accompanimentProduct,
    )
    return {
      id: link.id,
      accompanimentProductId: accompanimentProduct.id,
      accompanimentProductName: accompanimentProduct.name,
      accompanimentTypeId: type.id,
      accompanimentTypeName: type.name,
      unit: accompanimentProduct.unit,
      quantityPerPortion: link.quantityPerPortion,
      ...(source?.brandId ? { brandId: source.brandId } : {}),
      ...(source?.brandName ? { brandName: source.brandName } : {}),
      ...(source?.unitCost !== undefined ? { unitCost: source.unitCost } : {}),
      ...(source?.unitCost !== undefined
        ? { estimatedCost: link.quantityPerPortion * source.unitCost }
        : {}),
    }
  }

  private static async resolveCurrentSource(
    scope: MrpDatabaseScope,
    product: Product,
  ): Promise<{ brandId?: string; brandName?: string; unitCost?: number } | undefined> {
    if (
      product.status !== 'active' ||
      !product.categories.includes(ProductCategory.Accompaniment)
    ) {
      return undefined
    }

    if (product.stockControl === ProductStockControl.Single) {
      return product.currentUnitCost === undefined
        ? undefined
        : { unitCost: product.currentUnitCost }
    }

    const brands = await scope.brandsRepository.findManyByProductId(product.id)
    const mainBrand = brands.find((brand) => brand.isPrimary)
    if (!mainBrand || mainBrand.packageQuantity <= 0) return undefined
    return {
      brandId: mainBrand.id,
      brandName: mainBrand.name,
      unitCost: mainBrand.packagePrice / mainBrand.packageQuantity,
    }
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem consultar acompanhamentos.')
    }
  }

  private validateOwner(
    product: Product | undefined,
    establishmentId: string,
  ): asserts product is Product {
    if (!product || product.establishmentId !== establishmentId) {
      throw new NotFoundError('Produto não encontrado.')
    }
    if (!product.categories.includes(ProductCategory.Portion)) {
      throw new BadRequestError('O produto não é uma porção.')
    }
  }
}

function normalizeForSort(value: string): string {
  return value.trim().toLocaleLowerCase()
}
