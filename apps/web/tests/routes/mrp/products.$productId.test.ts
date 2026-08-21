import path from 'node:path'

import type { Page } from '@playwright/test'

import { expect, test } from '../../playwright'

const PRODUCT_ID = 'product-1'
const PRIMARY_BRAND_ID = 'brand-primary'
const SECONDARY_BRAND_ID = 'brand-secondary'
const SCREENSHOT_DIRECTORY = path.resolve(process.cwd(), 'test-results')

const PRODUCT = {
  id: PRODUCT_ID,
  establishmentId: 'establishment-1',
  name: 'Polpa de morango',
  unit: 'kg',
  categories: ['ingredient'],
  stockControl: 'by-brand',
  status: 'active',
  allowNegativeStock: false,
  idealStock: 10,
  createdAt: '2026-08-18T12:00:00.000Z',
  updatedAt: '2026-08-18T12:00:00.000Z',
}

const BRANDS = [
  createBrand(PRIMARY_BRAND_ID, 'Frooty', true, 12),
  createBrand(SECONDARY_BRAND_ID, 'Frutamil', false, 6),
]

const TRANSACTIONS = {
  items: [
    {
      id: 'transaction-1',
      establishmentId: 'establishment-1',
      productId: PRODUCT_ID,
      brandId: PRIMARY_BRAND_ID,
      type: 'entry',
      quantity: 4,
      resultingBalance: 12,
      productName: PRODUCT.name,
      brandName: 'Frooty',
      performedBy: 'manager-1',
      performedByName: 'Maria Silva',
      unit: 'kg',
      occurredAt: '2026-08-18T12:30:00.000Z',
    },
  ],
  page: 1,
  limit: 5,
  total: 1,
}

test.describe('Product stock route with mocked transport', () => {
  test('redirects anonymous access and preserves the semantic product path', async ({
    page,
  }) => {
    await page.goto(`/products/${PRODUCT_ID}`)
    await page.waitForURL(/\/login\?returnTo=/)
    await expect(page).toHaveURL(/\/login\?returnTo=/)
    expect(new URL(page.url()).searchParams.get('returnTo')).toContain(
      `/products/${PRODUCT_ID}`,
    )
  })

  test('loads the canonical populated route and captures exact detail and history requests', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    const consoleErrors: string[] = []
    const failedRequests: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()}`)
    })
    const { requests } = await mrp.mockProductStock({
      respond: ({ url }) =>
        url.pathname.endsWith('/stock-transactions')
          ? { body: TRANSACTIONS }
          : { body: createStockResponse() },
    })

    await page.setViewportSize({ width: 1560, height: 1320 })
    await navigateToProductStock(page)
    await expect(page).toHaveURL(new RegExp(`/products/${PRODUCT_ID}$`))
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible()
    await expect(page.getByText('Normal', { exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Frooty', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Maria Silva' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '+4 kg' })).toBeVisible()
    await expect.poll(() => requests.length).toBe(2)
    expect(requests.map(({ method, url }) => `${method} ${url.pathname}`)).toEqual([
      `GET /products/${PRODUCT_ID}/stock`,
      `GET /products/${PRODUCT_ID}/stock-transactions`,
    ])
    const historyRequest = requests[1]?.url
    expect(historyRequest?.searchParams.get('page')).toBe('1')
    expect(historyRequest?.searchParams.get('limit')).toBe('5')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-by-brand-stock-1560x1320.png'),
      fullPage: true,
    })
    expect(consoleErrors).toEqual([])
    expect(failedRequests).toEqual([])
  })

  test('recovers detail and independent history request failures', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    let detailRequests = 0
    let historyRequests = 0
    await mrp.mockProductStock({
      respond: ({ url }) => {
        if (url.pathname.endsWith('/stock-transactions')) {
          historyRequests += 1
          return historyRequests === 1
            ? { body: { message: 'history unavailable' }, status: 503 }
            : { body: TRANSACTIONS }
        }
        detailRequests += 1
        return detailRequests === 1
          ? { body: { message: 'detail unavailable' }, status: 503 }
          : { body: createStockResponse() }
      },
    })

    await page.setViewportSize({ width: 1280, height: 900 })
    await navigateToProductStock(page)
    await expect(page.getByText('Não foi possível carregar o estoque')).toBeVisible()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-error-1280x900.png'),
      fullPage: true,
    })
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible()
    await expect(page.getByText('Não foi possível carregar o histórico.')).toBeVisible()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-history-error-1280x900.png'),
      fullPage: true,
    })
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('cell', { name: 'Maria Silva' })).toBeVisible()
    expect(detailRequests).toBe(2)
    expect(historyRequests).toBe(2)
  })

  test('filters history with exact query values and distinguishes filtered empty', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    const { requests } = await mrp.mockProductStock({
      respond: ({ url }) =>
        url.pathname.endsWith('/stock-transactions')
          ? {
              body:
                url.searchParams.get('type') === 'write-off'
                  ? { ...TRANSACTIONS, items: [], total: 0 }
                  : TRANSACTIONS,
            }
          : { body: createStockResponse() },
    })

    await navigateToProductStock(page)
    await expect(page.getByRole('cell', { name: 'Maria Silva' })).toBeVisible()
    await page.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Baixa Manual' }).click()
    await expect(
      page.getByText('Nenhuma movimentação corresponde aos filtros.'),
    ).toBeVisible()
    const request = requests.at(-1)
    expect(request?.method).toBe('GET')
    expect(request?.url.pathname).toBe(`/products/${PRODUCT_ID}/stock-transactions`)
    expect(request?.url.searchParams.get('type')).toBe('write-off')
    expect(request?.url.searchParams.get('page')).toBe('1')
    expect(request?.url.searchParams.get('limit')).toBe('5')
    const toDateInput = page.getByLabel('Até')
    await toDateInput.focus()
    await expect(toDateInput).toBeFocused()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-history-filtered-empty-1280x900.png'),
      fullPage: true,
    })
  })

  test('adds a brand without client-owned primary state and refreshes the page', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    const { requests } = await mrp.mockProductStock({
      respond: ({ method, url }) => {
        if (method === 'POST' && url.pathname.endsWith('/brands')) {
          return { body: createBrand('brand-new', 'Nova marca', false, 3), status: 201 }
        }
        if (url.pathname.endsWith('/stock-transactions')) return { body: TRANSACTIONS }
        return { body: createStockResponse() }
      },
    })

    await page.setViewportSize({ width: 676, height: 771 })
    await navigateToProductStock(page)
    await page.getByRole('button', { name: 'Adicionar marca' }).click()
    const dialog = page.getByRole('dialog', { name: 'Adicionar marca' })
    await expect(dialog.getByRole('textbox', { name: 'Nome da marca' })).toBeFocused()
    await dialog.getByRole('textbox', { name: 'Nome da marca' }).fill('Nova marca')
    await dialog.getByRole('textbox', { name: 'Qtd. por embalagem' }).fill('2')
    await dialog.getByRole('textbox', { name: 'Valor por embalagem' }).fill('10')
    await dialog.getByRole('textbox', { name: 'Estoque inicial (opcional)' }).fill('3')
    await dialog.getByRole('textbox', { name: 'Nome da marca' }).focus()
    await expect(dialog.getByRole('textbox', { name: 'Nome da marca' })).toBeFocused()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-add-brand-676x771.png'),
    })
    await dialog.getByRole('button', { name: 'Confirmar' }).click()
    await expect(dialog).toBeHidden()
    const request = requests.find(
      ({ method, url }) => method === 'POST' && url.pathname.endsWith('/brands'),
    )
    expect(request?.url.pathname).toBe(`/products/${PRODUCT_ID}/brands`)
    expect(request?.body).toEqual({
      name: 'Nova marca',
      packageQuantity: 2,
      packageValue: 10,
      initialQuantity: 3,
    })
  })

  test('submits package adjustment as an exact base-unit quantity', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    const { requests } = await mrp.mockProductStock({
      respond: ({ method, url }) => {
        if (method === 'POST' && url.pathname.endsWith('/stock-adjustments')) {
          return { body: { quantity: 16 } }
        }
        if (url.pathname.endsWith('/stock-transactions')) return { body: TRANSACTIONS }
        return { body: createStockResponse() }
      },
    })

    await navigateToProductStock(page)
    await page.getByRole('button', { name: 'Entrada de estoque' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Entrada de estoque' })
    await dialog.getByRole('button', { name: 'Embalagens' }).click()
    await dialog.getByLabel('Quantidade').fill('2')
    await expect(dialog.getByText('2 × 2 kg = 4 kg')).toBeVisible()
    await dialog.getByRole('button', { name: 'Confirmar entrada' }).click()
    await expect(dialog).toBeHidden()
    const request = requests.find(({ url }) =>
      url.pathname.endsWith('/stock-adjustments'),
    )
    expect(request?.method).toBe('POST')
    expect(request?.url.pathname).toBe(`/products/${PRODUCT_ID}/stock-adjustments`)
    expect(request?.body).toEqual({
      brandId: PRIMARY_BRAND_ID,
      type: 'entry',
      quantity: 4,
    })
  })

  test('supports keyboard menu focus and has no page overflow at 320 pixels', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    await mrp.mockProductStock({
      respond: ({ url }) =>
        url.pathname.endsWith('/stock-transactions')
          ? { body: TRANSACTIONS }
          : { body: createStockResponse() },
    })

    await page.setViewportSize({ width: 320, height: 900 })
    await navigateToProductStock(page)
    const trigger = page.getByRole('button', {
      name: 'Abrir ações da marca Frutamil',
    })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menuitem', { name: 'Editar marca' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(
      page.getByRole('menuitem', { name: 'Definir como principal' }),
    ).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-narrow-page-320x900.png'),
      fullPage: true,
    })
  })

  test('captures the remaining brand dialog and menu reference states', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    await mrp.mockProductStock({
      respond: ({ url }) =>
        url.pathname.endsWith('/stock-transactions')
          ? { body: TRANSACTIONS }
          : { body: createStockResponse() },
    })

    await navigateToProductStock(page)
    const secondaryActions = page.getByRole('button', {
      name: 'Abrir ações da marca Frutamil',
    })

    await page.setViewportSize({ width: 293, height: 188 })
    await secondaryActions.click()
    await expect(page.getByRole('menuitem', { name: 'Editar marca' })).toBeVisible()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-brand-actions-293x188.png'),
    })
    await page.keyboard.press('Escape')

    await page.setViewportSize({ width: 676, height: 771 })
    await secondaryActions.click()
    await page.getByRole('menuitem', { name: 'Editar marca' }).click()
    const editDialog = page.getByRole('dialog', { name: 'Editar marca' })
    await expect(editDialog.getByText('Estoque inicial (opcional)')).toHaveCount(0)
    const packageValueInput = editDialog.getByLabel('Valor por embalagem')
    await packageValueInput.focus()
    await expect(packageValueInput).toBeFocused()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-edit-brand-676x771.png'),
    })
    await page.keyboard.press('Escape')

    await page.setViewportSize({ width: 596, height: 353 })
    await secondaryActions.click()
    await page.getByRole('menuitem', { name: 'Excluir marca' }).click()
    await expect(page.getByRole('alertdialog', { name: 'Excluir marca?' })).toBeVisible()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-delete-brand-596x353.png'),
    })

    await page.setViewportSize({ width: 320, height: 900 })
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await secondaryActions.click()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-narrow-menu-320x900.png'),
    })
    await page.getByRole('menuitem', { name: 'Editar marca' }).click()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-narrow-dialog-320x900.png'),
    })
  })

  test('captures single, package, insufficient, and empty states', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    let stockResponse = createStockResponse()
    let historyResponse = TRANSACTIONS
    await mrp.mockProductStock({
      respond: ({ url }) =>
        url.pathname.endsWith('/stock-transactions')
          ? { body: historyResponse }
          : { body: stockResponse },
    })

    await page.setViewportSize({ width: 676, height: 771 })
    await navigateToProductStock(page)
    await page.getByRole('button', { name: 'Entrada de estoque' }).first().click()
    const packageDialog = page.getByRole('dialog', { name: 'Entrada de estoque' })
    await packageDialog.getByRole('button', { name: 'Embalagens' }).click()
    await packageDialog.getByLabel('Quantidade').fill('2')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-package-adjustment-success-676x771.png'),
    })
    await page.keyboard.press('Escape')
    await expect(packageDialog).toBeHidden()
    await page.getByRole('button', { name: 'Baixa de estoque' }).first().click()
    const writeOffDialog = page.getByRole('dialog', { name: 'Baixa de estoque' })
    await writeOffDialog.getByRole('button', { name: 'Embalagens' }).click()
    await writeOffDialog.getByLabel('Quantidade').fill('7')
    await expect(writeOffDialog.getByText(/Estoque insuficiente/)).toBeVisible()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-package-adjustment-insufficient-676x771.png'),
    })
    await page.keyboard.press('Escape')

    stockResponse = {
      ...createStockResponse(),
      product: { ...PRODUCT, stockControl: 'single' },
      stockQuantity: 3,
      brands: [],
    }
    await page.reload()
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.getByRole('button', { name: 'Entrada' }).click()
    await page
      .getByRole('dialog', { name: 'Entrada de estoque' })
      .getByLabel('Quantidade')
      .fill('2')
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-single-adjustment-1280x900.png'),
      fullPage: true,
    })
    await page.keyboard.press('Escape')

    stockResponse = {
      ...createStockResponse(),
      stockQuantity: 0,
      stockSituation: 'low',
      brands: [],
    }
    historyResponse = { ...TRANSACTIONS, items: [], total: 0 }
    await page.reload()
    await expect(page.getByText('Nenhuma marca cadastrada')).toBeVisible()
    await expect(page.getByText('Abaixo do ideal', { exact: true })).toBeVisible()
    await expect(page.getByText('Nenhuma movimentação registrada.')).toBeVisible()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-empty-brands-1280x900.png'),
      fullPage: true,
    })

    stockResponse = createStockResponse()
    await page.reload()
    await expect(page.getByText('Normal', { exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: /^Frooty/ })).toBeVisible()
    await expect(page.getByText('Nenhuma movimentação registrada.')).toBeVisible()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-history-empty-1280x900.png'),
      fullPage: true,
    })
  })

  test('captures independent detail and history loading states', async ({
    page,
    identity,
    mrp,
  }) => {
    await identity.mockManagerSession()
    await identity.mockManagerAccount()
    let releaseDetail!: () => void
    const detailGate = new Promise<void>((resolve) => {
      releaseDetail = resolve
    })
    let historyDelayed = true
    await mrp.mockProductStock({
      respond: async ({ url }) => {
        if (url.pathname.endsWith('/stock-transactions')) {
          if (historyDelayed) await new Promise((resolve) => setTimeout(resolve, 800))
          return { body: TRANSACTIONS }
        }
        await detailGate
        return { body: createStockResponse() }
      },
    })

    await page.setViewportSize({ width: 1280, height: 900 })
    const pendingDetailRequest = page.waitForRequest(
      (request) =>
        request.method() === 'GET' &&
        new URL(request.url()).pathname === `/products/${PRODUCT_ID}/stock`,
    )
    const navigation = page.goto(`/products/${PRODUCT_ID}`)
    await pendingDetailRequest
    await expect(
      page.getByRole('status', { name: 'Carregando estoque do produto' }),
    ).toBeVisible()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-loading-1280x900.png'),
      fullPage: true,
    })
    releaseDetail()
    await navigation
    await expect(page.getByText('Carregando histórico…')).toBeVisible()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIRECTORY, 'products-details-history-loading-1280x900.png'),
      fullPage: true,
    })
    historyDelayed = false
    await expect(page.getByRole('cell', { name: 'Maria Silva' })).toBeVisible()
  })
})

function createBrand(
  id: string,
  name: string,
  isPrimary: boolean,
  stockQuantity: number,
) {
  return {
    brand: {
      id,
      establishmentId: 'establishment-1',
      productId: PRODUCT_ID,
      name,
      packageQuantity: 2,
      packagePrice: 10,
      isPrimary,
      createdAt: '2026-08-18T12:00:00.000Z',
      updatedAt: '2026-08-18T12:00:00.000Z',
    },
    stockQuantity,
    unitPrice: 5,
  }
}

async function navigateToProductStock(page: Page) {
  const stockResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      new URL(response.url()).pathname === `/products/${PRODUCT_ID}/stock`,
  )
  await page.goto(`/products/${PRODUCT_ID}`)
  await (await stockResponse).finished()
}

function createStockResponse() {
  return {
    product: PRODUCT,
    stockQuantity: 18,
    idealStock: 10,
    stockSituation: 'normal',
    brands: BRANDS,
  }
}
