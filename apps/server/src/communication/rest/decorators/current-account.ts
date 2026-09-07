import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { Account } from '@scoops/core/identity/domain/entities'

type AccountRequest = { account?: Account }

export const CurrentAccount = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AccountRequest>().account,
)
