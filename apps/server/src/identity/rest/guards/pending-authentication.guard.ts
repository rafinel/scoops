import {
  CanActivate,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common'
import type { AuthIdentityProvider } from '@scoops/core/identity/interfaces'
import { AuthenticationProviderUnavailableError } from '@scoops/core/identity/domain/errors'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import type { PendingAuthenticatedRequest } from '@/identity/rest/types/pending-authenticated-request'

@Injectable()
export class PendingAuthenticationGuard implements CanActivate {
  constructor(
    @Inject(IDENTITY_PROVIDERS.authIdentity)
    private readonly authIdentityProvider: AuthIdentityProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PendingAuthenticatedRequest>()
    const accessToken = this.getAccessToken(request)
    if (!accessToken) throw this.createUnauthorizedException()

    try {
      const authUser = await this.authIdentityProvider.verifyAccessToken(accessToken)
      if (!authUser) throw this.createUnauthorizedException()
      request.authUser = authUser
      return true
    } catch (error) {
      if (error instanceof AuthenticationProviderUnavailableError) {
        throw new ServiceUnavailableException({
          error: 'Authentication service unavailable',
          message: 'Try again later.',
        })
      }
      throw error
    }
  }

  private getAccessToken(request: PendingAuthenticatedRequest): string | undefined {
    const authorization = request.headers.authorization
    if (typeof authorization !== 'string') return undefined
    return /^Bearer ([^\s]+)$/.exec(authorization)?.[1]
  }

  private createUnauthorizedException() {
    return new UnauthorizedException({
      error: 'Authentication required',
      message: 'Authentication required.',
    })
  }
}
