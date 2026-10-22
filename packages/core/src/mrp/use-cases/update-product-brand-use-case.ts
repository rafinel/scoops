import type { MrpDatabaseRepositories } from '#mrp/interfaces/mrp-database.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { ProductBrandStock } from '#mrp/domain/structures/product-brand-stock.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import type { UpdateProductBrandInput } from '#mrp/domain/structures/update-product-brand-input.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductSalesConfigurationStrategy } from '#mrp/domain/strategies/product-sales-configuration-strategy.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  actor: ProductActor
  productId: string
  brandId: string
  input: UpdateProductBrandInput
}

export class UpdateProductBrandUseCase implements UseCase<Request, ProductBrandStock> {
  private readonly salesConfiguration = new ProductSalesConfigurationStrategy()

  constructor(private readonly database: MrpDatabase) {}

  async execute(request: Request): Promise<ProductBrandStock> {
    this.validateActor(request.actor)
    this.validateInput(request.input)
    const result = await this.database.run(async (scope: MrpDatabaseRepositories) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      if (!product) throw new NotFoundError('Produto não encontrado.')
      if (product.stockControl !== ProductStockControl.ByBrand)
        throw new BadRequestError('Este produto não utiliza estoque por marca.')
      const brand = await scope.brandsRepository.findById(product.id, request.brandId)
      if (!brand) throw new NotFoundError('Marca não encontrada.')
      const name = request.input.name.trim()
      const duplicate = await scope.brandsRepository.findByName(product.id, name)
      if (duplicate && duplicate.id !== brand.id)
        throw new ConflictError('Já existe uma marca com esse nome para o produto.')
      const savedBrand = await scope.brandsRepository.replace(product.id, brand.id, {
        name,
        unit: request.input.unit ?? brand.unit,
        packageQuantity: request.input.packageQuantity,
        packagePrice: request.input.packageValue,
      })
      const balance = await scope.stockBalancesRepository.findByProductAndBrand(
        product.id,
        brand.id,
      )
      const result = {
        brand: savedBrand,
        stockQuantity: balance?.quantity ?? 0,
        unitPrice: savedBrand.packagePrice / savedBrand.packageQuantity,
      }
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

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem alterar marcas.')
  }

  private validateInput(input: UpdateProductBrandInput): void {
    if (!input.name.trim() || input.name.trim().length > 120)
      throw new BadRequestError('O nome da marca deve possuir entre 1 e 120 caracteres.')
    if (!Number.isFinite(input.packageQuantity) || input.packageQuantity <= 0)
      throw new BadRequestError('A quantidade por embalagem deve ser maior que zero.')
    if (!Number.isFinite(input.packageValue) || input.packageValue < 0)
      throw new BadRequestError('O valor da embalagem não pode ser negativo.')
    if (input.unit !== undefined && !Object.values(ProductUnit).includes(input.unit))
      throw new BadRequestError('A unidade da marca é inválida.')
  }
}
