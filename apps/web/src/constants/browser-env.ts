import { browserEnvSchema } from '@scoops/validation'

const BROWSER_ENV_INPUT = {
  scoopsServerAppUrl: alignLoopbackServerAppUrl(
    import.meta.env.VITE_SCOOPS_SERVER_APP_URL ?? getDefaultServerAppUrl(),
  ),
  scoopsServerApiPrefix: import.meta.env.VITE_SCOOPS_SERVER_API_PREFIX ?? '',
  scoopsWebAppMode:
    import.meta.env.VITE_SCOOPS_WEB_APP_MODE ??
    (import.meta.env.MODE === 'test' ? 'test' : 'dev'),
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  scoopsReleaseSha: import.meta.env.VITE_SCOOPS_RELEASE_SHA,
}

function getDefaultServerAppUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3336'

  const hostname = window.location.hostname
  if (!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    return 'http://localhost:3336'
  }

  const formattedHostname = hostname === '::1' ? `[${hostname}]` : hostname
  return `http://${formattedHostname}:3336`
}

function alignLoopbackServerAppUrl(serverAppUrl: string): string {
  if (typeof window === 'undefined') return serverAppUrl

  const url = new URL(serverAppUrl)
  const loopbackHostnames = ['localhost', '127.0.0.1', '::1']
  if (
    !loopbackHostnames.includes(url.hostname) ||
    !loopbackHostnames.includes(window.location.hostname)
  ) {
    return serverAppUrl
  }

  url.hostname = window.location.hostname
  return url.origin
}

export function parseBrowserEnv(
  input: unknown,
): ParsedBrowserEnv | ParsedBrowserEnvWithMonitoring {
  const browserEnvInput = Object(input)
  const hasExplicitMode = 'scoopsWebAppMode' in browserEnvInput
  const environment = browserEnvSchema.parse({
    ...browserEnvInput,
    scoopsWebAppMode: hasExplicitMode
      ? browserEnvInput.scoopsWebAppMode
      : BROWSER_ENV_INPUT.scoopsWebAppMode,
  })
  const url = new URL(environment.scoopsServerAppUrl)
  if (!isValidServerAppUrl(url)) {
    throw new Error(
      'VITE_SCOOPS_SERVER_APP_URL must be an exact HTTP loopback or HTTPS API origin.',
    )
  }

  const parsedEnvironment = {
    scoopsServerAppUrl: url.origin,
    scoopsServerRestUrl: `${url.origin}${environment.scoopsServerApiPrefix}`,
  }

  if (!hasExplicitMode) return parsedEnvironment

  return {
    ...parsedEnvironment,
    scoopsWebAppMode: environment.scoopsWebAppMode,
    sentryDsn: environment.sentryDsn,
    scoopsReleaseSha: environment.scoopsReleaseSha,
  }
}

type ParsedBrowserEnv = {
  scoopsServerAppUrl: string
  scoopsServerRestUrl: string
}

type ParsedBrowserEnvWithMonitoring = ParsedBrowserEnv & {
  scoopsWebAppMode: string
  sentryDsn: string | undefined
  scoopsReleaseSha: string | undefined
}

function isValidServerAppUrl(url: URL): boolean {
  const protocol = ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
    ? 'http:'
    : 'https:'
  return url.protocol === protocol && url.href === `${url.origin}/`
}

export const BROWSER_ENV = parseBrowserEnv(
  BROWSER_ENV_INPUT,
) as ParsedBrowserEnvWithMonitoring
