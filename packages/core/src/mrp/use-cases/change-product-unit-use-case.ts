import type { MrpDatabaseRepositories } from '#mrp/interfaces/mrp-database.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { ChangeProductUnitInput } from '#mrp/domain/structures/change-product-unit-input.ts'
import { ProductUpdatedEvent } from '#mrp/domain/events/product-updated-event.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductSalesConfigurationStrategy } from '#mrp/domain/strategies/product-sales-configuration-strategy.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly input: ChangeProductUnitInput
}

export class ChangeProductUnitUseCase implements UseCase<Request, Product> {
  private readonly salesConfiguration = new ProductSalesConfigurationStrategy()

  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<Product> {
    this.validateActor(request.actor)
    this.validateInput(request.input)

    const product = await this.database.run(async (scope: MrpDatabaseRepositories) => {
      const currentProduct = await scope.productsRepository.findByIdForUpdate(
        request.actor.establishmentId,
        request.productId,
      )
      if (
        !currentProduct ||
        currentProduct.establishmentId !== request.actor.establishmentId
      ) {
        throw new NotFoundError('Produto não encontrado.')
      }
      this.validateVersion(currentProduct, request.input.expectedUpdatedAt)
      if (currentProduct.unit === request.input.targetUnit) {
        throw new BadRequestError('A unidade de destino deve ser diferente da atual.')
      }

      const savedProduct = await scope.productsRepository.replace(
        request.actor.establishmentId,
        currentProduct.id,
        { unit: request.input.targetUnit },
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
      await scope.eventsRepository.add(
        new ProductUpdatedEvent({
          productId: savedProduct.id,
          establishmentId: savedProduct.establishmentId,
          updatedAt: savedProduct.updatedAt,
        }),
      )
      return savedProduct
    })

    return product
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
      throw new AuthorizationError('Somente gestores podem alterar a unidade.')
    }
  }

  private validateInput(input: ChangeProductUnitInput): void {
    if (!Object.values(ProductUnit).includes(input.targetUnit)) {
      throw new BadRequestError('A unidade do produto é inválida.')
    }
    if (
      !(input.expectedUpdatedAt instanceof Date) ||
      !Number.isFinite(input.expectedUpdatedAt.getTime())
    ) {
      throw new BadRequestError('A versão do produto é inválida.')
    }
  }

  private validateVersion(product: Product, expectedUpdatedAt: Date): void {
    if (product.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new ConflictError('O produto foi alterado. Recarregue e tente novamente.')
    }
  }
}
