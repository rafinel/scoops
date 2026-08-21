import type { StockBalance } from '#mrp/domain/structures/stock-balance.ts'

export interface StockBalancesRepository {
  initialize(productId: string, brandId?: string): Promise<void>
  findByProductId(productId: string): Promise<StockBalance | undefined>
  findByProductAndBrand(
    productId: string,
    brandId: string,
  ): Promise<StockBalance | undefined>
  findManyByProductId(productId: string): Promise<readonly StockBalance[]>
  add(
    target: Pick<StockBalance, 'productId' | 'brandId'>,
    signedQuantity: number,
    minimumQuantity?: number,
  ): Promise<StockBalance>
}
