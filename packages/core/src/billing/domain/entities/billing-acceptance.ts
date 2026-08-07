import type { Entity } from '#shared/domain/entities/entity.ts'

export type BillingAcceptance = Entity & {
  establishmentId: string
  userId: string
  termsVersion: string
  privacyVersion: string
  ipAddress: string
  acceptedAt: Date
}

export type BillingAcceptanceCreate = Omit<BillingAcceptance, 'id'>
