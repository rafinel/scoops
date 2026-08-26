import type { RestClient } from '@scoops/core/shared/interfaces'
import type { IdentityService } from '@scoops/core/identity/interfaces'
import type { MrpService } from '@scoops/core/mrp/interfaces'

import type { PdvService } from '@/rest/services/pdv-service'

export type RestContextValue = {
  restClient: RestClient
  identityService: IdentityService
  mrpService: MrpService
  pdvService: ReturnType<typeof PdvService>
}
