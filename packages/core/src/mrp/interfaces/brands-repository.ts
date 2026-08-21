import type { Brand, BrandCreate, BrandUpdate } from '#mrp/domain/entities/brand.ts'

export interface BrandsRepository {
  add(input: BrandCreate): Promise<Brand>
  countByProductId(productId: string): Promise<number>
  findById(productId: string, brandId: string): Promise<Brand | undefined>
  findByName(productId: string, name: string): Promise<Brand | undefined>
  findManyByProductId(productId: string): Promise<readonly Brand[]>
  replace(productId: string, brandId: string, changes: BrandUpdate): Promise<Brand>
  setPrimary(productId: string, brandId: string): Promise<Brand>
  remove(productId: string, brandId: string): Promise<void>
}
