import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { Product } from '#mrp/domain/entities/product.ts'
import type { ResaleConfiguration } from '#mrp/domain/entities/resale-configuration.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import { ResalePriceValidationStrategy } from '#mrp/domain/strategies/resale-price-validation-strategy.ts'
import {
  ProductCategory,
  ProductStockControl,
  type ProductPricingDetails,
  type SaveProductResaleConfigurationInput,
} from '#mrp/domain/structures/index.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductSalesConfigurationStrategy } from '#mrp/domain/strategies/product-sales-configuration-strategy.ts'
import { GetProductPricingUseCase } from '#mrp/use-cases/get-product-pricing-use-case.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly actor: ProductActor
  readonly productId: string
  readonly brandId?: string
  readonly input: SaveProductResaleConfigurationInput
}

export class SaveProductResaleConfigurationUseCase
  implements UseCase<Request, ProductPricingDetails>
{
  private readonly resalePriceValidation = new ResalePriceValidationStrategy()
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
      validateResaleProduct(product, request.actor.establishmentId)

      if (product.stockControl === ProductStockControl.Single) {
        if (request.brandId !== undefined) {
          throw new BadRequestError('O produto de estoque único não possui marcas.')
        }

        const existing = await scope.resaleConfigurationsRepository.findByProductAndBrand(
          request.actor.establishmentId,
          product.id,
        )
        await this.saveConfiguration(scope, request, product, existing)
      } else if (product.stockControl === ProductStockControl.ByBrand) {
        if (request.brandId === undefined) {
          throw new BadRequestError('Informe a marca da configuração de revenda.')
        }

        const brand = await scope.brandsRepository.findById(product.id, request.brandId)
        if (!brand || brand.productId !== product.id) {
          throw new NotFoundError('Marca não encontrada.')
        }

        const existing = await scope.resaleConfigurationsRepository.findByProductAndBrand(
          request.actor.establishmentId,
          product.id,
          brand.id,
        )
        await this.saveConfiguration(scope, request, product, existing, brand.id)
      } else {
        throw new BadRequestError('O controle de estoque do produto não é suportado.')
      }

      const result = await GetProductPricingUseCase.buildDetails(
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
      return result
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

  private async saveConfiguration(
    scope: MrpDatabaseRepositories,
    request: Request,
    product: Product,
    existing: ResaleConfiguration | undefined,
    brandId?: string,
  ): Promise<void> {
    if (
      existing &&
      (existing.establishmentId !== request.actor.establishmentId ||
        existing.productId !== product.id ||
        existing.brandId !== brandId)
    ) {
      throw new NotFoundError('Configuração de revenda não encontrada.')
    }

    if (existing) {
      await scope.resaleConfigurationsRepository.replace(
        request.actor.establishmentId,
        product.id,
        existing.id,
        {
          price: request.input.price,
          isActive: request.input.isActive,
        },
      )
      return
    }

    await scope.resaleConfigurationsRepository.add({
      establishmentId: request.actor.establishmentId,
      productId: product.id,
      ...(brandId ? { brandId } : {}),
      price: request.input.price,
      isActive: request.input.isActive,
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem salvar preços de revenda.')
    }
  }

  private validateInput(input: SaveProductResaleConfigurationInput): void {
    if (!this.resalePriceValidation.execute(input.price)) {
      throw new BadRequestError(
        'O preço deve ser não negativo e possuir até duas casas decimais.',
      )
    }
    if (typeof input.isActive !== 'boolean') {
      throw new BadRequestError('O status da configuração é obrigatório.')
    }
  }
}

function validateResaleProduct(
  product: Product | undefined,
  establishmentId: string,
): asserts product is Product {
  if (!product || product.establishmentId !== establishmentId) {
    throw new NotFoundError('Produto não encontrado.')
  }
  if (!product.categories.includes(ProductCategory.Resale)) {
    throw new BadRequestError('O produto não é uma revenda.')
  }
  if (product.categories.includes(ProductCategory.Portion)) {
    throw new BadRequestError('Porção e Revenda não podem ser usadas juntas.')
  }
}
