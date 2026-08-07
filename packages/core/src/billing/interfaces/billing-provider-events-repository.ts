export interface BillingProviderEventsRepository {
  hasProcessed(eventId: string): Promise<boolean>
  markProcessed(eventId: string, occurredAt: Date): Promise<void>
}
