import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { AuthUser } from '@scoops/core/identity/domain/structures'

import type { PendingAuthenticatedRequest } from '@/identity/rest/types/pending-authenticated-request'

export const CurrentAuthUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<PendingAuthenticatedRequest>()
    return request.authUser as AuthUser
  },
)
