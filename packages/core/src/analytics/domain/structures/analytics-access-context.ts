export type AnalyticsAccessContext = {
  readonly establishmentId: string
  readonly establishmentIsActive: boolean
  readonly commercialAccess: 'full' | 'restricted' | 'none'
  readonly timeZone: string
}
