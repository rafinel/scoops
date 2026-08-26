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
import {
  GetAffectedProductSalesConfigurationsUseCase,
  publishAffectedProductSalesConfigurations,
} from '#mrp/use-cases/get-affected-product-sales-configurations-use-case.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly input: ChangeProductUnitInput
}

export class ChangeProductUnitUseCase implements UseCase<Request, Product> {
  constructor(
    private readonly database: MrpDatabase,
    private readonly broker: Broker,
  ) {}

  async execute(request: Request): Promise<Product> {
    this.validateActor(request.actor)
    this.validateInput(request.input)

    let configurations: readonly import('#mrp/domain/structures/product-sales-configuration.ts').ProductSalesConfiguration[] =
      []
    const product = await this.database.run(async (scope) => {
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
      configurations = await new GetAffectedProductSalesConfigurationsUseCase().execute({
        scope,
        establishmentId: request.actor.establishmentId,
        productId: request.productId,
      })
      return savedProduct
    })

    await publishAffectedProductSalesConfigurations({
      broker: this.broker,
      establishmentId: request.actor.establishmentId,
      productId: request.productId,
      configurations,
    })

    await this.broker.publish(
      new ProductUpdatedEvent({
        productId: product.id,
        establishmentId: product.establishmentId,
        updatedAt: product.updatedAt,
      }),
    )

    return product
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
