import { z } from 'zod'

const BROWSER_ENV_INPUT = {
  scoopsServerAppUrl:
    import.meta.env.VITE_SCOOPS_SERVER_APP_URL ?? 'http://127.0.0.1:3333',
}

export const browserEnvSchema = z.object({
  scoopsServerAppUrl: z.url(),
})

export const BROWSER_ENV = browserEnvSchema.parse(BROWSER_ENV_INPUT)
