import type { UserProfile } from '#identity/domain/structures/user-profile.ts'

export type ProductActor = {
  readonly id: string
  readonly establishmentId: string
  readonly profile: UserProfile
}
