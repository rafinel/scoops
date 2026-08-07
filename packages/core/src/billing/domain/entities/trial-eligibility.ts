import type { Entity } from '#shared/domain/entities/entity.ts'

export type TrialEligibility = Entity & {
  emailHash: string
  establishmentId: string
  startedAt: Date
  endsAt: Date
  createdAt: Date
}

export type TrialEligibilityCreate = Omit<TrialEligibility, 'id' | 'createdAt'>
