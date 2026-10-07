import { browserEnvSchema } from '@scoops/validation'

const DEFAULT_SERVER_APP_URL = 'http://localhost:3336'
const LOOPBACK_HOSTNAMES = ['localhost', '127.0.0.1', '::1']

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
  posthogEnabled: import.meta.env.VITE_POSTHOG_ENABLED,
  posthogProjectToken: import.meta.env.VITE_POSTHOG_PROJECT_TOKEN,
  posthogApiHost: import.meta.env.VITE_POSTHOG_API_HOST,
}

function getDefaultServerAppUrl(): string {
  const hostname = getBrowserHostname()
  return isLoopbackHostname(hostname)
    ? `http://${formatHostnameForUrl(hostname)}:3336`
    : DEFAULT_SERVER_APP_URL
}

function alignLoopbackServerAppUrl(serverAppUrl: string): string {
  const browserHostname = getBrowserHostname()
  if (!browserHostname) return serverAppUrl
  return alignServerAppUrlToBrowser(serverAppUrl, browserHostname)
}

function alignServerAppUrlToBrowser(
  serverAppUrl: string,
  browserHostname: string,
): string {
  const url = new URL(serverAppUrl)
  if (!shouldAlignLoopbackHost(url.hostname, browserHostname)) return serverAppUrl
  url.hostname = browserHostname
  return url.origin
}

function getBrowserHostname(): string | undefined {
  return typeof window === 'undefined' ? undefined : window.location.hostname
}

function isLoopbackHostname(hostname: string | undefined): hostname is string {
  return hostname !== undefined && LOOPBACK_HOSTNAMES.includes(hostname)
}

function formatHostnameForUrl(hostname: string): string {
  return hostname === '::1' ? `[${hostname}]` : hostname
}

function shouldAlignLoopbackHost(
  serverHostname: string,
  browserHostname: string,
): boolean {
  return isLoopbackHostname(serverHostname) && isLoopbackHostname(browserHostname)
}

export function parseBrowserEnv(
  input: unknown,
): ParsedBrowserEnv | ParsedBrowserEnvWithMonitoring {
  const browserEnvInput = Object(input)
  const hasExplicitMode = 'scoopsWebAppMode' in browserEnvInput
  const environment = parseEnvironment(browserEnvInput, hasExplicitMode)
  return toParsedBrowserEnv(environment, hasExplicitMode)
}

function assertValidServerAppUrl(url: URL): void {
  if (isValidServerAppUrl(url)) return
  throw new Error(
    'VITE_SCOOPS_SERVER_APP_URL must be an exact HTTP loopback or HTTPS API origin.',
  )
}

function toParsedBrowserEnv(
  environment: ReturnType<typeof parseEnvironment>,
  hasExplicitMode: boolean,
): ParsedBrowserEnv | ParsedBrowserEnvWithMonitoring {
  const { scoopsServerAppUrl, scoopsServerApiPrefix, ...monitoringEnv } = environment
  const url = new URL(scoopsServerAppUrl)
  assertValidServerAppUrl(url)
  const parsedUrls = toParsedServerUrls(url, scoopsServerApiPrefix)
  return hasExplicitMode ? { ...parsedUrls, ...monitoringEnv } : parsedUrls
}

function toParsedServerUrls(url: URL, apiPrefix: string): ParsedBrowserEnv {
  return {
    scoopsServerAppUrl: url.origin,
    scoopsServerRestUrl: `${url.origin}${apiPrefix}`,
  }
}

function parseEnvironment(
  browserEnvInput: Record<string, unknown>,
  hasExplicitMode: boolean,
) {
  const result = browserEnvSchema.safeParse(
    browserEnvironmentInputWithMode(browserEnvInput, hasExplicitMode),
  )
  if (result.success) return result.data
  throwInvalidBrowserEnvironment(result.error.issues)
}

function throwInvalidBrowserEnvironment(
  issues: readonly { path: PropertyKey[] }[],
): never {
  throw new Error(
    `Invalid browser environment configuration: ${formatBrowserEnvironmentIssueNames(issues)}.`,
  )
}

function browserEnvironmentInputWithMode(
  browserEnvInput: Record<string, unknown>,
  hasExplicitMode: boolean,
) {
  return {
    ...browserEnvInput,
    scoopsWebAppMode: hasExplicitMode
      ? browserEnvInput.scoopsWebAppMode
      : BROWSER_ENV_INPUT.scoopsWebAppMode,
  }
}

function formatBrowserEnvironmentIssueNames(
  issues: readonly { path: PropertyKey[] }[],
): string {
  return [...new Set(issues.map(({ path }) => browserSettingName(path[0])))].join(', ')
}

type ParsedBrowserEnv = {
  scoopsServerAppUrl: string
  scoopsServerRestUrl: string
}

type ParsedBrowserEnvWithMonitoring = ParsedBrowserEnv & {
  scoopsWebAppMode: string
  sentryDsn: string | undefined
  scoopsReleaseSha: string | undefined
  posthogEnabled: boolean
  posthogProjectToken: string | undefined
  posthogApiHost: string | undefined
}

const BROWSER_SETTING_NAMES: Readonly<Record<string, string>> = {
  scoopsServerAppUrl: 'VITE_SCOOPS_SERVER_APP_URL',
  scoopsServerApiPrefix: 'VITE_SCOOPS_SERVER_API_PREFIX',
  scoopsWebAppMode: 'VITE_SCOOPS_WEB_APP_MODE',
  sentryDsn: 'VITE_SENTRY_DSN',
  scoopsReleaseSha: 'VITE_SCOOPS_RELEASE_SHA',
  posthogEnabled: 'VITE_POSTHOG_ENABLED',
  posthogProjectToken: 'VITE_POSTHOG_PROJECT_TOKEN',
  posthogApiHost: 'VITE_POSTHOG_API_HOST',
}

function browserSettingName(path: PropertyKey | undefined): string {
  return typeof path === 'string'
    ? (BROWSER_SETTING_NAMES[path] ?? 'browser environment settings')
    : 'browser environment settings'
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
