import type {
  TrialEligibility,
  TrialEligibilityCreate,
} from '#billing/domain/entities/trial-eligibility.ts'

export interface TrialEligibilitiesRepository {
  add(input: TrialEligibilityCreate): Promise<TrialEligibility>
  findByEmailHash(emailHash: string): Promise<TrialEligibility | undefined>
}
