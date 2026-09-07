export const NotificationActorProfile = {
  Manager: 'manager',
  Operator: 'operator',
} as const

export type NotificationActorProfile =
  (typeof NotificationActorProfile)[keyof typeof NotificationActorProfile]

export type NotificationActor = {
  readonly id: string
  readonly establishmentId: string
  readonly profile: NotificationActorProfile
}
