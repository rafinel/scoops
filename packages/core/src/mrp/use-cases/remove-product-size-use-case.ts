import type { MrpDatabaseRepositories } from '#mrp/interfaces/mrp-database.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductSalesConfigurationStrategy } from '#mrp/domain/strategies/product-sales-configuration-strategy.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly sizeId: string
}

export class RemoveProductSizeUseCase implements UseCase<Request, void> {
  private readonly salesConfiguration = new ProductSalesConfigurationStrategy()

  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<void> {
    this.validateActor(request.actor)

    await this.database.run(async (scope: MrpDatabaseRepositories) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      validatePortionProduct(product, request.actor.establishmentId)

      const size = await scope.productSizesRepository.findById(
        request.actor.establishmentId,
        product.id,
        request.sizeId,
      )
      if (
        !size ||
        size.establishmentId !== request.actor.establishmentId ||
        size.productId !== product.id
      ) {
        throw new NotFoundError('Tamanho não encontrado.')
      }

      await scope.productSizesRepository.remove(
        request.actor.establishmentId,
        product.id,
        size.id,
      )
      const affectedProductIds = await this.findAffectedProductIds(
        scope,
        request.actor.establishmentId,
        request.productId,
      )
      await this.publishSalesConfigurations(
        scope,
        request.actor.establishmentId,
        affectedProductIds,
      )
    })
  }

  private async findAffectedProductIds(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    productId: string,
  ): Promise<readonly string[]> {
    const links =
      await scope.productAccompanimentsRepository.findManyByAccompanimentProductId(
        establishmentId,
        productId,
      )
    const ownerIds = links
      .filter((link) => link.establishmentId === establishmentId)
      .map((link) => link.productId)
    return [...new Set([productId, ...ownerIds])]
  }

  private async publishSalesConfigurations(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    productIds: readonly string[],
  ): Promise<void> {
    const sources =
      await scope.productSalesConfigurationSourcesRepository.findManyByProductIds(
        establishmentId,
        productIds,
      )
    const configurations = this.salesConfiguration.execute({ establishmentId, sources })
    for (const configuration of configurations) {
      await scope.eventsRepository.add(
        new ProductSalesConfigurationChangedEvent({
          establishmentId,
          productId: configuration.productId,
          state: 'available',
          configuration,
        }),
      )
    }
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem remover tamanhos.')
    }
  }
}

function validatePortionProduct(
  product: Product | undefined,
  establishmentId: string,
): asserts product is Product {
  if (!product || product.establishmentId !== establishmentId) {
    throw new NotFoundError('Produto não encontrado.')
  }
  if (!product.categories.includes(ProductCategory.Portion)) {
    throw new BadRequestError('O produto não é uma porção.')
  }
  if (product.categories.includes(ProductCategory.Resale)) {
    throw new BadRequestError('Porção e Revenda não podem ser usadas juntas.')
  }
}
