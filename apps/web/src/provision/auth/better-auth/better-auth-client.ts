import { createAuthClient } from 'better-auth/client'

import { BROWSER_ENV } from '@/constants'

export const betterAuthClient = createAuthClient({
  baseURL: BROWSER_ENV.scoopsServerAppUrl,
  fetchOptions: {
    credentials: 'include',
  },
})
