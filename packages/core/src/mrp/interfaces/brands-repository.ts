import type { Brand, BrandCreate, BrandUpdate } from '#mrp/domain/entities/brand.ts'

export interface BrandsRepository {
  add(input: BrandCreate): Promise<Brand>
  countByProductId(establishmentId: string, productId: string): Promise<number>
  countByProductId(productId: string): Promise<number>
  findById(
    establishmentId: string,
    productId: string,
    brandId: string,
  ): Promise<Brand | undefined>
  findById(productId: string, brandId: string): Promise<Brand | undefined>
  findByName(
    establishmentId: string,
    productId: string,
    name: string,
  ): Promise<Brand | undefined>
  findByName(productId: string, name: string): Promise<Brand | undefined>
  findManyByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<readonly Brand[]>
  findManyByProductId(productId: string): Promise<readonly Brand[]>
  replace(
    establishmentId: string,
    productId: string,
    brandId: string,
    changes: BrandUpdate,
  ): Promise<Brand>
  replace(productId: string, brandId: string, changes: BrandUpdate): Promise<Brand>
  setPrimary(establishmentId: string, productId: string, brandId: string): Promise<Brand>
  setPrimary(productId: string, brandId: string): Promise<Brand>
  remove(establishmentId: string, productId: string, brandId: string): Promise<void>
  remove(productId: string, brandId: string): Promise<void>
  removeAll(): Promise<void>
}
