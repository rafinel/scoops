import type { IncomingMessage, ServerResponse } from 'node:http'

import { createApp } from '../dist/main.js'

type RequestHandler = (request: IncomingMessage, response: ServerResponse) => void

let requestHandlerPromise: Promise<RequestHandler> | undefined

function getRequestHandler(): Promise<RequestHandler> {
  return createApp().then((app) => app.getHttpAdapter().getInstance() as RequestHandler)
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  requestHandlerPromise ??= getRequestHandler()
  const requestHandler = await requestHandlerPromise

  requestHandler(request, response)
}
