import { browserEnvSchema } from '@scoops/validation'

const BROWSER_ENV_INPUT = {
  scoopsServerAppUrl:
    import.meta.env.VITE_SCOOPS_SERVER_APP_URL ?? 'http://127.0.0.1:3336',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'public-anon-key',
}

export const BROWSER_ENV = browserEnvSchema.parse(BROWSER_ENV_INPUT)
