import type { Request } from 'express'
import type { AuthUser } from '@scoops/core/identity/domain/structures'

export type PendingAuthenticatedRequest = Request & {
  authUser?: AuthUser
}
