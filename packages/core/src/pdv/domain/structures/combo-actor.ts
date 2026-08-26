import type { UserProfile } from '#identity/domain/structures/user-profile.ts'

export type ComboActor = {
  readonly establishmentId: string
  readonly profile: UserProfile
}
