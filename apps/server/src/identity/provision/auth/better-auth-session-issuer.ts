import { Inject, Injectable } from '@nestjs/common'
import { getCookies } from 'better-auth/cookies'
import { serializeSignedCookie, type CookieOptions } from 'better-call'
import type { Response } from 'express'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import type { BetterAuthInstance } from '@/identity/provision/auth/better-auth'

@Injectable()
export class BetterAuthSessionIssuer {
  constructor(
    @Inject(IDENTITY_PROVIDERS.betterAuth)
    private readonly auth: BetterAuthInstance,
  ) {}

  async issueForUser(providerSubject: string, response: Response): Promise<void> {
    const context = await this.auth.$context
    const session = await context.internalAdapter.createSession(providerSubject)
    const cookie = getCookies(this.auth.options).sessionToken
    const attributes = {
      ...cookie.attributes,
      sameSite: cookie.attributes.sameSite.toLowerCase() as 'lax' | 'strict' | 'none',
    } as CookieOptions
    const value = await serializeSignedCookie(
      cookie.name,
      session.token,
      context.secret,
      attributes,
    )
    response.setHeader('Set-Cookie', value)
  }

  expireSession(response: Response): void {
    const cookie = getCookies(this.auth.options).sessionToken
    response.clearCookie(cookie.name, {
      path: cookie.attributes.path,
      ...(cookie.attributes.domain ? { domain: cookie.attributes.domain } : {}),
      httpOnly: cookie.attributes.httpOnly,
      secure: cookie.attributes.secure,
      sameSite: cookie.attributes.sameSite.toLowerCase() as 'lax' | 'strict' | 'none',
      maxAge: 0,
    })
  }
}
