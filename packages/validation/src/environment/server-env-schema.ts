import { z } from 'zod'

const serverEnvObjectSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://postgres:postgres@127.0.0.1:54322/postgres'),
  DATABASE_LISTENER_URL: z
    .string()
    .optional()
    .transform((value) => (value === '' ? undefined : value))
    .pipe(z.string().url().optional()),
  PORT: z.coerce.number().int().positive().optional(),
  INNGEST_DEV: z.enum(['0', '1']).default('0'),
  INNGEST_BASE_URL: z
    .string()
    .optional()
    .transform((value) => (value === '' ? undefined : value))
    .pipe(z.string().url().optional()),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  SCOOPS_SERVER_APP_MODE: z.enum(['dev', 'prod', 'stg', 'test']).default('dev'),
  SCOOPS_SERVER_APP_PORT: z.coerce.number().int().positive().default(3336),
  SCOOPS_PDV_PREVIEW_TOKEN_SECRET: z.string().min(32),
  BETTER_AUTH_SECRET: z.string().min(32),
  SCOOPS_SERVER_APP_URL: z.url().default('http://127.0.0.1:3336'),
  SCOOPS_WEB_APP_URL: z.string().url().default('http://127.0.0.1:4000'),
  SCOOPS_EMAIL_PROVIDER: z.enum(['smtp', 'resend']).default('smtp'),
  SMTP_HOST: z.string().default('127.0.0.1'),
  SMTP_PORT: z.coerce.number().int().positive().default(54325),
  RESEND_API_KEY: z.string().optional(),
  SCOOPS_EMAIL_SENDER: z.string().email(),
})

type ServerEnvironment = z.infer<typeof serverEnvObjectSchema>
type EmailProvider = ServerEnvironment['SCOOPS_EMAIL_PROVIDER']

const EMAIL_PROVIDERS_BY_MODE: Record<
  ServerEnvironment['SCOOPS_SERVER_APP_MODE'],
  readonly EmailProvider[]
> = {
  dev: ['smtp', 'resend'],
  prod: ['resend'],
  stg: ['resend'],
  test: ['smtp'],
} as const

function getAllowedEmailProviders(mode: ServerEnvironment['SCOOPS_SERVER_APP_MODE']) {
  return EMAIL_PROVIDERS_BY_MODE[mode]
}

function addValidationIssue(context: z.RefinementCtx, path: string[], message: string) {
  context.addIssue({ code: 'custom', path, message })
}

function validateEmailProvider(environment: ServerEnvironment, context: z.RefinementCtx) {
  const allowedProviders = getAllowedEmailProviders(environment.SCOOPS_SERVER_APP_MODE)
  if (allowedProviders.includes(environment.SCOOPS_EMAIL_PROVIDER)) return

  addValidationIssue(
    context,
    ['SCOOPS_EMAIL_PROVIDER'],
    `Email provider must be one of ${allowedProviders.join(' or ')} for this mode`,
  )
}

function isMissingResendApiKey(environment: ServerEnvironment) {
  return environment.SCOOPS_EMAIL_PROVIDER === 'resend' && !environment.RESEND_API_KEY
}

function validateResendApiKey(environment: ServerEnvironment, context: z.RefinementCtx) {
  if (!isMissingResendApiKey(environment)) return

  addValidationIssue(
    context,
    ['RESEND_API_KEY'],
    'Resend API key is required when Resend is selected',
  )
}

function validateServerEnvironment(
  environment: ServerEnvironment,
  context: z.RefinementCtx,
) {
  validateEmailProvider(environment, context)
  validateResendApiKey(environment, context)
}

export const serverEnvSchema = serverEnvObjectSchema.superRefine(
  validateServerEnvironment,
)
