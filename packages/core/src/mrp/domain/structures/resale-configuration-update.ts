import type { ResaleConfiguration } from '#mrp/domain/entities/resale-configuration.ts'

export type ResaleConfigurationUpdate = Pick<ResaleConfiguration, 'price' | 'isActive'>
