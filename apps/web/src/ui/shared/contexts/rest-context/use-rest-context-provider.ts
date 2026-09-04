import { BROWSER_ENV } from '@/constants'
import { AxiosRestClient } from '@/rest/axios/axios-rest-client'
import { IdentityService } from '@/rest/services/identity-service'
import { MrpService } from '@/rest/services/mrp-service'
import { PdvService } from '@/rest/services/pdv-service'

import type { RestContextValue } from './types'

export function useRestContextProvider(): RestContextValue {
  const restClient = AxiosRestClient(BROWSER_ENV.scoopsServerAppUrl)

  return {
    restClient,
    identityService: IdentityService(restClient),
    mrpService: MrpService(restClient),
    pdvService: PdvService(restClient),
  }
}
