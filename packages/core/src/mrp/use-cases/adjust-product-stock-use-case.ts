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
    return this.database.run(async (scope) => {
      const product = await scope.productsRepository.findById(
        request.actor.establishmentId,
        request.productId,
      )
      if (!product) throw new NotFoundError('Produto não encontrado.')
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
        await scope.productsRepository.replace(product.id, {
          currentUnitCost: request.input.currentUnitCost,
        })
      }
      if (product.stockControl === ProductStockControl.ByBrand) {
        if (!request.input.brandId)
          throw new BadRequestError('A marca é obrigatória para este produto.')
        const brand = await scope.brandsRepository.findById(
          product.id,
          request.input.brandId,
        )
        if (!brand) throw new NotFoundError('Marca não encontrada.')
        brandName = brand.name
      }
      const signedQuantity =
        request.input.type === StockAdjustmentType.Entry
          ? request.input.quantity
          : -request.input.quantity
      const balance = await scope.stockBalancesRepository.add(
        { productId: product.id, brandId: request.input.brandId },
        signedQuantity,
        product.allowNegativeStock ? undefined : 0,
      )
      await scope.stockTransactionsRepository.add({
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
        occurredAt: this.datetimeProvider.now(),
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

  private hasAtMostSixDecimalPlaces(value: number): boolean {
    return Math.abs(value * 1_000_000 - Math.round(value * 1_000_000)) < 1e-8
  }
}
