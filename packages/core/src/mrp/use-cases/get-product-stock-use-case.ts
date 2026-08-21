import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { ProductStockDetails } from '#mrp/domain/structures/product-stock-details.ts'
import { StockSituation } from '#mrp/domain/structures/stock-situation.ts'
import type { BrandsRepository } from '#mrp/interfaces/brands-repository.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import type { StockBalancesRepository } from '#mrp/interfaces/stock-balances-repository.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = { actor: ProductActor; productId: string }

export class GetProductStockUseCase implements UseCase<Request, ProductStockDetails> {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly brandsRepository: BrandsRepository,
    private readonly stockBalancesRepository: StockBalancesRepository,
  ) {}

  async execute(request: Request): Promise<ProductStockDetails> {
    this.validateActor(request.actor)
    const product = await this.productsRepository.findById(
      request.actor.establishmentId,
      request.productId,
    )
    if (!product) throw new NotFoundError('Produto não encontrado.')

    const balances = await this.stockBalancesRepository.findManyByProductId(product.id)
    const stockQuantity = balances.reduce((total, balance) => total + balance.quantity, 0)
    const stockSituation =
      product.idealStock !== undefined && stockQuantity < product.idealStock
        ? StockSituation.Low
        : StockSituation.Normal

    if (product.stockControl === ProductStockControl.Single) {
      return {
        product,
        stockQuantity,
        idealStock: product.idealStock,
        stockSituation,
        brands: [],
      }
    }

    const brands = await this.brandsRepository.findManyByProductId(product.id)
    return {
      product,
      stockQuantity,
      idealStock: product.idealStock,
      stockSituation,
      brands: brands.map((brand) => ({
        brand,
        stockQuantity:
          balances.find((balance) => balance.brandId === brand.id)?.quantity ?? 0,
        unitPrice: brand.packagePrice / brand.packageQuantity,
      })),
    }
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem consultar o estoque.')
    }
  }
}
