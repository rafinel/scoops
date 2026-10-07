import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { browserEnvSchema } from '../../packages/validation/src/environment/browser-env-schema.ts'

const config = defineConfig(({ command, mode }) => {
  const environment = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const serverProxyUrl = environment.SCOOPS_SERVER_PROXY_URL?.replace(/\/$/, '')
  const webAppMode =
    environment.VITE_SCOOPS_WEB_APP_MODE ?? (mode === 'test' ? 'test' : 'dev')
  const isDeployedMode = webAppMode === 'stg' || webAppMode === 'prod'
  const releaseSha = environment.VITE_SCOOPS_RELEASE_SHA

  const browserEnvironment = browserEnvSchema.safeParse({
    scoopsServerAppUrl: environment.VITE_SCOOPS_SERVER_APP_URL ?? 'http://localhost:3336',
    scoopsServerApiPrefix: environment.VITE_SCOOPS_SERVER_API_PREFIX ?? '',
    scoopsWebAppMode: webAppMode,
    sentryDsn: environment.VITE_SENTRY_DSN,
    scoopsReleaseSha: releaseSha,
    posthogEnabled: environment.VITE_POSTHOG_ENABLED,
    posthogProjectToken: environment.VITE_POSTHOG_PROJECT_TOKEN,
    posthogApiHost: environment.VITE_POSTHOG_API_HOST,
  })

  if (!browserEnvironment.success) {
    const relevantIssues = browserEnvironment.error.issues.filter(
      ({ path }) => path[0] !== 'sentryDsn' && path[0] !== 'scoopsReleaseSha',
    )
    if (relevantIssues.length > 0) {
      const settingNames = new Set(relevantIssues.map(({ path }) => viteSettingName(path[0])))
      throw new Error(
        `Invalid browser build configuration: ${[...settingNames].join(', ')}.`,
      )
    }
  }

  if (isDeployedMode) {
    const missingSettings = [
      ['VITE_SENTRY_DSN', environment.VITE_SENTRY_DSN],
      ['VITE_SCOOPS_RELEASE_SHA', releaseSha],
      ['SENTRY_ORG', environment.SENTRY_ORG],
      ['SENTRY_PROJECT', environment.SENTRY_PROJECT],
      ['SENTRY_AUTH_TOKEN', environment.SENTRY_AUTH_TOKEN],
    ].filter(([, value]) => !value)

    if (missingSettings.length > 0) {
      throw new Error(
        `Deployed Sentry builds require ${missingSettings.map(([name]) => name).join(', ')}.`,
      )
    }

    if (!isValidSentryDsn(environment.VITE_SENTRY_DSN)) {
      throw new Error(
        'VITE_SENTRY_DSN must be a valid HTTPS Sentry DSN in deployed builds.',
      )
    }

    if (!/^[a-f0-9]{40}$/i.test(releaseSha ?? '')) {
      throw new Error(
        'VITE_SCOOPS_RELEASE_SHA must be a full Git commit SHA in deployed builds.',
      )
    }
  }

  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      ...(command === 'serve' && environment.SCOOPS_PLAYWRIGHT_ANALYTICS_FIXTURE === '1'
        ? [analyticsConsumerFixturePlugin()]
        : []),
      devtools({
        consolePiping: {
          enabled: environment.SCOOPS_PLAYWRIGHT_MOCK_SSR_AUTH !== '1',
        },
      }),
      tailwindcss(),
      tanstackStart(),
      ...(command === 'build' && isDeployedMode
        ? [
            sentryTanstackStart({
              org: environment.SENTRY_ORG,
              project: environment.SENTRY_PROJECT,
              authToken: environment.SENTRY_AUTH_TOKEN,
              release: { name: releaseSha },
              sourcemaps: { filesToDeleteAfterUpload: ['**/*.map'] },
              errorHandler: (error) => {
                throw error
              },
              telemetry: false,
            }),
          ]
        : []),
      ...(command === 'build' && mode !== 'test'
        ? [
            nitro({
              sourcemap: isDeployedMode,
              rollupConfig: { external: [/^@sentry\//] },
              ...(serverProxyUrl
                ? {
                    routeRules: {
                      '/api/auth/**': { proxy: `${serverProxyUrl}/api/auth/**` },
                      '/api/server/**': { proxy: `${serverProxyUrl}/**` },
                    },
                  }
                : {}),
            }),
          ]
        : []),
      viteReact(),
    ],
  }
})

export default config

function analyticsConsumerFixturePlugin() {
  const rootLayoutPath = '/src/ui/shared/widgets/layouts/root-layout/index.tsx'
  const fixtureImport =
    "import { AnalyticsConsumerFixture } from '../../../../../../tests/fixtures/analytics-consumer-fixture'"

  return {
    name: 'scoops-playwright-analytics-consumer-fixture',
    enforce: 'pre' as const,
    transform(source: string, id: string) {
      if (!id.split('?')[0]?.endsWith(rootLayoutPath)) return undefined

      const withFixtureImport = source.replace(
        "import { Toaster } from 'sonner'",
        `import { Toaster } from 'sonner'\n${fixtureImport}`,
      )
      const withFixtureConsumer = withFixtureImport.replace(
        '<Toaster',
        '<AnalyticsConsumerFixture />\n                <Toaster',
      )

      if (!withFixtureImport.includes('AnalyticsConsumerFixture')) {
        throw new Error('The opt-in analytics test consumer import could not be added.')
      }
      if (!withFixtureConsumer.includes('<AnalyticsConsumerFixture />')) {
        throw new Error('The opt-in analytics test consumer could not be mounted.')
      }
      return { code: withFixtureConsumer, map: null }
    },
  }
}

function isValidSentryDsn(value: string | undefined): boolean {
  if (!value) return false

  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      Boolean(url.username) &&
      !url.password &&
      url.pathname.length > 1 &&
      !url.search &&
      !url.hash
    )
  } catch {
    return false
  }
}

function viteSettingName(path: PropertyKey | undefined): string {
  switch (path) {
    case 'scoopsServerAppUrl':
      return 'VITE_SCOOPS_SERVER_APP_URL'
    case 'scoopsServerApiPrefix':
      return 'VITE_SCOOPS_SERVER_API_PREFIX'
    case 'scoopsWebAppMode':
      return 'VITE_SCOOPS_WEB_APP_MODE'
    case 'posthogEnabled':
      return 'VITE_POSTHOG_ENABLED'
    case 'posthogProjectToken':
      return 'VITE_POSTHOG_PROJECT_TOKEN'
    case 'posthogApiHost':
      return 'VITE_POSTHOG_API_HOST'
    default:
      return 'browser build settings'
  }
}
