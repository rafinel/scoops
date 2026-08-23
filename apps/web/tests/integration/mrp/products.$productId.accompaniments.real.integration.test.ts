import type {
  APIRequestContext,
  APIResponse,
  Page,
  Response as BrowserResponse,
} from '@playwright/test'

import { expect, test } from '../../playwright'

const SERVER_URL = 'http://127.0.0.1:3336'
const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const OWNER_PRODUCT_NAME = `F6 Portion ${RUN_ID}`
const ACCOMPANIMENT_PRODUCT_NAME = `F6 Granola ${RUN_ID}`
const PRIMARY_BRAND_NAME = `F6 Main Brand ${RUN_ID}`
const TYPE_NAME = `AAA F6 Type ${RUN_ID}`
const RENAMED_TYPE_NAME = `AAA F6 Renamed Type ${RUN_ID}`
const MISSING_PRODUCT_ID = '00000000-0000-0000-0000-000000000099'

const MANAGER_ACCOUNT = {
  email: 'manager.seed@scoops.com',
  password: '12345678',
}
const OPERATOR_ACCOUNT = {
  email: 'operator.seed@scoops.com',
  password: '12345678',
}

type AccountCredentials = {
  email: string
  password: string
}

type ApiResult = {
  body: unknown
  response: APIResponse
}

test.describe.configure({ mode: 'serial' })

test('proves the real Manager accompaniment and type lifecycles with access isolation', async ({
  browser,
  page,
  request,
}) => {
  test.setTimeout(90_000)
  await page.unroute('**/auth/v1/session*')
  await page.unroute('**/auth/v1/logout*')

  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(
      `${request.method()} ${request.url()} — ${request.failure()?.errorText}`,
    )
  })

  await signIn(page, MANAGER_ACCOUNT)
  const managerToken = await readAccessToken(page)
  const ownerProductId = await registerProduct(request, managerToken, {
    name: OWNER_PRODUCT_NAME,
    unit: 'un',
    categories: ['portion'],
    stockControl: 'single',
    allowNegativeStock: false,
    idealStock: 0,
  })
  const accompanimentProductId = await registerProduct(request, managerToken, {
    name: ACCOMPANIMENT_PRODUCT_NAME,
    unit: 'g',
    categories: ['accompaniment'],
    stockControl: 'by-brand',
    allowNegativeStock: false,
    idealStock: 10,
    initialStock: 40,
    brands: [
      {
        name: PRIMARY_BRAND_NAME,
        packageQuantity: 2,
        packageValue: 10,
        initialQuantity: 40,
      },
    ],
  })
  const beforeOwnerStock = await readApi(
    request,
    managerToken,
    'GET',
    `/products/${ownerProductId}/stock`,
  )
  const beforeOwnerHistory = await readApi(
    request,
    managerToken,
    'GET',
    `/products/${ownerProductId}/stock-transactions?page=1&limit=20`,
  )
  const beforeAccompanimentStock = await readApi(
    request,
    managerToken,
    'GET',
    `/products/${accompanimentProductId}/stock`,
  )
  const beforeAccompanimentHistory = await readApi(
    request,
    managerToken,
    'GET',
    `/products/${accompanimentProductId}/stock-transactions?page=1&limit=20`,
  )
  expectApi(beforeOwnerStock.response, 'GET', `/products/${ownerProductId}/stock`, 200)
  expectApi(
    beforeOwnerHistory.response,
    'GET',
    `/products/${ownerProductId}/stock-transactions?page=1&limit=20`,
    200,
  )
  expectApi(
    beforeAccompanimentStock.response,
    'GET',
    `/products/${accompanimentProductId}/stock`,
    200,
  )
  expectApi(
    beforeAccompanimentHistory.response,
    'GET',
    `/products/${accompanimentProductId}/stock-transactions?page=1&limit=20`,
    200,
  )

  await page.goto('/accompaniment-types')
  await expect(page).toHaveURL(/\/accompaniment-types\/?(?:\?[^#]*)?$/)
  await expect(
    page.getByRole('heading', { name: 'Tipos de acompanhamento' }),
  ).toBeVisible()
  await page
    .getByRole('main')
    .locator('header')
    .getByRole('button', { name: 'Novo tipo' })
    .focus()
  await page.keyboard.press('Enter')
  const createTypeDialog = page.getByRole('dialog', {
    name: 'Novo tipo de acompanhamento',
  })
  await createTypeDialog.getByRole('textbox', { name: 'Nome do tipo' }).fill(TYPE_NAME)
  const createTypeResponse = await captureResponse(
    page,
    'POST',
    '/accompaniment-types',
    () => createTypeDialog.getByRole('button', { name: 'Adicionar tipo' }).click(),
  )
  const createdTypeBody = await readResponseBody(createTypeResponse)
  expectApi(createTypeResponse, 'POST', '/accompaniment-types', 201)
  expect(readId(createdTypeBody)).toMatch(/[0-9a-f-]{36}/)
  await expect(page.getByText(TYPE_NAME, { exact: true })).toBeVisible()
  await expect(createTypeDialog).toBeHidden()

  await page.getByRole('button', { name: `Editar ${TYPE_NAME}` }).click()
  const renameTypeDialog = page.getByRole('dialog', {
    name: 'Editar tipo de acompanhamento',
  })
  await renameTypeDialog
    .getByRole('textbox', { name: 'Nome do tipo' })
    .fill(RENAMED_TYPE_NAME)
  const renameTypeResponse = await captureResponse(
    page,
    'PATCH',
    `/accompaniment-types/${readId(createdTypeBody)}`,
    () => renameTypeDialog.getByRole('button', { name: 'Salvar alterações' }).click(),
  )
  expectApi(
    renameTypeResponse,
    'PATCH',
    `/accompaniment-types/${readId(createdTypeBody)}`,
    200,
  )
  expect(await readResponseBody(renameTypeResponse)).toMatchObject({
    name: RENAMED_TYPE_NAME,
  })
  await expect(renameTypeDialog).toBeHidden()
  await expect(page.getByText(RENAMED_TYPE_NAME, { exact: true })).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(/\/accompaniment-types\/?(?:\?[^#]*)?$/)
  await expect(page.getByText(RENAMED_TYPE_NAME, { exact: true })).toBeVisible()

  await page.goto(`/products/${ownerProductId}/accompaniments`)
  await expect(page).toHaveURL(
    new RegExp(`/products/${ownerProductId}/accompaniments/?$`),
  )
  await expect(page.getByText('Nenhum acompanhamento vinculado')).toBeVisible()
  await page.getByRole('button', { name: 'Vincular acompanhamento' }).focus()
  await page.keyboard.press('Enter')
  const linkDialog = page.getByRole('dialog', { name: 'Vincular acompanhamento' })
  await linkDialog.getByRole('combobox', { name: 'Acompanhamento' }).click()
  await page.getByRole('option', { name: ACCOMPANIMENT_PRODUCT_NAME }).click()
  await linkDialog.getByRole('combobox', { name: 'Tipo' }).click()
  await page.getByRole('option', { name: RENAMED_TYPE_NAME }).click()
  await linkDialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('25')
  await expect(linkDialog.getByRole('textbox', { name: 'Marca atual' })).toHaveValue(
    PRIMARY_BRAND_NAME,
  )
  await expect(linkDialog.getByText('R$ 125,00')).toBeVisible()
  await page.setViewportSize({ width: 676, height: 843 })
  await page.screenshot({
    path: 'test-results/integration-mrp/product-accompaniments-link-dialog-676x843.png',
  })
  const linkResponse = await captureResponse(
    page,
    'POST',
    `/products/${ownerProductId}/accompaniments`,
    () => linkDialog.getByRole('button', { name: 'Vincular' }).click(),
  )
  const linkedBody = await readResponseBody(linkResponse)
  const linkId = readId(linkedBody)
  expectApi(linkResponse, 'POST', `/products/${ownerProductId}/accompaniments`, 201)
  expect(linkResponse.request().postDataJSON()).toEqual({
    accompanimentProductId,
    accompanimentTypeId: readId(createdTypeBody),
    quantityPerPortion: 25,
  })
  expect(linkedBody).toMatchObject({
    accompanimentProductId,
    accompanimentTypeId: readId(createdTypeBody),
    quantityPerPortion: 25,
    brandName: PRIMARY_BRAND_NAME,
    unitCost: 5,
    estimatedCost: 125,
  })
  await expect(linkDialog).toBeHidden()
  await expect(page.getByText(ACCOMPANIMENT_PRODUCT_NAME, { exact: true })).toBeVisible()
  const linkedRow = page.getByRole('row').filter({ hasText: ACCOMPANIMENT_PRODUCT_NAME })
  await expect(linkedRow).toContainText('25 g')
  await page.setViewportSize({ width: 1560, height: 1097 })
  await page.screenshot({
    path: 'test-results/integration-mrp/product-accompaniments-populated-1560x1097.png',
  })
  await page.reload()
  await expect(page).toHaveURL(
    new RegExp(`/products/${ownerProductId}/accompaniments/?$`),
  )
  await expect(
    page.getByRole('row').filter({ hasText: ACCOMPANIMENT_PRODUCT_NAME }),
  ).toContainText('25 g')

  await page.setViewportSize({ width: 320, height: 900 })
  await expect(
    page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).resolves.toBe(true)
  await page.screenshot({
    path: 'test-results/integration-mrp/product-accompaniments-narrow-320x900.png',
  })
  await page.getByRole('button', { name: `Editar ${ACCOMPANIMENT_PRODUCT_NAME}` }).focus()
  await page.keyboard.press('Enter')
  const narrowEditDialog = page.getByRole('dialog', { name: 'Editar acompanhamento' })
  await expect(narrowEditDialog).toBeVisible()
  await narrowEditDialog.getByRole('button', { name: 'Cancelar' }).click()
  await page.setViewportSize({ width: 1280, height: 900 })

  await page.setViewportSize({ width: 676, height: 843 })
  await page.getByRole('button', { name: `Editar ${ACCOMPANIMENT_PRODUCT_NAME}` }).click()
  const editDialog = page.getByRole('dialog', { name: 'Editar acompanhamento' })
  await expect(editDialog.getByText('R$ 125,00')).toBeVisible()
  await page.screenshot({
    path: 'test-results/integration-mrp/product-accompaniments-edit-dialog-676x843.png',
  })
  await page.setViewportSize({ width: 1280, height: 900 })
  await editDialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('30')
  const updateResponse = await captureResponse(
    page,
    'PATCH',
    `/products/${ownerProductId}/accompaniments/${linkId}`,
    () => editDialog.getByRole('button', { name: 'Salvar alterações' }).click(),
  )
  expectApi(
    updateResponse,
    'PATCH',
    `/products/${ownerProductId}/accompaniments/${linkId}`,
    200,
  )
  expect(updateResponse.request().postDataJSON()).toEqual({
    accompanimentTypeId: readId(createdTypeBody),
    quantityPerPortion: 30,
  })
  expect(await readResponseBody(updateResponse)).toMatchObject({
    id: linkId,
    quantityPerPortion: 30,
    brandName: PRIMARY_BRAND_NAME,
    unitCost: 5,
    estimatedCost: 150,
  })
  await expect(editDialog).toBeHidden()
  await expect(
    page.getByRole('row').filter({ hasText: ACCOMPANIMENT_PRODUCT_NAME }),
  ).toContainText('30 g')
  await page.reload()
  await expect(
    page.getByRole('row').filter({ hasText: ACCOMPANIMENT_PRODUCT_NAME }),
  ).toContainText('30 g')

  await page
    .getByRole('button', { name: `Remover ${ACCOMPANIMENT_PRODUCT_NAME}` })
    .click()
  const removeLinkDialog = page.getByRole('alertdialog', {
    name: 'Remover acompanhamento?',
  })
  await expect(removeLinkDialog).toBeVisible()
  await expect(removeLinkDialog).toContainText(
    'estoque e o histórico permanecem intactos',
  )
  const removeLinkResponse = await captureResponse(
    page,
    'DELETE',
    `/products/${ownerProductId}/accompaniments/${linkId}`,
    () => removeLinkDialog.getByRole('button', { name: 'Remover' }).click(),
  )
  expectApi(
    removeLinkResponse,
    'DELETE',
    `/products/${ownerProductId}/accompaniments/${linkId}`,
    204,
  )
  await expect(removeLinkDialog).toBeHidden()
  await expect(page.getByText('Nenhum acompanhamento vinculado')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Nenhum acompanhamento vinculado')).toBeVisible()

  const afterOwnerStock = await readApi(
    request,
    managerToken,
    'GET',
    `/products/${ownerProductId}/stock`,
  )
  const afterOwnerHistory = await readApi(
    request,
    managerToken,
    'GET',
    `/products/${ownerProductId}/stock-transactions?page=1&limit=20`,
  )
  const afterAccompanimentStock = await readApi(
    request,
    managerToken,
    'GET',
    `/products/${accompanimentProductId}/stock`,
  )
  const afterAccompanimentHistory = await readApi(
    request,
    managerToken,
    'GET',
    `/products/${accompanimentProductId}/stock-transactions?page=1&limit=20`,
  )
  expectApi(afterOwnerStock.response, 'GET', `/products/${ownerProductId}/stock`, 200)
  expectApi(
    afterOwnerHistory.response,
    'GET',
    `/products/${ownerProductId}/stock-transactions?page=1&limit=20`,
    200,
  )
  expectApi(
    afterAccompanimentStock.response,
    'GET',
    `/products/${accompanimentProductId}/stock`,
    200,
  )
  expectApi(
    afterAccompanimentHistory.response,
    'GET',
    `/products/${accompanimentProductId}/stock-transactions?page=1&limit=20`,
    200,
  )
  expect(afterOwnerStock.body).toEqual(beforeOwnerStock.body)
  expect(afterOwnerHistory.body).toEqual(beforeOwnerHistory.body)
  expect(afterAccompanimentStock.body).toEqual(beforeAccompanimentStock.body)
  expect(afterAccompanimentHistory.body).toEqual(beforeAccompanimentHistory.body)

  // Foreign-tenant browser isolation is covered by EV-019/F5; the local stack
  // has no prepared foreign Manager account or second tenant fixture.
  const missingProductRead = await readApi(
    request,
    managerToken,
    'GET',
    `/products/${MISSING_PRODUCT_ID}/accompaniments`,
  )
  expectApi(
    missingProductRead.response,
    'GET',
    `/products/${MISSING_PRODUCT_ID}/accompaniments`,
    404,
  )

  const operatorContext = await browser.newContext({ baseURL: 'http://127.0.0.1:4000' })
  const operatorPage = await operatorContext.newPage()
  try {
    await signIn(operatorPage, OPERATOR_ACCOUNT)
    await operatorPage.goto('/accompaniment-types')
    await expect(operatorPage).toHaveURL(/\/access-denied\/?$/)
    await expect(
      operatorPage.getByRole('heading', { name: 'Acesso negado' }),
    ).toBeVisible()
    const operatorToken = await readAccessToken(operatorPage)
    const operatorRead = await readApi(
      request,
      operatorToken,
      'GET',
      `/products/${ownerProductId}/accompaniments`,
    )
    expectApi(
      operatorRead.response,
      'GET',
      `/products/${ownerProductId}/accompaniments`,
      403,
    )
  } finally {
    await closeContext(operatorContext)
  }

  const anonymousContext = await browser.newContext({ baseURL: 'http://127.0.0.1:4000' })
  const anonymousPage = await anonymousContext.newPage()
  try {
    await anonymousContext.clearCookies()
    await anonymousPage.addInitScript(() => localStorage.clear())
    await anonymousPage.goto(`/products/${ownerProductId}/accompaniments`)
    await expect(anonymousPage).toHaveURL(/\/login\?returnTo=.*products.*accompaniments/)
    const anonymousRead = await readApi(
      request,
      undefined,
      'GET',
      `/products/${ownerProductId}/accompaniments`,
    )
    expectApi(
      anonymousRead.response,
      'GET',
      `/products/${ownerProductId}/accompaniments`,
      401,
    )
  } finally {
    await closeContext(anonymousContext)
  }

  const expectedConsoleWarnings = consoleErrors.filter((message) =>
    message.includes(
      "Can't perform a React state update on a component that hasn't mounted yet",
    ),
  )
  const unexpectedConsoleErrors = consoleErrors.filter(
    (message) => !expectedConsoleWarnings.includes(message),
  )
  expect(unexpectedConsoleErrors).toEqual([])
  expect(failedRequests).toEqual([])

  await page.goto('/accompaniment-types')
  await expect(page.getByText(RENAMED_TYPE_NAME, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: `Remover ${RENAMED_TYPE_NAME}` }).click()
  const removeTypeDialog = page.getByRole('alertdialog', {
    name: 'Remover tipo de acompanhamento?',
  })
  const removeTypeResponse = await captureResponse(
    page,
    'DELETE',
    `/accompaniment-types/${readId(createdTypeBody)}`,
    () => removeTypeDialog.getByRole('button', { name: 'Remover' }).click(),
  )
  expectApi(
    removeTypeResponse,
    'DELETE',
    `/accompaniment-types/${readId(createdTypeBody)}`,
    204,
  )
  await expect(removeTypeDialog).toBeHidden()
  await expect(page.getByText(RENAMED_TYPE_NAME, { exact: true })).toHaveCount(0)
  await page.reload()
  await expect(page.getByText(RENAMED_TYPE_NAME, { exact: true })).toHaveCount(0)
})

async function signIn(page: Page, account: AccountCredentials) {
  await page.goto('/login?returnTo=%2Faccompaniment-types')
  await page.getByLabel('E-mail').fill(account.email)
  await page.getByRole('textbox', { name: 'Senha' }).fill(account.password)
  await page.getByRole('button', { name: 'Entrar no Scoops' }).click()
  await expect(page).toHaveURL(/\/accompaniment-types\/?(?:\?[^#]*)?$/)
}

async function closeContext(context: { close: () => Promise<void> }) {
  try {
    await context.close()
  } catch (error) {
    if (error instanceof Error && /closed|disposed/i.test(error.message)) return
    throw error
  }
}

async function readAccessToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      const rawValue = localStorage.getItem(key)
      if (!rawValue) continue
      try {
        const value: unknown = JSON.parse(rawValue)
        if (
          value &&
          typeof value === 'object' &&
          'access_token' in value &&
          typeof value.access_token === 'string'
        ) {
          return value.access_token
        }
      } catch {}
    }
    throw new Error('The real Supabase access token was not found in browser storage.')
  })
}

async function registerProduct(
  request: APIRequestContext,
  token: string,
  body: Record<string, unknown>,
): Promise<string> {
  const result = await readApi(request, token, 'POST', '/products', body)
  if (result.response.status() !== 201) {
    throw new Error(
      `Product registration failed with ${result.response.status()}: ${JSON.stringify(result.body)}`,
    )
  }
  expectApi(result.response, 'POST', '/products', 201)
  return readId(result.body)
}

async function readApi(
  request: APIRequestContext,
  token: string | undefined,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<ApiResult> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'
  const response = await request.fetch(`${SERVER_URL}${path}`, {
    data: body,
    headers,
    method,
  })
  return { body: await readResponseBody(response), response }
}

async function readResponseBody(
  response: APIResponse | BrowserResponse,
): Promise<unknown> {
  const text = await response.text()
  return text ? JSON.parse(text) : undefined
}

async function captureResponse(
  page: Page,
  method: string,
  path: string,
  action: () => Promise<void>,
): Promise<BrowserResponse> {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url() === `${SERVER_URL}${path}` && response.request().method() === method,
  )
  await action()
  return responsePromise
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

function readId(body: unknown): string {
  if (
    !body ||
    typeof body !== 'object' ||
    !('id' in body) ||
    typeof body.id !== 'string'
  ) {
    throw new Error('The real response did not contain an id.')
  }
  return body.id
}
