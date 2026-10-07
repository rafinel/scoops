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

const browserEnvBase = browserEnvObjectSchema

type BrowserEnvBase = z.infer<typeof browserEnvObjectSchema>

function validateBrowserSentryConfiguration(
  environment: BrowserEnvBase,
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

const browserEnvTelemetrySchema = browserEnvBase
  .extend({
    posthogEnabled: z.string().optional(),
    posthogProjectToken: z
      .string()
      .optional()
      .transform((value) => (value === '' ? undefined : value)),
    posthogApiHost: z
      .string()
      .optional()
      .transform((value) => (value === '' ? undefined : value)),
  })
  .strict()

const enabledPosthogSettings = [
  {
    setting: 'posthogProjectToken',
    isValid: hasProjectToken,
    message: 'VITE_POSTHOG_PROJECT_TOKEN is required when PostHog is enabled.',
  },
  {
    setting: 'posthogApiHost',
    isValid: isExactHttpsOrigin,
    message: 'VITE_POSTHOG_API_HOST must be an exact HTTPS origin.',
  },
] as const

export const browserEnvSchema = browserEnvTelemetrySchema
  .superRefine(validateBrowserSentryConfiguration)
  .superRefine(validateBrowserPosthogConfiguration)
  .transform((environment) => ({
    ...environment,
    posthogEnabled: environment.posthogEnabled === 'true',
  }))

function validateBrowserPosthogConfiguration(
  environment: z.infer<typeof browserEnvTelemetrySchema>,
  context: z.RefinementCtx,
): void {
  if (!isDeployedMode(environment.scoopsWebAppMode)) return

  validatePosthogEnablement(environment.posthogEnabled, context)

  if (environment.posthogEnabled === 'true') {
    validateEnabledPosthogConfiguration(environment, context)
  }
}

function validatePosthogEnablement(
  value: string | undefined,
  context: z.RefinementCtx,
): void {
  validatePosthogSetting(
    value,
    isValidPosthogEnabledSetting,
    context,
    'posthogEnabled',
    'VITE_POSTHOG_ENABLED must be exactly true or false.',
  )
}

function validateEnabledPosthogConfiguration(
  environment: z.infer<typeof browserEnvTelemetrySchema>,
  context: z.RefinementCtx,
): void {
  for (const { setting, isValid, message } of enabledPosthogSettings) {
    validatePosthogSetting(environment[setting], isValid, context, setting, message)
  }
}

function validatePosthogSetting(
  value: string | undefined,
  isValid: (value: string | undefined) => boolean,
  context: z.RefinementCtx,
  setting: 'posthogEnabled' | 'posthogProjectToken' | 'posthogApiHost',
  message: string,
): void {
  if (isValid(value)) return
  context.addIssue({ code: 'custom', path: [setting], message })
}

function isDeployedMode(mode: string): boolean {
  return mode === 'stg' || mode === 'prod'
}

function isValidPosthogEnabledSetting(value: string | undefined): boolean {
  return value === undefined || value === 'true' || value === 'false'
}

function hasProjectToken(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function isExactHttpsOrigin(value: string | undefined): boolean {
  if (typeof value !== 'string') return false
  return isParsedHttpsOrigin(value)
}

function isParsedHttpsOrigin(value: string): boolean {
  try {
    const url = new URL(value)
    return hasExactOriginParts(url) && hasCanonicalOriginValue(value, url)
  } catch {
    return false
  }
}

function hasExactOriginParts(url: URL): boolean {
  return isSecureOrigin(url) && isRootOrigin(url)
}

function isSecureOrigin(url: URL): boolean {
  return url.protocol === 'https:' && !url.username && !url.password
}

function isRootOrigin(url: URL): boolean {
  return url.pathname === '/' && !url.search && !url.hash
}

function hasCanonicalOriginValue(value: string, url: URL): boolean {
  return value === url.origin || value === `${url.origin}/`
}
