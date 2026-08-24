import type { Page, Route } from '@playwright/test'

export type MrpMockResponse = {
  body: unknown
  status?: number
}

export type MrpProductsMockOptions = {
  getResponse:
    | MrpMockResponse
    | ((request: URL, requestNumber: number) => MrpMockResponse)
  postResponse?: MrpMockResponse
}

export type MrpProductsMock = {
  registrations: unknown[]
  requests: URL[]
}

export type MrpRequestRecord = {
  body?: unknown
  method: string
  url: URL
}

export type MrpStockMockOptions = {
  respond: (
    request: MrpRequestRecord,
    requestNumber: number,
  ) => MrpMockResponse | Promise<MrpMockResponse>
}

export type MrpStockMock = {
  requests: MrpRequestRecord[]
}

export type MrpIngredientSourceMockOptions = {
  respond: (
    request: MrpRequestRecord,
    requestNumber: number,
  ) => MrpMockResponse | Promise<MrpMockResponse>
}

export type MrpIngredientSourceMock = {
  requests: MrpRequestRecord[]
}

export type MrpRecipeMockOptions = {
  respond: (
    request: MrpRequestRecord,
    requestNumber: number,
  ) => MrpMockResponse | Promise<MrpMockResponse>
}

export type MrpRecipeMock = {
  requests: MrpRequestRecord[]
}

export type MrpFixture = {
  mockProducts: (options: MrpProductsMockOptions) => Promise<MrpProductsMock>
  mockIngredientSources: (
    options: MrpIngredientSourceMockOptions,
  ) => Promise<MrpIngredientSourceMock>
  mockProductStock: (options: MrpStockMockOptions) => Promise<MrpStockMock>
  mockProductRecipe: (options: MrpRecipeMockOptions) => Promise<MrpRecipeMock>
  mockProductAccompaniments: (options: MrpStockMockOptions) => Promise<MrpStockMock>
  mockAccompanimentTypes: (options: MrpStockMockOptions) => Promise<MrpStockMock>
  mockProductPricing: (options: MrpStockMockOptions) => Promise<MrpStockMock>
}

const resolveResponse = (
  response: MrpMockResponse | ((request: URL, requestNumber: number) => MrpMockResponse),
  request: URL,
  requestNumber: number,
) => (typeof response === 'function' ? response(request, requestNumber) : response)

export const MrpFixture = (page: Page): MrpFixture => ({
  async mockProducts({ getResponse, postResponse = { body: {}, status: 201 } }) {
    const requests: URL[] = []
    const registrations: unknown[] = []

    await page.route('**/products**', async (route) => {
      if (!['fetch', 'xhr'].includes(route.request().resourceType())) {
        await route.continue()
        return
      }

      const request = new URL(route.request().url())
      if (request.pathname !== '/products') {
        await route.continue()
        return
      }

      if (route.request().method() === 'POST') {
        registrations.push(route.request().postDataJSON())
        await route.fulfill({
          contentType: 'application/json',
          status: postResponse.status ?? 200,
          body: JSON.stringify(postResponse.body),
        })
        return
      }

      requests.push(request)
      const response = resolveResponse(getResponse, request, requests.length)
      await route.fulfill({
        contentType: 'application/json',
        status: response.status ?? 200,
        body: JSON.stringify(response.body),
      })
    })

    return { registrations, requests }
  },

  async mockProductStock({ respond }) {
    const requests: MrpRequestRecord[] = []

    await page.route('**/products/**', async (route) => {
      if (!['fetch', 'xhr'].includes(route.request().resourceType())) {
        await route.continue()
        return
      }

      const request: MrpRequestRecord = {
        method: route.request().method(),
        url: new URL(route.request().url()),
      }
      const postData = route.request().postData()
      if (postData) request.body = route.request().postDataJSON()
      requests.push(request)
      const response = await respond(request, requests.length)

      await route.fulfill({
        contentType: 'application/json',
        status: response.status ?? 200,
        body: JSON.stringify(response.body),
      })
    })

    return { requests }
  },

  async mockProductPricing({ respond }) {
    const requests: MrpRequestRecord[] = []
    await page.route('**/products/**', async (route) => {
      if (!['fetch', 'xhr'].includes(route.request().resourceType())) {
        await route.continue()
        return
      }

      const requestUrl = new URL(route.request().url())
      if (
        !/^\/products\/[^/]+\/(?:pricing|sizes|resale|resale-configuration|brands\/[^/]+\/resale-configuration)(?:\/|$)/.test(
          requestUrl.pathname,
        )
      ) {
        await route.continue()
        return
      }

      const request: MrpRequestRecord = {
        method: route.request().method(),
        url: requestUrl,
      }
      const postData = route.request().postData()
      if (postData) request.body = route.request().postDataJSON()
      requests.push(request)
      const response = await respond(request, requests.length)

      await route.fulfill({
        contentType: 'application/json',
        status: response.status ?? 200,
        body: JSON.stringify(response.body),
      })
    })
    return { requests }
  },

  async mockIngredientSources({ respond }) {
    const requests: MrpRequestRecord[] = []
    await page.route('**/products/*/stock', async (route) => {
      if (!['fetch', 'xhr'].includes(route.request().resourceType())) {
        await route.continue()
        return
      }

      const request: MrpRequestRecord = {
        method: route.request().method(),
        url: new URL(route.request().url()),
      }
      requests.push(request)
      const response = await respond(request, requests.length)
      await route.fulfill({
        contentType: 'application/json',
        status: response.status ?? 200,
        body: JSON.stringify(response.body),
      })
    })

    return { requests }
  },

  async mockProductRecipe({ respond }) {
    const requests: MrpRequestRecord[] = []
    const handleRecipeRequest = async (route: Route) => {
      if (!['fetch', 'xhr'].includes(route.request().resourceType())) {
        await route.continue()
        return
      }

      const request: MrpRequestRecord = {
        method: route.request().method(),
        url: new URL(route.request().url()),
      }
      const postData = route.request().postData()
      if (postData) request.body = route.request().postDataJSON()
      requests.push(request)
      const response = await respond(request, requests.length)

      await route.fulfill({
        contentType: 'application/json',
        status: response.status ?? 200,
        body: JSON.stringify(response.body),
      })
    }

    await Promise.all([
      page.route('**/products/*/recipe**', handleRecipeRequest),
      page.route('**/products/*/production-preview**', handleRecipeRequest),
      page.route('**/products/*/productions', handleRecipeRequest),
    ])

    return { requests }
  },

  async mockProductAccompaniments({ respond }) {
    const requests: MrpRequestRecord[] = []
    await page.route('**/products/*/accompaniments**', async (route) => {
      if (!['fetch', 'xhr'].includes(route.request().resourceType()))
        return route.continue()
      const request: MrpRequestRecord = {
        method: route.request().method(),
        url: new URL(route.request().url()),
      }
      if (route.request().postData()) request.body = route.request().postDataJSON()
      requests.push(request)
      const response = await respond(request, requests.length)
      await route.fulfill({
        contentType: 'application/json',
        status: response.status ?? 200,
        body: JSON.stringify(response.body),
      })
    })
    return { requests }
  },

  async mockAccompanimentTypes({ respond }) {
    const requests: MrpRequestRecord[] = []
    await page.route('**/accompaniment-types**', async (route) => {
      if (!['fetch', 'xhr'].includes(route.request().resourceType()))
        return route.continue()
      const request: MrpRequestRecord = {
        method: route.request().method(),
        url: new URL(route.request().url()),
      }
      if (route.request().postData()) request.body = route.request().postDataJSON()
      requests.push(request)
      const response = await respond(request, requests.length)
      await route.fulfill({
        contentType: 'application/json',
        status: response.status ?? 200,
        body: JSON.stringify(response.body),
      })
    })
    return { requests }
  },
})
