import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig(({ command, mode }) => {
  const environment = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const serverProxyUrl = environment.SCOOPS_SERVER_PROXY_URL?.replace(/\/$/, '')
  const webAppMode =
    environment.VITE_SCOOPS_WEB_APP_MODE ?? (mode === 'test' ? 'test' : 'dev')
  const isDeployedMode = webAppMode === 'stg' || webAppMode === 'prod'
  const releaseSha = environment.VITE_SCOOPS_RELEASE_SHA

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
      devtools(),
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
