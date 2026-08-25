import type { ResaleConfiguration } from '#mrp/domain/entities/resale-configuration.ts'
import type { ResaleConfigurationCreate } from '#mrp/domain/structures/resale-configuration-create.ts'
import type { ResaleConfigurationUpdate } from '#mrp/domain/structures/resale-configuration-update.ts'

export interface ResaleConfigurationsRepository {
  add(input: ResaleConfigurationCreate): Promise<ResaleConfiguration>
  findById(
    establishmentId: string,
    productId: string,
    configurationId: string,
  ): Promise<ResaleConfiguration | undefined>
  findByProductAndBrand(
    establishmentId: string,
    productId: string,
    brandId?: string,
  ): Promise<ResaleConfiguration | undefined>
  findManyByProductId(
    establishmentId: string,
    productId: string,
  ): Promise<readonly ResaleConfiguration[]>
  countByProductId(establishmentId: string, productId: string): Promise<number>
  replace(
    establishmentId: string,
    productId: string,
    configurationId: string,
    changes: ResaleConfigurationUpdate,
  ): Promise<ResaleConfiguration>
  removeByProductId(establishmentId: string, productId: string): Promise<void>
  removeAll(): Promise<void>
}
