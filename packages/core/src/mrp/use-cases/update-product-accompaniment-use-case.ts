import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductAccompanimentDetails } from '#mrp/domain/structures/product-accompaniment-details.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { UpdateProductAccompanimentInput } from '#mrp/domain/structures/update-product-accompaniment-input.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import {
  GetAffectedProductSalesConfigurationsUseCase,
  publishAffectedProductSalesConfigurations,
} from '#mrp/use-cases/get-affected-product-sales-configurations-use-case.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import { GetProductAccompanimentsUseCase } from '#mrp/use-cases/get-product-accompaniments-use-case.ts'
import { validateQuantity } from '#mrp/use-cases/link-product-accompaniment-use-case.ts'
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
  readonly input: UpdateProductAccompanimentInput
}

export class UpdateProductAccompanimentUseCase
  implements UseCase<Request, ProductAccompanimentDetails>
{
  constructor(
    private readonly database: MrpDatabase,
    private readonly broker?: Broker,
  ) {}

  async execute(request: Request): Promise<ProductAccompanimentDetails> {
    this.validateActor(request.actor)
    validateQuantity(request.input.quantityPerPortion)

    let configurations: readonly import('#mrp/domain/structures/product-sales-configuration.ts').ProductSalesConfiguration[] =
      []
    const result = await this.database.run(async (scope) => {
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
      const type = await scope.accompanimentTypesRepository.findById(
        request.actor.establishmentId,
        request.input.accompanimentTypeId,
      )
      if (!type || type.establishmentId !== request.actor.establishmentId) {
        throw new NotFoundError('Tipo de acompanhamento não encontrado.')
      }
      const updated = await scope.productAccompanimentsRepository.replace(
        request.actor.establishmentId,
        owner.id,
        link.id,
        {
          accompanimentTypeId: type.id,
          quantityPerPortion: request.input.quantityPerPortion,
        },
      )
      configurations = await new GetAffectedProductSalesConfigurationsUseCase().execute({
        scope,
        establishmentId: request.actor.establishmentId,
        productId: request.productId,
      })
      return GetProductAccompanimentsUseCase.buildDetails(
        scope,
        request.actor.establishmentId,
        updated,
      )
    })
    await publishAffectedProductSalesConfigurations({
      broker: this.broker,
      establishmentId: request.actor.establishmentId,
      productId: request.productId,
      configurations,
    })
    return result
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem editar acompanhamentos.')
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
