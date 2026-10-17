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
import {
  GetAffectedProductSalesConfigurationsUseCase,
  publishAffectedProductSalesConfigurations,
} from '#mrp/use-cases/get-affected-product-sales-configurations-use-case.ts'
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
  private readonly getAffectedProductSalesConfigurations =
    new GetAffectedProductSalesConfigurationsUseCase()

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

    const affectedProductIds = await this.removeLink(scope, link, request.scope)
    const configurations = await this.getAffectedProductSalesConfigurations.execute({
      scope,
      establishmentId,
      productId: owner.id,
      affectedProductIds,
    })
    await publishAffectedProductSalesConfigurations({
      scope,
      establishmentId,
      productId: owner.id,
      configurations,
    })
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
