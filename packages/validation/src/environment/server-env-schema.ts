import { z } from 'zod'

export const serverEnvSchema = z
  .object({
    DATABASE_URL: z
      .string()
      .url()
      .default('postgresql://postgres:postgres@127.0.0.1:54322/postgres'),
    PORT: z.coerce.number().int().positive().optional(),
    S3_ENDPOINT: z.string().url().default('http://127.0.0.1:9000'),
    INNGEST_DEV: z.enum(['0', '1']).default('0'),
    INNGEST_BASE_URL: z
      .string()
      .transform((value) => (value === '' ? undefined : value))
      .pipe(z.string().url().optional()),
    INNGEST_EVENT_KEY: z.string().optional(),
    INNGEST_SIGNING_KEY: z.string().optional(),
    SCOOPS_SERVER_APP_MODE: z.enum(['dev', 'prod', 'stg', 'test']).default('dev'),
    SCOOPS_SERVER_APP_PORT: z.coerce.number().int().positive().default(3336),
    SCOOPS_PDV_PREVIEW_TOKEN_SECRET: z.string().min(32),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_COOKIE_DOMAIN: z.string().trim().optional(),
    SCOOPS_SERVER_APP_URL: z.url().default('http://127.0.0.1:3336'),
    SCOOPS_WEB_APP_URL: z.string().url().default('http://127.0.0.1:4000'),
    SCOOPS_EMAIL_PROVIDER: z.enum(['smtp', 'resend']).default('smtp'),
    SMTP_HOST: z.string().default('127.0.0.1'),
    SMTP_PORT: z.coerce.number().int().positive().default(54325),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().email(),
  })
  .superRefine((environment, context) => {
    const expectedProvider =
      environment.SCOOPS_SERVER_APP_MODE === 'stg' ||
      environment.SCOOPS_SERVER_APP_MODE === 'prod'
        ? 'resend'
        : 'smtp'
    if (environment.SCOOPS_EMAIL_PROVIDER !== expectedProvider) {
      context.addIssue({
        code: 'custom',
        path: ['SCOOPS_EMAIL_PROVIDER'],
        message: `Email provider must be ${expectedProvider} for this mode`,
      })
    }
    if (expectedProvider === 'resend' && !environment.RESEND_API_KEY) {
      context.addIssue({
        code: 'custom',
        path: ['RESEND_API_KEY'],
        message: 'Resend API key is required for staging and production',
      })
    }
    if (
      (environment.SCOOPS_SERVER_APP_MODE === 'stg' ||
        environment.SCOOPS_SERVER_APP_MODE === 'prod') &&
      !environment.BETTER_AUTH_COOKIE_DOMAIN
    ) {
      context.addIssue({
        code: 'custom',
        path: ['BETTER_AUTH_COOKIE_DOMAIN'],
        message: 'Cookie domain is required outside loopback environments',
      })
    }
  })
