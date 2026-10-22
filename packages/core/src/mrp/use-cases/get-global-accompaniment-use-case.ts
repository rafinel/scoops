import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { GlobalAccompanimentDetails } from '#mrp/domain/structures/global-accompaniment-details.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { GlobalAccompanimentDetailsStrategy } from '#mrp/domain/strategies/global-accompaniment-details-strategy.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
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

export class GetGlobalAccompanimentUseCase
  implements UseCase<Request, GlobalAccompanimentDetails>
{
  private readonly globalDetails = new GlobalAccompanimentDetailsStrategy()

  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<GlobalAccompanimentDetails> {
    this.validateActor(request.actor)

    return this.database.run((scope) => this.get(scope, request))
  }

  private async get(
    scope: MrpDatabaseRepositories,
    request: Request,
  ): Promise<GlobalAccompanimentDetails> {
    const establishmentId = request.actor.establishmentId
    const accompanimentProduct = await scope.productsRepository.findById(
      establishmentId,
      request.productId,
    )
    this.validateAccompanimentProduct(accompanimentProduct, establishmentId)

    const global =
      await scope.globalAccompanimentsRepository.findByAccompanimentProductId(
        establishmentId,
        accompanimentProduct.id,
      )
    if (!global) {
      return this.globalDetails.execute({ accompanimentProduct, brands: [] })
    }
    return this.buildSharedDetails(scope, accompanimentProduct, global)
  }

  private async buildSharedDetails(
    scope: MrpDatabaseRepositories,
    accompanimentProduct: Product,
    global: GlobalAccompaniment,
  ): Promise<GlobalAccompanimentDetails> {
    const { establishmentId } = accompanimentProduct
    const [accompanimentType, brands] = await Promise.all([
      scope.accompanimentTypesRepository.findById(
        establishmentId,
        global.accompanimentTypeId,
      ),
      scope.brandsRepository.findManyByProductId(
        establishmentId,
        accompanimentProduct.id,
      ),
    ])
    if (!accompanimentType || accompanimentType.establishmentId !== establishmentId) {
      throw new NotFoundError('Tipo de acompanhamento não encontrado.')
    }
    return this.globalDetails.execute({
      accompanimentProduct,
      brands,
      shared: { global, accompanimentType },
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager && actor.profile !== UserProfile.Operator) {
      throw new AuthorizationError(
        'Somente gestores e operadores podem consultar acompanhamentos globais.',
      )
    }
  }

  private validateAccompanimentProduct(
    product: Product | undefined,
    establishmentId: string,
  ): asserts product is Product {
    if (!product || product.establishmentId !== establishmentId) {
      throw new NotFoundError('Produto não encontrado.')
    }
    if (!product.categories.includes(ProductCategory.Accompaniment)) {
      throw new BadRequestError('O produto não é um acompanhamento.')
    }
  }
}
