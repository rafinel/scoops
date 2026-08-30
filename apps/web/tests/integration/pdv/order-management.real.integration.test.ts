import type {
  APIRequestContext,
  APIResponse,
  BrowserContext,
  Page,
  Response as BrowserResponse,
} from '@playwright/test'

import { expect, test } from '../../playwright'

const SERVER_URL = 'http://127.0.0.1:3336'
const MANAGER = { email: 'manager.seed@scoops.com', password: '12345678' }
const OPERATOR = { email: 'operator.seed@scoops.com', password: '12345678' }
const UNKNOWN_ORDER_ID = '00000000-0000-4000-8000-000000000099'

type Credentials = { email: string; password: string }
type JsonRecord = Record<string, unknown>
type ApiResult = { body: unknown; response: APIResponse }

test.describe.configure({ mode: 'serial' })

test('exercises the real Manager/Operator order history lifecycle', async ({
  browser,
  page,
  request,
}) => {
  test.setTimeout(120_000)

  // The shared browser fixture is intentionally anonymous by default. Remove only
  // those defaults so this scenario exercises real Supabase authentication too.
  await page.unroute('**/auth/v1/session*')
  await page.unroute('**/auth/v1/logout*')

  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) =>
    failedRequests.push(`${request.method()} ${request.url()}`),
  )

  await signIn(page, MANAGER, '/orders')
  const managerToken = await readAccessToken(page)
  const line = await chooseCatalogLine(request, managerToken)
  const preview = await api(request, managerToken, 'POST', '/orders/preview', {
    lines: [line],
  })
  expectApi(preview.response, 'POST', '/orders/preview', 200)
  const previewToken = readString(readRecord(preview.body), 'previewToken')
  const registration = await api(request, managerToken, 'POST', '/orders', {
    idempotencyKey: crypto.randomUUID(),
    previewToken,
    lines: [line],
  })
  expectApi(registration.response, 'POST', '/orders', 201)
  const registrationBody = readRecord(registration.body)
  const createdOrder = readRecord(registrationBody.order)
  const orderId = readString(createdOrder, 'id')
  const sequenceNumber = readNumber(createdOrder, 'sequenceNumber')

  await page.goto(`/orders?search=%23${sequenceNumber}`)
  await expect(page.getByRole('heading', { name: /Pedidos/ })).toBeVisible()
  await expect(
    page.getByRole('cell', {
      name: `#${String(sequenceNumber).padStart(5, '0')}`,
      exact: true,
    }),
  ).toBeVisible()
  await page.screenshot({
    path: 'test-results/pdv-orders-real-list-1481x1050.png',
    fullPage: true,
  })
  await page
    .getByRole('button', { name: new RegExp(`Ver pedido ${sequenceNumber}`) })
    .click()
  await expect(page).toHaveURL(`/orders/${orderId}`)
  await expect(
    page.getByRole('heading', {
      name: new RegExp(`Pedido #${String(sequenceNumber).padStart(5, '0')}`),
    }),
  ).toBeVisible()

  const operatorContext = await browser.newContext({ baseURL: 'http://127.0.0.1:4000' })
  const operatorPage = await operatorContext.newPage()
  try {
    await signIn(operatorPage, OPERATOR, `/orders/${orderId}`)
    await expect(
      operatorPage.getByRole('heading', {
        name: new RegExp(`Pedido #${String(sequenceNumber).padStart(5, '0')}`),
      }),
    ).toBeVisible()
    await expect(
      operatorPage.getByRole('button', { name: 'Cancelar pedido' }),
    ).toHaveCount(0)
    const operatorToken = await readAccessToken(operatorPage)
    const forbiddenCancel = await api(
      request,
      operatorToken,
      'PATCH',
      `/orders/${orderId}/cancel`,
      { reason: 'operator attempt' },
    )
    expectApi(forbiddenCancel.response, 'PATCH', `/orders/${orderId}/cancel`, 403)
  } finally {
    await closeContext(operatorContext)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Cancelar pedido' }).focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Cancelar pedido?' })
  await expect(dialog).toBeVisible()
  await page.screenshot({
    path: 'test-results/pdv-orders-real-cancel-dialog-390x844.png',
    fullPage: true,
  })
  await dialog
    .getByRole('textbox', { name: 'Motivo do cancelamento (opcional)' })
    .fill('  Teste real do histórico  ')
  const cancelResponsePromise = page.waitForResponse(
    (response) =>
      response.url() === `${SERVER_URL}/orders/${orderId}/cancel` &&
      response.request().method() === 'PATCH',
  )
  await dialog.getByRole('button', { name: 'Cancelar pedido' }).click()
  const cancelResponse = await cancelResponsePromise
  expectApi(cancelResponse, 'PATCH', `/orders/${orderId}/cancel`, 200)
  expect(cancelResponse.request().postDataJSON()).toEqual({
    reason: 'Teste real do histórico',
  })
  await expect(page.getByText('Pedido cancelado')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0)
  await page.screenshot({
    path: 'test-results/pdv-orders-real-canceled-390x844.png',
    fullPage: true,
  })

  const canceled = await api(request, managerToken, 'GET', `/orders/${orderId}`)
  expectApi(canceled.response, 'GET', `/orders/${orderId}`, 200)
  const canceledOrder = readRecord(canceled.body)
  expect(canceledOrder.status).toBe('canceled')
  expect(readRecord(canceledOrder.cancellation).reason).toBe('Teste real do histórico')

  const restorations = readArray(readRecord(canceledOrder.cancellation), 'restorations')
  const productIds = new Set(
    restorations.map((restoration) => readString(readRecord(restoration), 'productId')),
  )
  for (const productId of productIds) {
    const stock = await api(request, managerToken, 'GET', `/products/${productId}/stock`)
    const history = await api(
      request,
      managerToken,
      'GET',
      `/products/${productId}/stock-transactions?page=1&limit=50`,
    )
    expectApi(stock.response, 'GET', `/products/${productId}/stock`, 200)
    expectApi(
      history.response,
      'GET',
      `/products/${productId}/stock-transactions?page=1&limit=50`,
      200,
    )
    const historyBody = readRecord(history.body)
    const transactions = readArray(historyBody, 'items')
    expect(
      transactions.some((item) => {
        const transaction = readRecord(item)
        return transaction.type === 'sale-cancellation' && transaction.orderId === orderId
      }),
    ).toBe(true)
  }

  const missingOrder = await api(
    request,
    managerToken,
    'GET',
    `/orders/${UNKNOWN_ORDER_ID}`,
  )
  expectApi(missingOrder.response, 'GET', `/orders/${UNKNOWN_ORDER_ID}`, 404)
  await page.goto(`/orders/${UNKNOWN_ORDER_ID}`)
  await expect(page.getByRole('heading', { name: 'Pedido não encontrado' })).toBeVisible()
  expect(consoleErrors).toHaveLength(1)
  expect(consoleErrors[0]).toContain('404')
  expect(failedRequests).toEqual([])
})

async function signIn(page: Page, credentials: Credentials, returnTo: string) {
  await page.goto(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  await page.getByLabel('E-mail').fill(credentials.email)
  await page.getByRole('textbox', { name: 'Senha' }).fill(credentials.password)
  await page.getByRole('button', { name: 'Entrar no Scoops' }).click()
  await expect(page).toHaveURL(new RegExp(`${returnTo.replace('/', '\\/')}(?:\\?.*)?$`))
}

async function chooseCatalogLine(
  request: APIRequestContext,
  token: string,
): Promise<JsonRecord> {
  const result = await api(request, token, 'GET', '/orders/catalog?page=1&pageSize=20')
  expectApi(result.response, 'GET', '/orders/catalog?page=1&pageSize=20', 200)
  const items = readArray(readRecord(result.body), 'items')
  for (const item of items) {
    const product = readRecord(item)
    const productId = readString(product, 'productId')
    const kind = readString(product, 'kind')
    if (kind === 'portion') {
      const sizes = readArray(product, 'sizes')
      const size = sizes[0]
      if (size)
        return {
          productId,
          kind,
          quantity: 1,
          sizeId: readString(readRecord(size), 'sizeId'),
          accompanimentIds: [],
        }
    }
    if (kind === 'resale') {
      const brands = readArray(product, 'resaleBrands')
      const brand = brands[0]
      if (brand)
        return {
          productId,
          kind,
          quantity: 1,
          brandId: readString(readRecord(brand), 'brandId'),
        }
    }
  }
  throw new Error(
    'The real order integration found no seed catalog item with a usable configuration.',
  )
}

async function api(
  request: APIRequestContext,
  token: string | undefined,
  method: string,
  path: string,
  body?: JsonRecord,
): Promise<ApiResult> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'
  const response = await request.fetch(`${SERVER_URL}${path}`, {
    method,
    headers,
    data: body,
  })
  const text = await response.text()
  return { body: text ? JSON.parse(text) : undefined, response }
}

async function readAccessToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        const value: unknown = JSON.parse(raw)
        if (
          value &&
          typeof value === 'object' &&
          'access_token' in value &&
          typeof value.access_token === 'string'
        )
          return value.access_token
      } catch {}
    }
    throw new Error('The real Supabase access token was not found in browser storage.')
  })
}

function expectApi(
  response: APIResponse | BrowserResponse,
  method: string,
  path: string,
  status: number,
) {
  if ('request' in response) expect(response.request().method()).toBe(method)
  expect(response.url()).toBe(`${SERVER_URL}${path}`)
  expect(response.status()).toBe(status)
}

function readRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected an object in the real order response.')
  return value as JsonRecord
}

function readArray(record: JsonRecord, key: string): unknown[] {
  const value = record[key]
  if (!Array.isArray(value))
    throw new Error(`Expected ${key} to be an array in the real order response.`)
  return value
}

function readString(record: JsonRecord, key: string): string {
  const value = record[key]
  if (typeof value !== 'string')
    throw new Error(`Expected ${key} to be a string in the real order response.`)
  return value
}

function readNumber(record: JsonRecord, key: string): number {
  const value = record[key]
  if (typeof value !== 'number')
    throw new Error(`Expected ${key} to be a number in the real order response.`)
  return value
}

async function closeContext(context: BrowserContext) {
  await context.close()
}
