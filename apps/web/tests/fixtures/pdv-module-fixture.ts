import type { Page } from '@playwright/test'

export type PdvMockResponse = {
  body: unknown
  status?: number
}

export type PdvRequestRecord = {
  body?: unknown
  method: string
  url: URL
}

export type PdvSalesChannelsMockOptions = {
  channels?: SalesChannelJson[]
  respond?: (
    request: PdvRequestRecord,
    requestNumber: number,
    channels: SalesChannelJson[],
  ) => PdvMockResponse | Promise<PdvMockResponse> | undefined
}

export type PdvSalesChannelsMock = {
  channels: SalesChannelJson[]
  requests: PdvRequestRecord[]
}

export type PdvFixture = {
  mockSalesChannels: (
    options?: PdvSalesChannelsMockOptions,
  ) => Promise<PdvSalesChannelsMock>
  mockOrders: (options?: PdvOrdersMockOptions) => Promise<PdvOrdersMock>
}

export type PdvOrdersMockOptions = {
  list?: PdvMockResponse | ((request: PdvRequestRecord) => PdvMockResponse)
  detail?: PdvMockResponse | ((request: PdvRequestRecord) => PdvMockResponse)
  cancel?: PdvMockResponse | ((request: PdvRequestRecord) => PdvMockResponse)
}

export type PdvOrdersMock = { requests: PdvRequestRecord[] }

type SalesChannelJson = {
  id: string
  establishmentId: string
  name: string
  percentage: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

function responseChannel(
  id: string,
  input: Partial<SalesChannelJson> &
    Pick<SalesChannelJson, 'name' | 'percentage' | 'status'>,
): SalesChannelJson {
  const timestamp = '2026-08-25T12:00:00.000Z'
  return {
    createdAt: timestamp,
    establishmentId: 'establishment-1',
    id,
    name: input.name,
    percentage: input.percentage,
    status: input.status,
    updatedAt: timestamp,
  }
}

const DEFAULT_CHANNELS = [
  responseChannel('channel-delivery', {
    name: 'Delivery próprio',
    percentage: 12,
    status: 'active',
  }),
  responseChannel('channel-ifood', {
    name: 'iFood',
    percentage: 20,
    status: 'active',
  }),
  responseChannel('channel-balcao', {
    name: 'Balcão',
    percentage: 0,
    status: 'active',
  }),
  responseChannel('channel-promo', {
    name: 'Promoção local',
    percentage: -10,
    status: 'inactive',
  }),
]

export const PdvFixture = (page: Page): PdvFixture => ({
  async mockSalesChannels(options = {}) {
    const channels = (options.channels ?? DEFAULT_CHANNELS).map((channel) => ({
      ...channel,
    }))
    const requests: PdvRequestRecord[] = []
    const mock: PdvSalesChannelsMock = { channels, requests }

    await page.route('**/sales-channels**', async (route) => {
      if (!['fetch', 'xhr'].includes(route.request().resourceType())) {
        await route.continue()
        return
      }

      const requestUrl = new URL(route.request().url())
      if (!requestUrl.pathname.startsWith('/sales-channels')) {
        await route.continue()
        return
      }

      const request: PdvRequestRecord = {
        method: route.request().method(),
        url: requestUrl,
      }
      if (route.request().postData()) request.body = route.request().postDataJSON()
      requests.push(request)

      const customResponse = await options.respond?.(request, requests.length, channels)
      if (customResponse) {
        await route.fulfill({
          body: JSON.stringify(customResponse.body),
          contentType: 'application/json',
          status: customResponse.status ?? 200,
        })
        return
      }

      const pathParts = requestUrl.pathname.split('/').filter(Boolean)
      const channelId = pathParts[1]
      let response: PdvMockResponse

      if (request.method === 'GET') {
        const visibleChannels =
          pathParts[1] === 'active'
            ? channels.filter((channel) => channel.status === 'active')
            : channels
        response = { body: visibleChannels }
      } else if (request.method === 'POST') {
        const body = request.body as {
          name: string
          percentage: number
          status: 'active' | 'inactive'
        }
        const created = responseChannel(`channel-created-${channels.length + 1}`, body)
        channels.push(created)
        response = { body: created, status: 201 }
      } else if (request.method === 'PATCH' && channelId && pathParts[2] === undefined) {
        const body = request.body as { name: string; percentage: number }
        const current = channels.find((channel) => channel.id === channelId)
        if (!current) {
          response = { body: { message: 'Not found' }, status: 404 }
        } else {
          Object.assign(current, body)
          response = { body: current }
        }
      } else if (request.method === 'PATCH' && channelId) {
        const current = channels.find((channel) => channel.id === channelId)
        if (!current) {
          response = { body: { message: 'Not found' }, status: 404 }
        } else {
          current.status = pathParts[2] === 'reactivate' ? 'active' : 'inactive'
          response = { body: current }
        }
      } else if (request.method === 'DELETE' && channelId) {
        const index = channels.findIndex((channel) => channel.id === channelId)
        if (index < 0) response = { body: { message: 'Not found' }, status: 404 }
        else {
          channels.splice(index, 1)
          response = { body: {}, status: 204 }
        }
      } else {
        response = { body: { message: 'Not found' }, status: 404 }
      }

      await route.fulfill({
        body: JSON.stringify(response.body),
        contentType: 'application/json',
        status: response.status ?? 200,
      })
    })

    return mock
  },

  async mockOrders(options = {}) {
    const requests: PdvRequestRecord[] = []

    await page.route('**/orders**', async (route) => {
      if (!['fetch', 'xhr'].includes(route.request().resourceType())) {
        await route.continue()
        return
      }

      const requestUrl = new URL(route.request().url())
      if (requestUrl.pathname === '/orders/catalog') {
        await route.continue()
        return
      }

      const request: PdvRequestRecord = {
        method: route.request().method(),
        url: requestUrl,
      }
      if (route.request().postData()) request.body = route.request().postDataJSON()
      requests.push(request)

      const responseFactory =
        request.method === 'GET'
          ? requestUrl.pathname === '/orders'
            ? options.list
            : options.detail
          : options.cancel
      const response =
        typeof responseFactory === 'function'
          ? responseFactory(request)
          : (responseFactory ?? {
              body: { items: [], page: 1, pageSize: 6, total: 0, totalPages: 0 },
            })

      await route.fulfill({
        body: JSON.stringify(response.body),
        contentType: 'application/json',
        status: response.status ?? 200,
      })
    })

    return { requests }
  },
})
