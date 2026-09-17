import type { Product } from '#mrp/domain/entities/product.ts'
import { ProductStockAlertStateEnteredEvent } from '#mrp/domain/events/product-stock-alert-state-entered-event.ts'
import type { OrderStockConsumption } from '#mrp/domain/structures/order-stock-consumption.ts'
import { ProductStockAlertState } from '#mrp/domain/structures/product-stock-alert-state.ts'
import { ProductStockControl } from '#mrp/domain/structures/product-stock-control.ts'
import { StockTransactionType } from '#mrp/domain/structures/stock-transaction-type.ts'
import type {
  MrpDatabase,
  MrpDatabaseRepositories,
} from '#mrp/interfaces/mrp-database.ts'
import { BadRequestError } from '#shared/domain/errors/bad-request-error.ts'
import { ConflictError } from '#shared/domain/errors/conflict-error.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

export class ConsumeOrderStockUseCase implements UseCase<OrderStockConsumption> {
  constructor(private readonly database: MrpDatabase) {}

  async execute(input: OrderStockConsumption): Promise<void> {
    return this.database.run(async (repositories) => {
      const productIds = [
        ...new Set(input.consumptions.map(({ productId }) => productId)),
      ].sort()
      const products = new Map<string, Product>()
      const previousQuantities = new Map<string, number>()
      for (const productId of productIds) {
        const product = await repositories.productsRepository.findByIdForUpdate(
          input.establishmentId,
          productId,
        )
        if (!product || product.establishmentId !== input.establishmentId)
          throw new ConflictError('O estoque do pedido não está mais disponível.')
        products.set(productId, product)
        previousQuantities.set(productId, await this.quantity(repositories, productId))
      }

      for (const consumption of input.consumptions) {
        const product = products.get(consumption.productId)
        if (!product)
          throw new ConflictError('O estoque do pedido não está mais disponível.')
        if (
          (product.stockControl === ProductStockControl.Single && consumption.brandId) ||
          (product.stockControl === ProductStockControl.ByBrand && !consumption.brandId)
        )
          throw new ConflictError('A configuração de estoque do pedido foi alterada.')
        const brand = consumption.brandId
          ? await repositories.brandsRepository.findById(
              input.establishmentId,
              product.id,
              consumption.brandId,
            )
          : undefined
        if (consumption.brandId && !brand)
          throw new ConflictError('A marca do pedido não está mais disponível.')
        const balance = await repositories.stockBalancesRepository.add(
          {
            productId: product.id,
            ...(consumption.brandId ? { brandId: consumption.brandId } : {}),
          },
          -consumption.quantity,
          0,
        )
        await repositories.stockTransactionsRepository.add({
          establishmentId: input.establishmentId,
          productId: product.id,
          ...(consumption.brandId
            ? { brandId: consumption.brandId, brandName: brand?.name }
            : {}),
          orderId: input.orderId,
          productName: product.name,
          unit: product.unit,
          type: StockTransactionType.Sale,
          quantity: consumption.quantity,
          balanceAfter: balance.quantity,
          performedBy: input.performedBy,
          performedByName: input.performedByName,
          occurredAt: input.occurredAt,
        })
      }

      for (const productId of productIds) {
        const product = products.get(productId)
        if (product)
          await this.publishStockAlert(repositories, {
            product,
            previousQuantity: previousQuantities.get(productId),
            availableQuantity: await this.quantity(repositories, productId),
            occurredAt: input.occurredAt,
          })
      }
    })
  }

  private async quantity(
    repositories: MrpDatabaseRepositories,
    productId: string,
  ): Promise<number> {
    const balances =
      await repositories.stockBalancesRepository.findManyByProductId(productId)
    return balances.reduce((total, balance) => total + balance.quantity, 0)
  }

  private async publishStockAlert(
    repositories: MrpDatabaseRepositories,
    request: {
      readonly product: Product
      readonly previousQuantity?: number
      readonly availableQuantity: number
      readonly occurredAt: Date
    },
  ): Promise<void> {
    this.validateQuantity(request.previousQuantity, 'previousQuantity')
    this.validateQuantity(request.availableQuantity, 'availableQuantity')
    this.validateIdealQuantity(request.product.idealStock)

    const nextState = this.classify(request.product.idealStock, request.availableQuantity)
    if (nextState === ProductStockAlertState.Normal) return

    const previousState =
      request.previousQuantity === undefined
        ? undefined
        : this.classify(request.product.idealStock, request.previousQuantity)
    if (
      previousState !== undefined &&
      !this.isEmittingTransition(previousState, nextState)
    )
      return

    await repositories.eventsRepository.add(
      new ProductStockAlertStateEnteredEvent({
        establishmentId: request.product.establishmentId,
        productId: request.product.id,
        productName: request.product.name,
        unit: request.product.unit,
        state: nextState,
        availableQuantity: request.availableQuantity,
        ...(request.product.idealStock === undefined
          ? {}
          : { idealQuantity: request.product.idealStock }),
        occurredAt: request.occurredAt,
      }),
    )
  }

  private classify(
    idealQuantity: number | undefined,
    availableQuantity: number,
  ): ProductStockAlertState {
    if (availableQuantity <= 0) return ProductStockAlertState.Zero
    if (idealQuantity !== undefined && availableQuantity < idealQuantity)
      return ProductStockAlertState.BelowIdeal
    return ProductStockAlertState.Normal
  }

  private isEmittingTransition(
    previousState: ProductStockAlertState,
    nextState: ProductStockAlertState,
  ): boolean {
    return (
      (previousState === ProductStockAlertState.Normal &&
        (nextState === ProductStockAlertState.BelowIdeal ||
          nextState === ProductStockAlertState.Zero)) ||
      (previousState === ProductStockAlertState.BelowIdeal &&
        nextState === ProductStockAlertState.Zero)
    )
  }

  private validateQuantity(value: number | undefined, field: string): void {
    if (value !== undefined && !Number.isFinite(value))
      throw new BadRequestError(`A quantidade ${field} deve ser finita.`)
  }

  private validateIdealQuantity(value: number | undefined): void {
    if (value !== undefined && (!Number.isFinite(value) || value < 0))
      throw new BadRequestError('O estoque ideal deve ser finito e não negativo.')
  }
}
