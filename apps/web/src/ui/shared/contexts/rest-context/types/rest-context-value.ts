import type { RestClient } from '@scoops/core/shared/interfaces'
import type { IdentityService } from '@scoops/core/identity/interfaces'

export type RestContextValue = {
  restClient: RestClient
  identityService: IdentityService
}
