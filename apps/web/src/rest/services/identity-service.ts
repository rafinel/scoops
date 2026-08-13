import type { Account } from '@scoops/core/identity/domain/entities'
import type { IdentityService as IdentityRestService } from '@scoops/core/identity/interfaces'
import type { RestClient } from '@scoops/core/shared/interfaces'

export const IdentityService = (restClient: RestClient): IdentityRestService => {
  return {
    getAccount() {
      return restClient.get<Account>('/auth/session')
    },
  }
}
