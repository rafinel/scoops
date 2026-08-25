import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { ProductSettingsDetails } from '#mrp/domain/structures/product-settings-details.ts'
import type { ProductsRepository } from '#mrp/interfaces/products-repository.ts'
import { AuthorizationError, NotFoundError } from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
}

export class GetProductSettingsUseCase
  implements UseCase<Request, ProductSettingsDetails>
{
  constructor(private readonly productsRepository: ProductsRepository) {}

  async execute(request: Request): Promise<ProductSettingsDetails> {
    this.validateActor(request.actor)

    const product = await this.productsRepository.findById(
      request.actor.establishmentId,
      request.productId,
    )
    if (!product || product.establishmentId !== request.actor.establishmentId) {
      throw new NotFoundError('Produto não encontrado.')
    }

    return { product }
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem consultar as configurações.')
    }
  }
}
