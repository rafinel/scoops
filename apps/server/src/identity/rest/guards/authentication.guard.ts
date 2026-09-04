import {
  CanActivate,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { IdentityDatabase } from '@scoops/core/identity/interfaces'
import { AuthenticationProviderUnavailableError } from '@scoops/core/identity/domain/errors'
import { AuthenticationSessionExpiredError } from '@scoops/core/identity/domain/errors'
import { ResolveAuthenticatedUserUseCase } from '@scoops/core/identity/use-cases'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import { BetterAuthSessionVerifier } from '@/identity/provision/auth'
import type { AuthenticatedRequest } from '@/identity/rest/types/authenticated-request'
import { PUBLIC_ROUTE_METADATA } from '@/shared/rest/decorators/public-route'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly resolveAuthenticatedUserUseCase: ResolveAuthenticatedUserUseCase

  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(IDENTITY_PROVIDERS.betterAuthSessionVerifier)
    private readonly sessionVerifier: BetterAuthSessionVerifier,
    @Inject(IDENTITY_REPOSITORIES.database)
    identityDatabase: IdentityDatabase,
  ) {
    this.resolveAuthenticatedUserUseCase = new ResolveAuthenticatedUserUseCase(
      identityDatabase,
    )
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_METADATA, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    try {
      const verified = await this.sessionVerifier.verify(request.headers, request.res)

      const account = await this.resolveAuthenticatedUserUseCase.execute({
        providerSubject: verified.session.user.id,
      })

      if (!account) throw this.createUnauthorizedException()

      request.account = account
      request.authSession = verified.session
      return true
    } catch (error) {
      if (error instanceof AuthenticationProviderUnavailableError) {
        throw new ServiceUnavailableException({
          error: 'Authentication service unavailable',
          message: 'Try again later.',
        })
      }

      if (error instanceof AuthenticationSessionExpiredError) {
        throw this.createUnauthorizedException()
      }

      throw error
    }
  }

  private createUnauthorizedException() {
    return new UnauthorizedException({
      error: 'Authentication required',
      message: 'Authentication required.',
    })
  }
}
