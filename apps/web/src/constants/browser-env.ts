import { browserEnvSchema } from '@scoops/validation'

const BROWSER_ENV_INPUT = {
  scoopsServerAppUrl: alignLoopbackServerAppUrl(
    import.meta.env.VITE_SCOOPS_SERVER_APP_URL ?? getDefaultServerAppUrl(),
  ),
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

export function parseBrowserEnv(input: unknown) {
  const environment = browserEnvSchema.parse(input)
  const url = new URL(environment.scoopsServerAppUrl)
  const isLoopback =
    url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1'

  if (
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    (isLoopback ? url.protocol !== 'http:' : url.protocol !== 'https:')
  ) {
    throw new Error(
      'VITE_SCOOPS_SERVER_APP_URL must be an exact HTTP loopback or HTTPS API origin.',
    )
  }

  return { scoopsServerAppUrl: url.origin }
}

export const BROWSER_ENV = parseBrowserEnv(BROWSER_ENV_INPUT)
