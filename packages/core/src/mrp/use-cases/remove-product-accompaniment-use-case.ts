import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import {
  GetAffectedProductSalesConfigurationsUseCase,
  publishAffectedProductSalesConfigurations,
} from '#mrp/use-cases/get-affected-product-sales-configurations-use-case.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly linkId: string
}

export class RemoveProductAccompanimentUseCase implements UseCase<Request, void> {
  constructor(
    private readonly database: MrpDatabase,
    private readonly broker?: Broker,
  ) {}

  async execute(request: Request): Promise<void> {
    this.validateActor(request.actor)
    let configurations: readonly import('#mrp/domain/structures/product-sales-configuration.ts').ProductSalesConfiguration[] =
      []
    await this.database.run(async (scope) => {
      const owner = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      validateOwner(owner, request.actor.establishmentId)
      const link = await scope.productAccompanimentsRepository.findById(
        request.actor.establishmentId,
        owner.id,
        request.linkId,
      )
      if (
        !link ||
        link.establishmentId !== request.actor.establishmentId ||
        link.productId !== owner.id
      ) {
        throw new NotFoundError('Acompanhamento não encontrado.')
      }
      await scope.productAccompanimentsRepository.remove(
        request.actor.establishmentId,
        owner.id,
        link.id,
      )
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
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem remover acompanhamentos.')
    }
  }
}

function validateOwner(
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
