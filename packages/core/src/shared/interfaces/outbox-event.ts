export type OutboxEvent = {
  id: string
  eventName: string
  payload: Record<string, unknown>
  attempts: number
  reservedBy: string | null
  reservationExpiresAt: Date | null
}
