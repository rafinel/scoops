import type { MrpDatabaseRepositories } from '#mrp/interfaces/mrp-database.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import {
  ProductCategory,
  type ProductPricingDetails,
  type RegisterProductSizeInput,
} from '#mrp/domain/structures/index.ts'
import {
  PRODUCT_SIZE_VALIDATION_MESSAGES,
  ProductSizeValidationStrategy,
} from '#mrp/domain/strategies/product-size-validation-strategy.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductSalesConfigurationStrategy } from '#mrp/domain/strategies/product-sales-configuration-strategy.ts'
import { GetProductPricingUseCase } from '#mrp/use-cases/get-product-pricing-use-case.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly input: RegisterProductSizeInput
}

export class RegisterProductSizeUseCase
  implements UseCase<Request, ProductPricingDetails>
{
  private readonly sizeValidation = new ProductSizeValidationStrategy()
  private readonly salesConfiguration = new ProductSalesConfigurationStrategy()

  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductPricingDetails> {
    this.validateActor(request.actor)
    this.validateInput(request.input)

    const result = await this.database.run(async (scope: MrpDatabaseRepositories) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      validatePortionProduct(product, request.actor.establishmentId)

      const sizes = await scope.productSizesRepository.findManyByProductId(
        request.actor.establishmentId,
        product.id,
      )
      const normalizedName = request.input.name.trim()
      if (
        sizes.some((size) => normalizeName(size.name) === normalizeName(normalizedName))
      ) {
        throw new ConflictError('Já existe um tamanho com esse nome para o produto.')
      }

      await scope.productSizesRepository.add({
        establishmentId: request.actor.establishmentId,
        productId: product.id,
        name: normalizedName,
        quantity: request.input.quantity,
        price: request.input.price,
        isActive: true,
      })

      const details = await GetProductPricingUseCase.buildDetails(
        scope,
        request.actor.establishmentId,
        product,
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
      return details
    })
    return result
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
      throw new AuthorizationError('Somente gestores podem adicionar tamanhos.')
    }
  }

  private validateInput(input: RegisterProductSizeInput): void {
    const result = this.sizeValidation.execute(input)
    if (result !== 'valid')
      throw new BadRequestError(PRODUCT_SIZE_VALIDATION_MESSAGES[result])
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

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase()
}
