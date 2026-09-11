import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express'

import { notificationModel } from '@/communication/database/drizzle/models/notification-model'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

import { CommunicationModuleFixture } from '@/communication/fixtures/communication-module-fixture'

import {
  managerRequestAuthorization,
  notificationInput,
  prepareCommunicationFixture,
  resetCommunicationFixture,
} from './communication-controller-test-helpers'

type StreamResponse = {
  readonly body: string
  close: () => void
  status: number
  headers: Record<string, string | string[] | undefined>
}

type SessionRevalidatingRequest = ExpressRequest & {
  revalidateAuthSession: () => Promise<boolean>
}

const STREAM_BODY_WAIT_TIMEOUT_MS = 10_000
const STREAM_CLOSE_SETTLE_TIMEOUT_MS = 100

async function connectToStream(
  fixture: CommunicationModuleFixture,
  headers: Record<string, string>,
): Promise<StreamResponse> {
  const streamRequest = request(fixture.app.getHttpServer())
    .get('/notifications/stream')
    .set(headers)
    .buffer(false)

  return new Promise((resolve, reject) => {
    let body = ''
    let settled = false
    streamRequest.on('error', (error) => {
      if (!settled) reject(error)
    })
    streamRequest.once('response', (response) => {
      settled = true
      response.on('error', () => undefined)
      response.on('aborted', () => undefined)
      response.socket?.on('error', () => undefined)
      response.setEncoding('utf8')
      response.on('data', (chunk: string) => {
        body += chunk
      })
      resolve({
        get body() {
          return body
        },
        close: () => streamRequest.abort(),
        status: response.statusCode ?? 0,
        headers: response.headers,
      })
    })
    streamRequest.end()
  })
}

async function waitForBody(stream: StreamResponse, expected: string): Promise<void> {
  const deadline = Date.now() + STREAM_BODY_WAIT_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (stream.body.includes(expected)) return
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  expect(stream.body).toContain(expected)
}

async function closeStream(stream: StreamResponse | undefined): Promise<void> {
  stream?.close()
  if (stream)
    await new Promise((resolve) => setTimeout(resolve, STREAM_CLOSE_SETTLE_TIMEOUT_MS))
}

function installSessionRevalidation(
  fixture: CommunicationModuleFixture,
  auth: Awaited<ReturnType<typeof prepareCommunicationFixture>>['auth'],
): void {
  const server = fixture.app.getHttpServer()
  const [originalListener] = server.listeners('request')
  if (typeof originalListener !== 'function')
    throw new Error('O listener HTTP do fixture não está disponível.')

  server.removeListener('request', originalListener)
  server.on('request', (request: ExpressRequest, response: ExpressResponse) => {
    const revalidatingRequest = request as SessionRevalidatingRequest
    revalidatingRequest.revalidateAuthSession = async () => {
      try {
        await auth.verify(request.headers)
        return true
      } catch {
        return false
      }
    }
    originalListener(request, response)
  })
}

describe('Stream Notifications Controller [GET /notifications/stream]', () => {
  let fixture: CommunicationModuleFixture
  let auth: Awaited<ReturnType<typeof prepareCommunicationFixture>>['auth']

  beforeAll(async () => {
    ;({ fixture, auth } = await prepareCommunicationFixture())
    installSessionRevalidation(fixture, auth)
  })
  beforeEach(async () => resetCommunicationFixture(fixture, auth))
  afterAll(async () => fixture?.close())

  it('rejects anonymous requests and does not replay committed or rolled-back history', async () => {
    const anonymous = await request(fixture.app.getHttpServer()).get(
      '/notifications/stream',
    )

    expect(anonymous.status).toBe(401)

    await fixture.seedNotifications([
      notificationInput({ sourceEventId: 'stream-before-connection' }),
    ])

    const database = fixture.get(DrizzleClient).requireDatabase()
    await expect(
      database.transaction(async (transaction) => {
        await transaction
          .insert(notificationModel)
          .values(notificationInput({ sourceEventId: 'stream-rolled-back' }))
        throw new Error('rollback stream fixture')
      }),
    ).rejects.toThrow('rollback stream fixture')

    let stream: StreamResponse | undefined
    try {
      stream = await connectToStream(fixture, {
        Cookie: managerRequestAuthorization(),
        'Last-Event-ID': 'stream-before-connection',
      })

      expect(stream.status).toBe(200)
      expect(stream.headers['content-type']).toContain('text/event-stream')
      expect(stream.headers['cache-control']).toContain('no-cache')
      expect(stream.body).not.toContain('stream-before-connection')
      expect(stream.body).not.toContain('stream-rolled-back')
    } finally {
      await closeStream(stream)
    }
  })

  it('emits a complete named versioned event for a committed addressed notification', async () => {
    let stream: StreamResponse | undefined
    try {
      stream = await connectToStream(fixture, {
        Cookie: managerRequestAuthorization(),
        Accept: 'text/event-stream',
      })

      const notification = notificationInput({
        sourceEventId: 'stream-after-connection',
      })
      await fixture.seedNotifications([notification])

      await waitForBody(stream, 'stream-after-connection')
      expect(stream.body).toContain('event: notification.created\n')
      expect(stream.body).toMatch(/id: [0-9a-f-]+\n/)
      expect(stream.body).toContain('"version":1')
      expect(stream.body).toContain(
        '"recipientUserId":"61000000-0000-4000-8000-000000000002"',
      )
    } finally {
      await closeStream(stream)
    }
  })

  it('isolates events to the authenticated user and establishment', async () => {
    let stream: StreamResponse | undefined
    try {
      stream = await connectToStream(fixture, {
        Cookie: managerRequestAuthorization(),
        Accept: 'text/event-stream',
      })

      await fixture.seedNotifications([
        notificationInput({ sourceEventId: 'stream-matching-scope' }),
      ])
      await waitForBody(stream, 'stream-matching-scope')

      await fixture.seedNotifications([
        notificationInput({
          sourceEventId: 'stream-foreign-user',
          recipientUserId: CommunicationModuleFixture.accounts.foreignManagerId,
          establishmentId: CommunicationModuleFixture.accounts.foreignEstablishmentId,
        }),
      ])
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(stream.body).not.toContain('stream-foreign-user')
    } finally {
      await closeStream(stream)
    }
  })

  it('writes a heartbeat and closes after the session is invalidated', async () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval')
    let stream: StreamResponse | undefined

    try {
      stream = await connectToStream(fixture, {
        Cookie: managerRequestAuthorization(),
        Accept: 'text/event-stream',
      })

      const heartbeat = setIntervalSpy.mock.calls.at(-1)?.[0]
      expect(setIntervalSpy.mock.calls.at(-1)?.[1]).toBe(20_000)
      expect(heartbeat).toBeTypeOf('function')
      ;(heartbeat as () => void)()
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(stream.body).toContain(': heartbeat\n\n')

      await auth.revokeSessions(CommunicationModuleFixture.accounts.managerId)
      await fixture.seedNotifications([
        notificationInput({ sourceEventId: 'stream-after-revocation' }),
      ])

      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(stream.body).not.toContain('stream-after-revocation')
    } finally {
      await closeStream(stream)
      setIntervalSpy.mockRestore()
    }
  })

  it('returns 429 when the authenticated actor already has five live streams', async () => {
    const streams: StreamResponse[] = []
    let sixth: StreamResponse | undefined
    let replacement: StreamResponse | undefined
    try {
      streams.push(
        ...(await Promise.all(
          Array.from({ length: 5 }, () =>
            connectToStream(fixture, { Cookie: managerRequestAuthorization() }),
          ),
        )),
      )

      sixth = await connectToStream(fixture, {
        Cookie: managerRequestAuthorization(),
      })

      expect(streams.every((stream) => stream.status === 200)).toBe(true)
      expect(sixth.status).toBe(429)
      streams.forEach((stream) => stream.close())
      await new Promise((resolve) => setTimeout(resolve, 50))

      replacement = await connectToStream(fixture, {
        Cookie: managerRequestAuthorization(),
      })
      expect(replacement.status).toBe(200)
    } finally {
      streams.forEach((stream) => stream.close())
      sixth?.close()
      replacement?.close()
      await new Promise((resolve) => setTimeout(resolve, STREAM_CLOSE_SETTLE_TIMEOUT_MS))
    }
  })
})
