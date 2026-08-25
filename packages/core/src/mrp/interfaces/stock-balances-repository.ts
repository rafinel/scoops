import type { StockBalance } from '#mrp/domain/structures/stock-balance.ts'

export interface StockBalancesRepository {
  initialize(establishmentId: string, productId: string, brandId?: string): Promise<void>
  initialize(productId: string, brandId?: string): Promise<void>
  findByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<StockBalance | undefined>
  findByProductId(productId: string): Promise<StockBalance | undefined>
  findByProductAndBrand(
    establishmentId: string,
    productId: string,
    brandId: string,
  ): Promise<StockBalance | undefined>
  findByProductAndBrand(
    productId: string,
    brandId: string,
  ): Promise<StockBalance | undefined>
  findManyByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<readonly StockBalance[]>
  findManyByProductId(productId: string): Promise<readonly StockBalance[]>
  countByProductId(establishmentId: string, productId: string): Promise<number>
  replaceQuantity(
    establishmentId: string,
    productId: string,
    brandId: string | undefined,
    quantity: number,
  ): Promise<StockBalance>
  add(
    target: Pick<StockBalance, 'productId' | 'brandId'>,
    signedQuantity: number,
    minimumQuantity?: number,
  ): Promise<StockBalance>
  removeAll(): Promise<void>
}
