export {
  onboardingEmailCorrectionFormSchema,
  onboardingRegistrationFormSchema,
} from '@scoops/validation'

import type { z } from 'zod'

import type {
  onboardingEmailCorrectionFormSchema,
  onboardingRegistrationFormSchema,
} from '@scoops/validation'

export type OnboardingRegistrationFormValues = z.infer<
  typeof onboardingRegistrationFormSchema
>
export type OnboardingEmailCorrectionFormValues = z.infer<
  typeof onboardingEmailCorrectionFormSchema
>
