import { createProductTelemetryEventSchema } from './product-telemetry-event-schema-helpers.ts'
import { z } from 'zod'

const onboardingFieldsSchema = z
  .array(
    z.enum([
      'establishmentName',
      'managerName',
      'email',
      'password',
      'passwordConfirmation',
    ]),
  )
  .min(1)
  .refine((fields) => new Set(fields).size === fields.length)

const onboardingStartedSchema = createProductTelemetryEventSchema(
  {
    event: z.literal('onboarding_started'),
    workflow: z.literal('onboarding'),
    workflow_id: z.string().min(1),
  },
  { hasOptionalContext: true },
)

const onboardingRegistrationCompletedSchema = createProductTelemetryEventSchema(
  {
    event: z.literal('onboarding_registration_completed'),
    workflow: z.literal('onboarding'),
    workflow_id: z.string().min(1),
    attempt: z.number().int().positive(),
    duration_ms: z.number().finite().nonnegative().optional(),
  },
  { hasOptionalContext: true },
)

const emailConfirmationWithoutDurationSchema = createProductTelemetryEventSchema(
  {
    event: z.literal('email_confirmation_completed'),
    workflow: z.literal('onboarding'),
    workflow_id: z.string().min(1).optional(),
  },
  { hasOptionalContext: true },
)

const emailConfirmationWithDurationSchema = createProductTelemetryEventSchema(
  {
    event: z.literal('email_confirmation_completed'),
    workflow: z.literal('onboarding'),
    workflow_id: z.string().min(1),
    duration_ms: z.number().finite().nonnegative().optional(),
  },
  { hasOptionalContext: true },
)

const emailConfirmationSchema = z.union([
  emailConfirmationWithoutDurationSchema,
  emailConfirmationWithDurationSchema,
])

const onboardingValidationFailureSchema = createProductTelemetryEventSchema(
  {
    event: z.literal('workflow_validation_failed'),
    workflow: z.literal('onboarding'),
    workflow_id: z.string().min(1),
    attempt: z.number().int().positive(),
    fields: onboardingFieldsSchema,
  },
  { hasOptionalContext: true },
)

const onboardingBlockSchema = createProductTelemetryEventSchema(
  {
    event: z.literal('workflow_blocked'),
    workflow: z.literal('onboarding'),
    workflow_id: z.string().min(1),
    fields: onboardingFieldsSchema,
    phase: z.literal('validation'),
    failure_code: z.literal('invalid_input'),
  },
  { hasOptionalContext: true },
)

const onboardingSubmissionFailureFields = {
  event: z.literal('workflow_failed'),
  workflow: z.literal('onboarding'),
  phase: z.literal('submission'),
  failure_code: z.enum([
    'invalid_input',
    'dependency_unavailable',
    'unauthorized',
    'forbidden',
    'conflict',
    'rate_limited',
    'network_error',
    'server_error',
    'unknown',
  ]),
  status_class: z.enum(['4xx', '5xx']).optional(),
}

const onboardingSubmissionFailureWithoutAttemptSchema = createProductTelemetryEventSchema(
  {
    ...onboardingSubmissionFailureFields,
    workflow_id: z.string().min(1).optional(),
  },
  { hasOptionalContext: true },
)

const onboardingSubmissionFailureWithAttemptSchema = createProductTelemetryEventSchema(
  {
    ...onboardingSubmissionFailureFields,
    workflow_id: z.string().min(1),
    attempt: z.number().int().positive(),
  },
  { hasOptionalContext: true },
)

const onboardingActivationFailureSchema = createProductTelemetryEventSchema(
  {
    event: z.literal('workflow_failed'),
    workflow: z.literal('onboarding'),
    workflow_id: z.string().min(1).optional(),
    phase: z.literal('account_activation'),
    failure_code: z.enum([
      'unauthorized',
      'forbidden',
      'network_error',
      'server_error',
      'unknown',
    ]),
    status_class: z.enum(['4xx', '5xx']).optional(),
  },
  { hasOptionalContext: true },
)

const onboardingFailureSchema = z.union([
  onboardingSubmissionFailureWithoutAttemptSchema,
  onboardingSubmissionFailureWithAttemptSchema,
  onboardingActivationFailureSchema,
])

export const onboardingTelemetryPayloadSchema = z.union([
  onboardingStartedSchema,
  onboardingRegistrationCompletedSchema,
  emailConfirmationSchema,
  onboardingValidationFailureSchema,
  onboardingBlockSchema,
  onboardingFailureSchema,
])
