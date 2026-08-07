import type { StockAdjustment } from '#mrp/domain/structures/stock-adjustment.ts'
import type { StockBalance } from '#mrp/domain/structures/stock-balance.ts'

export interface StockBalancesRepository {
  findByProductId(productId: string): Promise<StockBalance | undefined>
  findByProductAndBrand(
    productId: string,
    brandId: string,
  ): Promise<StockBalance | undefined>
  adjust(input: StockAdjustment): Promise<StockBalance>
}
