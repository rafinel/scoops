import type { Account } from '@scoops/core/identity/domain/entities'
import type { AuthSession } from '@scoops/core/identity/domain/structures'
import type { Request } from 'express'

export type AuthenticatedRequest = Request & {
  account: Account
  authSession: AuthSession
}
