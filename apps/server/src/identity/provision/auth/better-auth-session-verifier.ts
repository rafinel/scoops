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
    const configuredDomain = this.auth.options.advanced?.crossSubDomainCookies?.domain
    const configuredDomainIsValid =
      typeof configuredDomain === 'string' &&
      isSharedParentDomain(configuredDomain, hostname)
    if (
      attributes.path !== '/' ||
      attributes.httpOnly !== true ||
      attributes.sameSite !== 'lax' ||
      attributes.secure !== !isLoopback ||
      (isLoopback
        ? attributes.domain !== undefined
        : typeof configuredDomain !== 'string' ||
          !configuredDomainIsValid ||
          typeof attributes.domain !== 'string' ||
          attributes.domain.replace(/^\./, '').toLowerCase() !==
            configuredDomain.replace(/^\./, '').toLowerCase())
    ) {
      throw new AuthenticationProviderUnavailableError()
    }
  }

  private isValidSetCookie(
    value: string,
    cookie: ReturnType<typeof getCookies>['sessionToken'],
  ): boolean {
    const [nameValue, ...attributeParts] = value.split(';').map((part) => part.trim())
    const separator = nameValue?.indexOf('=') ?? -1
    if (separator <= 0 || nameValue.slice(0, separator) !== cookie.name) return false

    const attributes = new Map<string, string | true>()
    for (const part of attributeParts) {
      if (!part) return false
      const attributeSeparator = part.indexOf('=')
      const name = (
        attributeSeparator === -1 ? part : part.slice(0, attributeSeparator)
      ).toLowerCase()
      const attributeValue =
        attributeSeparator === -1 ? true : part.slice(attributeSeparator + 1)
      if (!name || attributes.has(name) || !ALLOWED_SET_COOKIE_ATTRIBUTES.has(name))
        return false
      attributes.set(name, attributeValue)
    }

    const expectedDomain = cookie.attributes.domain?.replace(/^\./, '').toLowerCase()
    const domain = attributes.get('domain')
    const secure = attributes.get('secure')
    const httpOnly = attributes.get('httponly')
    const sameSite = attributes.get('samesite')
    const path = attributes.get('path')
    const expires = attributes.get('expires')
    const maxAge = attributes.get('max-age')
    if (
      (expires !== undefined &&
        (typeof expires !== 'string' || Number.isNaN(Date.parse(expires)))) ||
      (maxAge !== undefined && (typeof maxAge !== 'string' || !/^-?\d+$/.test(maxAge)))
    )
      return false

    const cookieValue = nameValue.slice(separator + 1)
    const isExpired =
      maxAge === '0' || (typeof expires === 'string' && Date.parse(expires) <= Date.now())

    return (
      path === '/' &&
      httpOnly === true &&
      sameSite === 'Lax' &&
      (cookie.attributes.secure ? secure === true : secure === undefined) &&
      (expectedDomain
        ? typeof domain === 'string' &&
          domain.replace(/^\./, '').toLowerCase() === expectedDomain
        : domain === undefined) &&
      (cookieValue.length > 0 || isExpired) &&
      (cookieValue.length === 0 || !isExpired)
    )
  }

  private toAuthUser(user: { id: string; email: string }): AuthUser {
    return { id: user.id, email: user.email }
  }
}

function isSharedParentDomain(domain: string, hostname: string): boolean {
  const normalizedDomain = domain.replace(/^\./, '').toLowerCase()
  if (
    normalizedDomain.length === 0 ||
    normalizedDomain.includes('/') ||
    normalizedDomain.includes(':') ||
    normalizedDomain.split('.').length < 2
  )
    return false

  const normalizedHostname = hostname.toLowerCase()
  return (
    normalizedHostname !== normalizedDomain &&
    normalizedHostname.endsWith(`.${normalizedDomain}`)
  )
}
