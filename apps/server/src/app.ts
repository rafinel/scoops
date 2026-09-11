import type { INestApplication } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { toNodeHandler } from 'better-auth/node'
import type { NextFunction, Request, Response } from 'express'
import type { IncomingMessage } from 'node:http'

import { GlobalErrorHandler } from '@/shared/rest/filters'

type AuthHandler = {
  handler: (request: globalThis.Request) => Promise<globalThis.Response>
}

export type HttpAuthBootstrapOptions = {
  trustedOrigins: readonly string[]
  isAllowedRoute: (request: Pick<IncomingMessage, 'method' | 'url'>) => boolean
}

export class App {
  constructor(public readonly instance: INestApplication) {}

  configureHttpApp(auth: AuthHandler, options: HttpAuthBootstrapOptions): void {
    this.instance.enableCors({
      origin: [...options.trustedOrigins],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    })

    const betterAuthHandler = toNodeHandler({
      handler: async (request) =>
        this.sanitizeBetterAuthResponse(request, auth.handler(request)),
    })
    this.instance.use(
      '/api/auth',
      (request: Request, response: Response, next: NextFunction) => {
        if (!options.isAllowedRoute(request)) {
          response
            .status(404)
            .json({ error: 'Não encontrado', message: 'Não encontrado.' })
          return
        }
        void betterAuthHandler(request, response).catch(next)
      },
    )

    const parserApp = this.instance as INestApplication & {
      useBodyParser: (
        parser: 'json' | 'urlencoded',
        options?: Record<string, unknown>,
      ) => void
    }
    parserApp.useBodyParser('json')
    parserApp.useBodyParser('urlencoded', { extended: true })

    this.instance.useGlobalFilters(
      new GlobalErrorHandler(this.instance.get(HttpAdapterHost)),
    )
  }

  private async sanitizeBetterAuthResponse(
    request: globalThis.Request,
    response: Promise<globalThis.Response>,
  ): Promise<globalThis.Response> {
    const resolved = await response
    if (!new URL(request.url).pathname.endsWith('/sign-in/email')) return resolved
    if (!resolved.headers.get('content-type')?.includes('application/json'))
      return resolved

    const body = await resolved.clone().json()
    if (!body || typeof body !== 'object' || !('token' in body)) return resolved

    const { token: _token, ...sanitized } = body as Record<string, unknown>
    const headers = new Headers(resolved.headers)
    headers.delete('content-length')
    return new Response(JSON.stringify(sanitized), {
      status: resolved.status,
      statusText: resolved.statusText,
      headers,
    })
  }
}
