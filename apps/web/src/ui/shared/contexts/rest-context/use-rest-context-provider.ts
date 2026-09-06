import { useMemo } from 'react'

import { BROWSER_ENV } from '@/constants'
import { AxiosRestClient } from '@/rest/axios/axios-rest-client'
import { createCommunicationService } from '@/rest/services/communication-service'
import { IdentityService } from '@/rest/services/identity-service'
import { MrpService } from '@/rest/services/mrp-service'
import { PdvService } from '@/rest/services/pdv-service'

import type { RestContextValue } from './types'

export function useRestContextProvider(): RestContextValue {
  const restClient = useMemo(() => AxiosRestClient(BROWSER_ENV.scoopsServerRestUrl), [])

  return useMemo(
    () => ({
      restClient,
      identityService: IdentityService(restClient),
      mrpService: MrpService(restClient),
      pdvService: PdvService(restClient),
      communicationService: createCommunicationService(restClient),
    }),
    [restClient],
  )
}
