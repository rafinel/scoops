import type { Account } from '@scoops/core/identity/domain/entities'
import type { Request } from 'express'

export type AuthenticatedRequest = Request & {
  account: Account
}
