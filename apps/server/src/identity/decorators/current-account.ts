import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

import type { AuthenticatedRequest } from '@/identity/rest/types/authenticated-request'

export const CurrentAccount = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    return request.account
  },
)
