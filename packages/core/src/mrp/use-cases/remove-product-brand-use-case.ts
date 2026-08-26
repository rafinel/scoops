import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import {
  GetAffectedProductSalesConfigurationsUseCase,
  publishAffectedProductSalesConfigurations,
} from '#mrp/use-cases/get-affected-product-sales-configurations-use-case.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = { actor: ProductActor; productId: string; brandId: string }

export class RemoveProductBrandUseCase implements UseCase<Request, void> {
  constructor(
    private readonly database: MrpDatabase,
    private readonly broker?: Broker,
  ) {}

  async execute(request: Request): Promise<void> {
    this.validateActor(request.actor)
    let configurations: readonly import('#mrp/domain/structures/product-sales-configuration.ts').ProductSalesConfiguration[] =
      []
    await this.database.run(async (scope) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      if (!product) throw new NotFoundError('Produto não encontrado.')
      const brand = await scope.brandsRepository.findById(product.id, request.brandId)
      if (!brand) throw new NotFoundError('Marca não encontrada.')
      const brandCount = await scope.brandsRepository.countByProductId(product.id)
      if (brand.isPrimary && brandCount > 1)
        throw new ConflictError(
          'Defina outra marca como principal antes de remover esta marca.',
        )
      await scope.brandsRepository.remove(product.id, brand.id)
      configurations = await new GetAffectedProductSalesConfigurationsUseCase().execute({
        scope,
        establishmentId: request.actor.establishmentId,
        productId: request.productId,
      })
    })
    await publishAffectedProductSalesConfigurations({
      broker: this.broker,
      establishmentId: request.actor.establishmentId,
      productId: request.productId,
      configurations,
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem remover marcas.')
  }
}
