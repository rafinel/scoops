import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { ProductBrandStock } from '#mrp/domain/structures/product-brand-stock.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = { actor: ProductActor; productId: string; brandId: string }

export class SetPrimaryProductBrandUseCase
  implements UseCase<Request, ProductBrandStock>
{
  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductBrandStock> {
    this.validateActor(request.actor)
    return this.database.run(async (scope) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      if (!product) throw new NotFoundError('Produto não encontrado.')
      const brand = await scope.brandsRepository.findById(product.id, request.brandId)
      if (!brand) throw new NotFoundError('Marca não encontrada.')
      const savedBrand = brand.isPrimary
        ? brand
        : await scope.brandsRepository.setPrimary(product.id, brand.id)
      const balance = await scope.stockBalancesRepository.findByProductAndBrand(
        product.id,
        brand.id,
      )
      return {
        brand: savedBrand,
        stockQuantity: balance?.quantity ?? 0,
        unitPrice: savedBrand.packagePrice / savedBrand.packageQuantity,
      }
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem definir a marca principal.')
  }
}
