import type { Page } from '@playwright/test'

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

export type MrpFixture = {
  mockProducts: (options: MrpProductsMockOptions) => Promise<MrpProductsMock>
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

      if (route.request().method() === 'POST') {
        registrations.push(route.request().postDataJSON())
        await route.fulfill({
          contentType: 'application/json',
          status: postResponse.status ?? 200,
          body: JSON.stringify(postResponse.body),
        })
        return
      }

      const request = new URL(route.request().url())
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
})
