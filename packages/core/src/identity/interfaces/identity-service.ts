import type { Account } from '#identity/domain/entities/account.ts'
import type { RestResponse } from '#shared/responses/rest-response.ts'

export interface IdentityService {
  getAccount(): Promise<RestResponse<Account>>
}
