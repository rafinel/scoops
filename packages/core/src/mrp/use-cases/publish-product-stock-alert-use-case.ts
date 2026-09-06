import type { Product } from '#mrp/domain/entities/product.ts'
import { ProductStockAlertStateEnteredEvent } from '#mrp/domain/events/product-stock-alert-state-entered-event.ts'
import { ProductStockAlertState } from '#mrp/domain/structures/product-stock-alert-state.ts'
import { BadRequestError } from '#shared/domain/errors/bad-request-error.ts'
import type { Broker } from '#shared/interfaces/broker.ts'
import type { UseCase } from '#shared/interfaces/use-case.ts'

type Request = {
  readonly product: Product
  readonly previousQuantity?: number
  readonly availableQuantity: number
  readonly occurredAt: Date
}

export class PublishProductStockAlertUseCase implements UseCase<Request> {
  constructor(private readonly broker: Broker) {}

  async execute(request: Request): Promise<void> {
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

    await this.broker.publish(
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
