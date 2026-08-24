import type { ResaleConfiguration } from '#mrp/domain/entities/resale-configuration.ts'

export type ResaleConfigurationCreate = Omit<
  ResaleConfiguration,
  'id' | 'createdAt' | 'updatedAt'
>
