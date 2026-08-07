import type {
  ResaleConfiguration,
  ResaleConfigurationCreate,
  ResaleConfigurationUpdate,
} from '#mrp/domain/entities/resale-configuration.ts'

export interface ResaleConfigurationsRepository {
  add(input: ResaleConfigurationCreate): Promise<ResaleConfiguration>
  findById(configurationId: string): Promise<ResaleConfiguration | undefined>
  findByProductAndBrand(
    productId: string,
    brandId?: string,
  ): Promise<ResaleConfiguration | undefined>
  findManyByProductId(productId: string): Promise<readonly ResaleConfiguration[]>
  replace(
    configurationId: string,
    changes: ResaleConfigurationUpdate,
  ): Promise<ResaleConfiguration>
  remove(configurationId: string): Promise<void>
}
