import type { UserProfile } from '#identity/domain/structures/user-profile.ts'
import type { UserStatus } from '#identity/domain/structures/user-status.ts'

export type UsersListParams = {
  readonly establishmentId: string
  readonly excludeUserId?: string
  readonly search?: string
  readonly profile?: UserProfile
  readonly status?: UserStatus
  readonly page: number
  readonly pageSize: number
}
