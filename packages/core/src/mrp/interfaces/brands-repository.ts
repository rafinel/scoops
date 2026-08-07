import type { Brand, BrandCreate, BrandUpdate } from '#mrp/domain/entities/brand.ts'

export interface BrandsRepository {
  add(input: BrandCreate): Promise<Brand>
  findById(brandId: string): Promise<Brand | undefined>
  findByName(productId: string, name: string): Promise<Brand | undefined>
  findManyByProductId(productId: string): Promise<readonly Brand[]>
  replace(brandId: string, changes: BrandUpdate): Promise<Brand>
  setPrimary(brandId: string): Promise<Brand>
  remove(brandId: string): Promise<void>
}
