import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import { AccompanimentRemovalScope } from '#mrp/domain/structures/accompaniment-removal-scope.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
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
  readonly linkId: string
  readonly scope?: AccompanimentRemovalScope
}

export class RemoveProductAccompanimentUseCase implements UseCase<Request, void> {
  private readonly salesConfiguration = new ProductSalesConfigurationStrategy()

  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<void> {
    this.validateActor(request.actor)
    await this.database.run((scope) => this.remove(scope, request))
  }

  private async remove(scope: MrpDatabaseRepositories, request: Request): Promise<void> {
    const establishmentId = request.actor.establishmentId
    const owner = await scope.productsRepository.findById(
      establishmentId,
      request.productId,
    )
    this.validateOwner(owner, establishmentId)
    const link = await scope.productAccompanimentsRepository.findById(
      establishmentId,
      owner.id,
      request.linkId,
    )
    if (
      !link ||
      link.establishmentId !== establishmentId ||
      link.productId !== owner.id
    ) {
      throw new NotFoundError('Acompanhamento não encontrado.')
    }
    this.validateScope(link, request.scope)

    const removedFromProductIds = await this.removeLink(scope, link, request.scope)
    await this.publishSalesConfigurations(scope, establishmentId, [
      ...new Set([owner.id, ...removedFromProductIds]),
    ])
  }

  private async removeLink(
    scope: MrpDatabaseRepositories,
    link: ProductAccompaniment,
    removalScope: AccompanimentRemovalScope | undefined,
  ): Promise<readonly string[]> {
    const { globalAccompanimentId } = link
    if (
      globalAccompanimentId === undefined ||
      removalScope !== AccompanimentRemovalScope.All
    ) {
      await scope.productAccompanimentsRepository.remove(
        link.establishmentId,
        link.productId,
        link.id,
      )
      return []
    }

    const rows =
      await scope.productAccompanimentsRepository.findManyByAccompanimentProductId(
        link.establishmentId,
        link.accompanimentProductId,
      )
    await scope.productAccompanimentsRepository.removeByGlobalAccompanimentId(
      link.establishmentId,
      globalAccompanimentId,
    )
    await scope.globalAccompanimentsRepository.remove(
      link.establishmentId,
      globalAccompanimentId,
    )
    return rows.map((row) => row.productId)
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
      throw new AuthorizationError('Somente gestores podem remover acompanhamentos.')
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

  private validateScope(
    link: ProductAccompaniment,
    removalScope: AccompanimentRemovalScope | undefined,
  ): void {
    if (
      link.globalAccompanimentId === undefined &&
      removalScope === AccompanimentRemovalScope.All
    ) {
      throw new BadRequestError(
        'Somente acompanhamentos globais podem ser removidos de todas as porções.',
      )
    }
  }
}
