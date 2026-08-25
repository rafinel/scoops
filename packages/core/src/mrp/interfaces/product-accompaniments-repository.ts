import type { ProductAccompaniment } from '#mrp/domain/entities/product-accompaniment.ts'
import type { ProductAccompanimentCreate } from '#mrp/domain/structures/product-accompaniment-create.ts'
import type { ProductAccompanimentUpdate } from '#mrp/domain/structures/product-accompaniment-update.ts'

export interface ProductAccompanimentsRepository {
  add(input: ProductAccompanimentCreate): Promise<ProductAccompaniment>
  countByTypeId(establishmentId: string, typeId: string): Promise<number>
  findById(
    establishmentId: string,
    productId: string,
    linkId: string,
  ): Promise<ProductAccompaniment | undefined>
  findManyByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<readonly ProductAccompaniment[]>
  countByProductId(establishmentId: string, productId: string): Promise<number>
  findManyByAccompanimentProductId(
    establishmentId: string,
    accompanimentProductId: string,
  ): Promise<readonly ProductAccompaniment[]>
  countByAccompanimentProductId(
    establishmentId: string,
    accompanimentProductId: string,
  ): Promise<number>
  replaceQuantitiesByAccompanimentProductId(
    establishmentId: string,
    accompanimentProductId: string,
    quantities: readonly { linkId: string; quantityPerPortion: number }[],
  ): Promise<void>
  removeByProductId(establishmentId: string, productId: string): Promise<void>
  removeByAccompanimentProductId(
    establishmentId: string,
    accompanimentProductId: string,
  ): Promise<void>
  findByProductAndAccompaniment(
    establishmentId: string,
    productId: string,
    accompanimentProductId: string,
  ): Promise<ProductAccompaniment | undefined>
  replace(
    establishmentId: string,
    productId: string,
    linkId: string,
    changes: ProductAccompanimentUpdate,
  ): Promise<ProductAccompaniment>
  remove(establishmentId: string, productId: string, linkId: string): Promise<void>
  removeAll(): Promise<void>
}
