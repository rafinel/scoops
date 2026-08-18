import type { RestClient } from '@scoops/core/shared/interfaces'
import type { IdentityService } from '@scoops/core/identity/interfaces'
import type { MrpService } from '@scoops/core/mrp/interfaces'

export type RestContextValue = {
  restClient: RestClient
  identityService: IdentityService
  mrpService: MrpService
}
