import type { InferSelectModel } from 'drizzle-orm'

import type { establishmentModel } from '@/identity/database/drizzle/models/establishment-model'
import type { EstablishmentTimezone } from '@scoops/core/identity/domain/structures'

export type DrizzleEstablishment = InferSelectModel<typeof establishmentModel>

export const toEstablishmentTimezone = (value: string): EstablishmentTimezone =>
  value as EstablishmentTimezone
