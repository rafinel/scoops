import type { UserProfile } from '#identity/domain/structures/user-profile.ts'

export type SalesChannelActor = {
  id: string
  establishmentId: string
  profile: UserProfile
}
