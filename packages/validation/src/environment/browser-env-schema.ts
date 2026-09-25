import { z } from 'zod'

const browserEnvObjectSchema = z
  .object({
    scoopsServerAppUrl: z.url(),
    scoopsServerApiPrefix: z.string().regex(/^$|^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/, {
      message: 'O prefixo da API do servidor deve estar vazio ou começar com uma barra.',
    }),
    scoopsWebAppMode: z.enum(['dev', 'test', 'stg', 'prod']),
    sentryDsn: z
      .string()
      .optional()
      .transform((value) => (value === '' ? undefined : value))
      .pipe(z.url().optional()),
    scoopsReleaseSha: z
      .string()
      .optional()
      .transform((value) => (value === '' ? undefined : value))
      .pipe(
        z
          .string()
          .regex(/^[a-f0-9]{40}$/i)
          .optional(),
      ),
  })
  .strict()

export const browserEnvSchema = browserEnvObjectSchema.superRefine(
  validateBrowserSentryConfiguration,
)

function validateBrowserSentryConfiguration(
  environment: z.infer<typeof browserEnvObjectSchema>,
  context: z.RefinementCtx,
) {
  if (!['stg', 'prod'].includes(environment.scoopsWebAppMode)) return

  if (!environment.sentryDsn) {
    context.addIssue({
      code: 'custom',
      path: ['sentryDsn'],
      message: 'Sentry DSN is required in deployed modes',
    })
  }

  if (!environment.scoopsReleaseSha) {
    context.addIssue({
      code: 'custom',
      path: ['scoopsReleaseSha'],
      message: 'A full Git SHA is required in deployed modes',
    })
  }
}
