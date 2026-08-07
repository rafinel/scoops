import type {
  ProductAccompaniment,
  ProductAccompanimentCreate,
  ProductAccompanimentUpdate,
} from '#mrp/domain/entities/product-accompaniment.ts'

export interface ProductAccompanimentsRepository {
  add(input: ProductAccompanimentCreate): Promise<ProductAccompaniment>
  findById(linkId: string): Promise<ProductAccompaniment | undefined>
  findManyByProductId(productId: string): Promise<readonly ProductAccompaniment[]>
  findByProductAndAccompaniment(
    productId: string,
    accompanimentProductId: string,
  ): Promise<ProductAccompaniment | undefined>
  replace(
    linkId: string,
    changes: ProductAccompanimentUpdate,
  ): Promise<ProductAccompaniment>
  remove(linkId: string): Promise<void>
}
