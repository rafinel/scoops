import {
  CanActivate,
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { AuthIdentityProvider } from '@scoops/core/identity/interfaces'
import type { IdentityDatabase } from '@scoops/core/identity/interfaces'
import { AuthenticationProviderUnavailableError } from '@scoops/core/identity/domain/errors'
import { ResolveAuthenticatedUserUseCase } from '@scoops/core/identity/use-cases'

import { IDENTITY_PROVIDERS, IDENTITY_REPOSITORIES } from '@/identity/constants'
import type { AuthenticatedRequest } from '@/identity/rest/types/authenticated-request'
import { PUBLIC_ROUTE_METADATA } from '@/shared/rest/decorators/public-route'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly resolveAuthenticatedUserUseCase: ResolveAuthenticatedUserUseCase

  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(IDENTITY_PROVIDERS.authIdentity)
    private readonly authIdentityProvider: AuthIdentityProvider,
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
    const accessToken = this.getAccessToken(request)

    if (!accessToken) throw this.createUnauthorizedException()

    try {
      const authUser = await this.authIdentityProvider.verifyAccessToken(accessToken)

      if (!authUser) throw this.createUnauthorizedException()

      const account = await this.resolveAuthenticatedUserUseCase.execute({
        providerSubject: authUser.id,
      })

      if (!account) throw this.createUnauthorizedException()

      request.account = account
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

  private getAccessToken(request: AuthenticatedRequest): string | undefined {
    const authorization = request.headers.authorization

    if (typeof authorization !== 'string') return undefined

    const match = /^Bearer ([^\s]+)$/.exec(authorization)

    return match?.[1]
  }

  private createUnauthorizedException() {
    return new UnauthorizedException({
      error: 'Authentication required',
      message: 'Authentication required.',
    })
  }
}
