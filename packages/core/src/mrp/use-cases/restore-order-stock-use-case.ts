import type { OrderStockRestoration as Restoration } from '#mrp/domain/structures/order-stock-restoration.ts'
import type { OrderStockRestorationRequest } from '#mrp/domain/structures/order-stock-restoration-request.ts'
import { StockTransactionType } from '#mrp/domain/structures/stock-transaction-type.ts'
import type { MrpDatabase } from '#mrp/interfaces/mrp-database.ts'
import { BadRequestError } from '#shared/domain/errors/index.ts'
export class RestoreOrderStockUseCase {
  constructor(private readonly database: MrpDatabase) {}

  async execute(input: OrderStockRestorationRequest): Promise<readonly Restoration[]> {
    if (input.targets.length === 0)
      throw new BadRequestError('Informe ao menos um consumo para devolver ao estoque.')
    return this.database.run(async (repositories) => {
      const products = new Map<
        string,
        import('#mrp/domain/entities/product.ts').Product
      >()
      for (const productId of [
        ...new Set(input.targets.map((target) => target.productId)),
      ].sort()) {
        const product = await repositories.productsRepository.findByIdForUpdate(
          input.establishmentId,
          productId,
        )
        if (product?.establishmentId === input.establishmentId)
          products.set(productId, product)
      }
      const results: Restoration[] = []
      for (const target of input.targets) {
        const product = products.get(target.productId)
        if (!product) {
          results.push({ ...target, outcome: 'skipped' })
          continue
        }
        const brand = target.brandId
          ? await repositories.brandsRepository.findById(
              input.establishmentId,
              product.id,
              target.brandId,
            )
          : undefined
        if (target.brandId && !brand) {
          results.push({ ...target, outcome: 'skipped' })
          continue
        }
        const balance = await repositories.stockBalancesRepository.add(
          {
            productId: product.id,
            ...(target.brandId ? { brandId: target.brandId } : {}),
          },
          target.quantity,
        )
        await repositories.stockTransactionsRepository.add({
          establishmentId: input.establishmentId,
          productId: product.id,
          ...(target.brandId
            ? { brandId: target.brandId, brandName: target.brandName }
            : {}),
          orderId: input.orderId,
          productName: target.productName,
          unit: product.unit,
          type: StockTransactionType.SaleCancellation,
          quantity: target.quantity,
          balanceAfter: balance.quantity,
          performedBy: input.performedBy,
          performedByName: input.performedByName,
          occurredAt: input.occurredAt,
        })
        results.push({ ...target, outcome: 'restored' })
      }
      return results
    })
  }
}
