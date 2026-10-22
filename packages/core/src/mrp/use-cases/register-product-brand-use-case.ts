import type { MrpDatabaseRepositories } from '#mrp/interfaces/mrp-database.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { ProductBrandStock } from '#mrp/domain/structures/product-brand-stock.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import type { RegisterProductBrandInput } from '#mrp/domain/structures/register-product-brand-input.ts'
import { StockAdjustmentType } from '#mrp/domain/structures/stock-adjustment-type.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import { ProductSalesConfigurationChangedEvent } from '#mrp/domain/events/product-sales-configuration-changed-event.ts'
import { ProductSalesConfigurationStrategy } from '#mrp/domain/strategies/product-sales-configuration-strategy.ts'
import {
  AuthorizationError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { PublishProductStockAlertUseCase } from '#mrp/use-cases/publish-product-stock-alert-use-case.ts'

type Request = {
  actor: ProductActor & { readonly name: string }
  productId: string
  input: RegisterProductBrandInput
}

export class RegisterProductBrandUseCase implements UseCase<Request, ProductBrandStock> {
  private readonly salesConfiguration = new ProductSalesConfigurationStrategy()

  constructor(
    private readonly database: MrpDatabase,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<ProductBrandStock> {
    this.validateActor(request.actor)
    this.validateInput(request.input)
    const occurredAt = this.datetimeProvider.now()

    const result = await this.database.run(async (scope: MrpDatabaseRepositories) => {
      const product =
        (await scope.productsRepository.findByIdForUpdate(
          request.actor.establishmentId,
          request.productId,
        )) ??
        (await scope.productsRepository.findById(
          request.actor.establishmentId,
          request.productId,
        ))
      if (!product) throw new NotFoundError('Produto não encontrado.')
      if (product.stockControl !== ProductStockControl.ByBrand) {
        throw new BadRequestError('Este produto não utiliza estoque por marca.')
      }

      const name = request.input.name.trim()
      if (await scope.brandsRepository.findByName(product.id, name)) {
        throw new ConflictError('Já existe uma marca com esse nome para o produto.')
      }

      const isPrimary = (await scope.brandsRepository.countByProductId(product.id)) === 0
      const previousQuantity = await this.findProductQuantity(scope, product.id)
      const brand = await scope.brandsRepository.add({
        productId: product.id,
        name,
        unit: request.input.unit ?? product.unit,
        packageQuantity: request.input.packageQuantity,
        packagePrice: request.input.packageValue,
        isPrimary,
      })
      await scope.stockBalancesRepository.initialize(product.id, brand.id)
      let balance = await scope.stockBalancesRepository.findByProductAndBrand(
        product.id,
        brand.id,
      )

      if (request.input.initialQuantity > 0) {
        balance = await scope.stockBalancesRepository.add(
          { productId: product.id, brandId: brand.id },
          request.input.initialQuantity,
        )
        await scope.stockTransactionsRepository.add({
          establishmentId: request.actor.establishmentId,
          productId: product.id,
          brandId: brand.id,
          productName: product.name,
          brandName: brand.name,
          unit: product.unit,
          type: StockAdjustmentType.Entry,
          quantity: request.input.initialQuantity,
          balanceAfter: balance.quantity,
          performedBy: request.actor.id,
          performedByName: request.actor.name,
          occurredAt,
        })
      }

      await new PublishProductStockAlertUseCase(scope.eventsRepository).execute({
        product,
        previousQuantity,
        availableQuantity: await this.findProductQuantity(scope, product.id),
        occurredAt,
      })

      const result = {
        brand,
        stockQuantity: balance?.quantity ?? 0,
        unitPrice: brand.packagePrice / brand.packageQuantity,
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
    if (actor.profile !== UserProfile.Manager) {
      throw new AuthorizationError('Somente gestores podem registrar marcas.')
    }
  }

  private validateInput(input: RegisterProductBrandInput): void {
    if (!input.name.trim() || input.name.trim().length > 120) {
      throw new BadRequestError('O nome da marca deve possuir entre 1 e 120 caracteres.')
    }
    if (!Number.isFinite(input.packageQuantity) || input.packageQuantity <= 0) {
      throw new BadRequestError('A quantidade por embalagem deve ser maior que zero.')
    }
    if (!Number.isFinite(input.packageValue) || input.packageValue < 0) {
      throw new BadRequestError('O valor da embalagem não pode ser negativo.')
    }
    if (input.unit !== undefined && !Object.values(ProductUnit).includes(input.unit)) {
      throw new BadRequestError('A unidade da marca é inválida.')
    }
    if (!Number.isFinite(input.initialQuantity) || input.initialQuantity < 0) {
      throw new BadRequestError('O estoque inicial não pode ser negativo.')
    }
  }

  private async findProductQuantity(
    scope: MrpDatabaseRepositories,
    productId: string,
  ): Promise<number> {
    const balances = await scope.stockBalancesRepository.findManyByProductId(productId)
    return balances.reduce((total, balance) => total + balance.quantity, 0)
  }
}
