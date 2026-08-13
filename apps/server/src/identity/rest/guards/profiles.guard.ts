import {
  CanActivate,
  ForbiddenException,
  Inject,
  Injectable,
  type ExecutionContext,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { RequiredProfiles } from '@/identity/decorators'
import type { AuthenticatedRequest } from '@/identity/rest/types/authenticated-request'

@Injectable()
export class ProfilesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredProfiles = this.reflector.getAllAndOverride(RequiredProfiles, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredProfiles) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (requiredProfiles.includes(request.account.profile)) return true

    throw new ForbiddenException({
      error: 'Access denied',
      message: 'Access denied.',
    })
  }
}
