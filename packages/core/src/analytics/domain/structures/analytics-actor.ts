export type AnalyticsActor = {
  readonly userId: string
  readonly establishmentId: string
  readonly profile: 'manager' | 'operator'
}
