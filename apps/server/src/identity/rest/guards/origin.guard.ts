import { CanActivate, Inject, Injectable, type ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthenticationOriginRejectedError } from '@scoops/core/identity/domain/errors'

import { getTrustedOrigins } from '@/identity/provision/auth'
import { PUBLIC_ROUTE_METADATA } from '@/shared/rest/decorators/public-route'
import { EnvProvider } from '@/shared/provision/env/env-provider'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

@Injectable()
export class OriginGuard implements CanActivate {
  private readonly trustedOrigins: readonly string[]

  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(EnvProvider) envProvider: EnvProvider,
  ) {
    this.trustedOrigins = getTrustedOrigins(envProvider.get('SCOOPS_WEB_APP_URL'))
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_METADATA, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context
      .switchToHttp()
      .getRequest<{ method: string; headers: { origin?: string } }>()
    if (SAFE_METHODS.has(request.method)) return true
    if (
      typeof request.headers.origin === 'string' &&
      this.trustedOrigins.includes(request.headers.origin)
    ) {
      return true
    }

    throw new AuthenticationOriginRejectedError()
  }
}
