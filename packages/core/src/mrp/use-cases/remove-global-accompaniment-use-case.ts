import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { GlobalAccompaniment } from '#mrp/domain/entities/global-accompaniment.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductSalesConfigurationStrategy } from '#mrp/domain/strategies/product-sales-configuration-strategy.ts'
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
  readonly keepPortionLinks?: boolean
}

export class RemoveGlobalAccompanimentUseCase implements UseCase<Request, void> {
  private readonly salesConfiguration = new ProductSalesConfigurationStrategy()

  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<void> {
    this.validateActor(request.actor)
    await this.database.run((scope) => this.remove(scope, request))
  }

  private async remove(scope: MrpDatabaseRepositories, request: Request): Promise<void> {
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
    if (!global) throw new NotFoundError('Acompanhamento global não encontrado.')

    if (request.keepPortionLinks === true) {
      await this.keepPortionLinks(scope, establishmentId, global)
      return
    }
    await this.removeEverywhere(scope, establishmentId, accompanimentProduct, global)
  }

  private async keepPortionLinks(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    global: GlobalAccompaniment,
  ): Promise<void> {
    // The rows keep their id, type, quantity and updatedAt and take the global's price as
    // their own, so the effective sales configuration is unchanged and nothing is published.
    await scope.productAccompanimentsRepository.clearGlobalReferenceByGlobalAccompanimentId(
      establishmentId,
      global.id,
      global.accompanimentPrice,
    )
    await scope.globalAccompanimentsRepository.remove(establishmentId, global.id)
  }

  private async removeEverywhere(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    accompanimentProduct: Product,
    global: GlobalAccompaniment,
  ): Promise<void> {
    const rows =
      await scope.productAccompanimentsRepository.findManyByAccompanimentProductId(
        establishmentId,
        accompanimentProduct.id,
      )
    await scope.productAccompanimentsRepository.removeByGlobalAccompanimentId(
      establishmentId,
      global.id,
    )
    await scope.globalAccompanimentsRepository.remove(establishmentId, global.id)
    await this.publishSalesConfigurations(
      scope,
      establishmentId,
      accompanimentProduct.id,
      rows.map((row) => row.productId),
    )
  }

  private async publishSalesConfigurations(
    scope: MrpDatabaseRepositories,
    establishmentId: string,
    accompanimentProductId: string,
    affectedPortionIds: readonly string[],
  ): Promise<void> {
    if (affectedPortionIds.length === 0) return

    const sources =
      await scope.productSalesConfigurationSourcesRepository.findManyByProductIds(
        establishmentId,
        [...new Set([accompanimentProductId, ...affectedPortionIds])],
      )
    const configurations = this.salesConfiguration
      .execute({ establishmentId, sources })
      .filter((configuration) =>
        configuration.categories.includes(ProductCategory.Portion),
      )
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
      throw new AuthorizationError(
        'Somente gestores podem remover acompanhamentos globais.',
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
    if (
      !product.categories.includes(ProductCategory.Accompaniment) ||
      product.categories.includes(ProductCategory.Portion)
    ) {
      throw new BadRequestError(
        'O produto não é um acompanhamento elegível para porções.',
      )
    }
  }
}
