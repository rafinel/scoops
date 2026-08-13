import type { InferSelectModel } from 'drizzle-orm'

import type { userModel } from '@/identity/database/drizzle/models/user-model'

export type DrizzleUser = InferSelectModel<typeof userModel>
