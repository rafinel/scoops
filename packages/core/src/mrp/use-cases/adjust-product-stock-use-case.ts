import type { MrpDatabaseRepositories } from '#mrp/interfaces/mrp-database.ts'
import { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { ProductActor } from '#mrp/domain/structures/product-actor.ts'
import type { AdjustProductStockInput } from '#mrp/domain/structures/adjust-product-stock-input.ts'
import { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { StockAdjustmentType } from '#mrp/domain/structures/stock-adjustment-type.ts'
import type { StockBalance } from '#mrp/domain/structures/stock-balance.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import {
  AuthorizationError,
  BadRequestError,
  NotFoundError,
} from '#shared/domain/errors/index.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'
import { PublishProductStockAlertUseCase } from '#mrp/use-cases/publish-product-stock-alert-use-case.ts'

type Request = {
  actor: ProductActor & { readonly name: string }
  productId: string
  input: AdjustProductStockInput
}

export class AdjustProductStockUseCase implements UseCase<Request, StockBalance> {
  constructor(
    private readonly database: MrpDatabase,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<StockBalance> {
    this.validateActor(request.actor)
    this.validateInput(request.input)
    const justification = this.normalizeJustification(request.input.justification)
    const occurredAt = this.datetimeProvider.now()
    return this.database.run(async (scope: MrpDatabaseRepositories) => {
      const {
        productsRepository,
        brandsRepository,
        stockBalancesRepository,
        stockTransactionsRepository,
        eventsRepository,
      } = scope
      const product =
        (await productsRepository.findByIdForUpdate(
          request.actor.establishmentId,
          request.productId,
        )) ??
        (await productsRepository.findById(
          request.actor.establishmentId,
          request.productId,
        ))
      if (!product) throw new NotFoundError('Produto não encontrado.')
      const previousQuantity = await this.findProductQuantity(scope, product.id)
      let brandName: string | undefined
      if (product.stockControl === ProductStockControl.Single && request.input.brandId)
        throw new BadRequestError('Estoque único não aceita uma marca de destino.')
      if (request.input.currentUnitCost !== undefined) {
        if (request.input.type !== StockAdjustmentType.Entry) {
          throw new BadRequestError(
            'O custo unitário atual só pode ser informado em uma entrada.',
          )
        }
        if (
          product.stockControl !== ProductStockControl.Single ||
          !product.categories.includes(ProductCategory.Ingredient)
        ) {
          throw new BadRequestError(
            'O custo unitário atual é permitido apenas para ingredientes de estoque único.',
          )
        }
        await productsRepository.replace(product.id, {
          currentUnitCost: request.input.currentUnitCost,
        })
      }
      if (product.stockControl === ProductStockControl.ByBrand) {
        if (!request.input.brandId)
          throw new BadRequestError('A marca é obrigatória para este produto.')
        const brand = await brandsRepository.findById(product.id, request.input.brandId)
        if (!brand) throw new NotFoundError('Marca não encontrada.')
        brandName = brand.name
      }
      const signedQuantity =
        request.input.type === StockAdjustmentType.Entry
          ? request.input.quantity
          : -request.input.quantity
      const balance = await stockBalancesRepository.add(
        { productId: product.id, brandId: request.input.brandId },
        signedQuantity,
        product.allowNegativeStock ? undefined : 0,
      )
      await stockTransactionsRepository.add({
        establishmentId: request.actor.establishmentId,
        productId: product.id,
        brandId: request.input.brandId,
        productName: product.name,
        brandName,
        unit: product.unit,
        type: request.input.type,
        quantity: request.input.quantity,
        balanceAfter: balance.quantity,
        performedBy: request.actor.id,
        performedByName: request.actor.name,
        occurredAt,
        ...(justification === undefined ? {} : { justification }),
      })
      await new PublishProductStockAlertUseCase(eventsRepository).execute({
        product,
        previousQuantity,
        availableQuantity: await this.findProductQuantity(scope, product.id),
        occurredAt,
      })
      return balance
    })
  }

  private validateActor(actor: ProductActor): void {
    if (actor.profile !== UserProfile.Manager)
      throw new AuthorizationError('Somente gestores podem ajustar o estoque.')
  }

  private validateInput(input: AdjustProductStockInput): void {
    if (!Object.values(StockAdjustmentType).includes(input.type))
      throw new BadRequestError('O tipo de ajuste é inválido.')
    if (!Number.isFinite(input.quantity) || input.quantity <= 0)
      throw new BadRequestError('A quantidade deve ser maior que zero.')
    if (
      input.currentUnitCost !== undefined &&
      (!Number.isFinite(input.currentUnitCost) ||
        input.currentUnitCost < 0 ||
        !this.hasAtMostSixDecimalPlaces(input.currentUnitCost))
    ) {
      throw new BadRequestError('O custo unitário atual é inválido.')
    }
  }

  private normalizeJustification(justification?: string): string | undefined {
    const normalizedJustification = justification?.trim()
    return normalizedJustification || undefined
  }

  private hasAtMostSixDecimalPlaces(value: number): boolean {
    return Math.abs(value * 1_000_000 - Math.round(value * 1_000_000)) < 1e-8
  }

  private async findProductQuantity(
    scope: MrpDatabaseRepositories,
    productId: string,
  ): Promise<number> {
    const balances = await scope.stockBalancesRepository.findManyByProductId(productId)
    return balances.reduce((total, balance) => total + balance.quantity, 0)
  }
}
