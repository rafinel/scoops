import { Inject, Injectable } from '@nestjs/common'
import { getCookies } from 'better-auth/cookies'
import { fromNodeHeaders } from 'better-auth/node'
import {
  AuthenticationProviderUnavailableError,
  AuthenticationSessionExpiredError,
} from '@scoops/core/identity/domain/errors'
import type { AuthSession, AuthUser } from '@scoops/core/identity/domain/structures'
import type { Response } from 'express'
import type { IncomingHttpHeaders } from 'node:http'

import { IDENTITY_PROVIDERS } from '@/identity/constants'
import type { BetterAuthInstance } from '@/identity/provision/auth/better-auth'

const ABSOLUTE_SESSION_MS = 7 * 24 * 60 * 60 * 1000
const ALLOWED_SET_COOKIE_ATTRIBUTES = new Set([
  'domain',
  'expires',
  'httponly',
  'max-age',
  'path',
  'samesite',
  'secure',
])

type ParsedSetCookie = {
  nameValue: string
  attributes: Map<string, string | true>
}

export type VerifiedBetterAuthSession = {
  session: AuthSession
  token: string
}

@Injectable()
export class BetterAuthSessionVerifier {
  constructor(
    @Inject(IDENTITY_PROVIDERS.betterAuth)
    private readonly auth: BetterAuthInstance,
  ) {}

  async verify(
    headers: IncomingHttpHeaders,
    response?: Response,
  ): Promise<VerifiedBetterAuthSession> {
    const cookie = getCookies(this.auth.options).sessionToken
    this.assertConfiguredCookieContract(cookie)
    const cookieName = cookie.name
    const cookieHeader = this.getContractCookie(headers.cookie, cookieName)
    if (!cookieHeader) throw new AuthenticationSessionExpiredError()

    try {
      const result = await this.auth.api.getSession({
        headers: fromNodeHeaders(headers),
        query: { disableCookieCache: true },
        returnHeaders: true,
      })
      const data = result.response
      if (!data) throw new AuthenticationSessionExpiredError()

      const createdAt = new Date(data.session.createdAt)
      const expiresAt = new Date(data.session.expiresAt)
      const absoluteExpiresAt = new Date(createdAt.getTime() + ABSOLUTE_SESSION_MS)
      if (
        Date.now() >= absoluteExpiresAt.getTime() ||
        Date.now() >= expiresAt.getTime()
      ) {
        await this.revoke(cookieHeader)
        throw new AuthenticationSessionExpiredError()
      }

      this.forwardSafeCookies(result.headers, response, cookie)
      return {
        token: cookieHeader,
        session: {
          sessionId: data.session.id,
          user: this.toAuthUser(data.user),
          createdAt,
          expiresAt,
          absoluteExpiresAt,
        },
      }
    } catch (error) {
      if (
        error instanceof AuthenticationSessionExpiredError ||
        error instanceof AuthenticationProviderUnavailableError
      ) {
        throw error
      }
      throw new AuthenticationProviderUnavailableError()
    }
  }

  private async revoke(token: string) {
    const context = await this.auth.$context
    await context.internalAdapter.deleteSession(token)
  }

  private getContractCookie(cookieHeader: string | undefined, cookieName: string) {
    if (!cookieHeader) return undefined
    const entries = cookieHeader.split(';').map((part) => {
      const separator = part.trim().indexOf('=')
      const value = part.trim()
      return separator < 0
        ? [value, '']
        : [value.slice(0, separator), value.slice(separator + 1)]
    })
    const matches = entries.filter(([name]) => name === cookieName)
    if (matches.length !== 1) return undefined
    return matches[0]?.[1]
  }

  private forwardSafeCookies(
    headers: Headers,
    response: Response | undefined,
    cookie: ReturnType<typeof getCookies>['sessionToken'],
  ) {
    const values =
      typeof headers.getSetCookie === 'function'
        ? headers.getSetCookie()
        : (headers.get('set-cookie')?.split(/,(?=\s*[^;,=]+=[^;,]+)/) ?? [])
    const safe = values.filter((value) => {
      const name = value.trimStart().slice(0, value.indexOf('='))
      return name === cookie.name
    })
    if (safe.length > 1 || safe.some((value) => !this.isValidSetCookie(value, cookie))) {
      throw new AuthenticationProviderUnavailableError()
    }
    if (response && safe.length) response.setHeader('Set-Cookie', safe)
  }

  private assertConfiguredCookieContract(
    cookie: ReturnType<typeof getCookies>['sessionToken'],
  ) {
    const attributes = cookie.attributes as Record<string, unknown>
    const hostname = new URL(this.auth.options.baseURL).hostname
    const isLoopback = ['localhost', '127.0.0.1', '::1'].includes(hostname)
    if (
      attributes.path !== '/' ||
      attributes.httpOnly !== true ||
      attributes.sameSite !== 'lax' ||
      attributes.secure !== !isLoopback ||
      attributes.domain !== undefined
    ) {
      throw new AuthenticationProviderUnavailableError()
    }
  }

  private isValidSetCookie(
    value: string,
    cookie: ReturnType<typeof getCookies>['sessionToken'],
  ): boolean {
    const parsedCookie = this.parseSetCookie(value, cookie.name)
    if (!parsedCookie || !this.hasValidLifetime(parsedCookie.attributes)) return false

    return this.matchesCookieContract(parsedCookie, cookie)
  }

  private parseSetCookie(value: string, cookieName: string): ParsedSetCookie | undefined {
    const [nameValue, ...attributeParts] = value.split(';').map((part) => part.trim())
    const separator = nameValue?.indexOf('=') ?? -1
    if (separator <= 0 || nameValue.slice(0, separator) !== cookieName) return undefined

    const attributes = this.parseSetCookieAttributes(attributeParts)
    if (!attributes) return undefined

    return { nameValue, attributes }
  }

  private parseSetCookieAttributes(
    parts: string[],
  ): Map<string, string | true> | undefined {
    const attributes = new Map<string, string | true>()
    for (const part of parts) {
      if (!part) return undefined
      const separator = part.indexOf('=')
      const name = (separator === -1 ? part : part.slice(0, separator)).toLowerCase()
      const attributeValue = separator === -1 ? true : part.slice(separator + 1)
      if (!name || attributes.has(name) || !ALLOWED_SET_COOKIE_ATTRIBUTES.has(name))
        return undefined
      attributes.set(name, attributeValue)
    }
    return attributes
  }

  private hasValidLifetime(attributes: Map<string, string | true>): boolean {
    const expires = attributes.get('expires')
    const maxAge = attributes.get('max-age')
    return (
      (expires === undefined ||
        (typeof expires === 'string' && !Number.isNaN(Date.parse(expires)))) &&
      (maxAge === undefined || (typeof maxAge === 'string' && /^-?\d+$/.test(maxAge)))
    )
  }

  private matchesCookieContract(
    parsedCookie: ParsedSetCookie,
    cookie: ReturnType<typeof getCookies>['sessionToken'],
  ): boolean {
    const separator = parsedCookie.nameValue.indexOf('=')
    const cookieValue = parsedCookie.nameValue.slice(separator + 1)
    const { attributes } = parsedCookie
    const expectedDomain = cookie.attributes.domain?.replace(/^\./, '').toLowerCase()
    const domain = attributes.get('domain')
    const isExpired = this.isExpiredCookie(attributes)

    return (
      attributes.get('path') === '/' &&
      attributes.get('httponly') === true &&
      attributes.get('samesite') === 'Lax' &&
      (cookie.attributes.secure
        ? attributes.get('secure') === true
        : attributes.get('secure') === undefined) &&
      (expectedDomain
        ? typeof domain === 'string' &&
          domain.replace(/^\./, '').toLowerCase() === expectedDomain
        : domain === undefined) &&
      (cookieValue.length > 0 || isExpired) &&
      (cookieValue.length === 0 || !isExpired)
    )
  }

  private isExpiredCookie(attributes: Map<string, string | true>): boolean {
    const maxAge = attributes.get('max-age')
    const expires = attributes.get('expires')
    return (
      maxAge === '0' || (typeof expires === 'string' && Date.parse(expires) <= Date.now())
    )
  }

  private toAuthUser(user: { id: string; email: string }): AuthUser {
    return { id: user.id, email: user.email }
  }
}
