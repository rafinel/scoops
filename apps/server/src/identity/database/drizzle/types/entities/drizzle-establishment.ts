import type { InferSelectModel } from 'drizzle-orm'

import type { establishmentModel } from '@/identity/database/drizzle/models/establishment-model'

export type DrizzleEstablishment = InferSelectModel<typeof establishmentModel>
