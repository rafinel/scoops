import { BROWSER_ENV } from '@/constants'
import { AxiosRestClient } from '@/rest/axios/axios-rest-client'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

import type { RestContextValue } from './types'

export function useRestContextProvider(): RestContextValue {
  const { getSession } = useAuthContext()

  return {
    restClient: AxiosRestClient(BROWSER_ENV.scoopsServerAppUrl, getSession),
  }
}
