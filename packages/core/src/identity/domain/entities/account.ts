import type { Entity } from '#shared/domain/entities/entity.ts'
import type { UserProfile } from '#identity/domain/structures/user-profile.ts'

export type Account = Entity & {
  readonly establishmentId: string
  readonly establishmentName: string
  readonly name: string
  readonly email: string
  readonly profile: UserProfile
}
