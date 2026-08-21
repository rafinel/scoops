import { expect, realTest as test } from '../../playwright'

const managerEmail = process.env.SCOOPS_E2E_EMAIL ?? 'manager.seed@scoops.com'
const managerPassword = process.env.SCOOPS_E2E_PASSWORD ?? '12345678'
const operatorEmail = 'operator.seed@scoops.com'
const operatorPassword = '12345678'

test('loads the Products catalog through the real authenticated server', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`)
  })

  await page.goto('/login')
  await page.getByLabel('E-mail').fill(managerEmail)
  await page.getByRole('textbox', { name: 'Senha' }).fill(managerPassword)
  await page.getByRole('button', { name: 'Entrar no Scoops' }).click()
  await expect(page).toHaveURL(/\/$/)

  const productsResponsePromise = page.waitForResponse((response) =>
    response.url().includes('3336/products?'),
  )
  await page.goto('/products')
  const productsResponse = await productsResponsePromise
  const responseBody = await productsResponse.text()

  expect(
    productsResponse.status(),
    `Products response body: ${responseBody}`,
  ).toBeLessThan(500)
  const requestUrl = new URL(productsResponse.url())
  expect(requestUrl.searchParams.get('sortBy')).toBe('createdAt')
  expect(requestUrl.searchParams.get('sortDirection')).toBe('desc')
  const responseJson = JSON.parse(responseBody) as {
    items: Array<{ product: { createdAt: string } }>
  }
  const createdAtValues = responseJson.items.map((item) =>
    new Date(item.product.createdAt).getTime(),
  )
  expect(createdAtValues).toEqual([...createdAtValues].sort((a, b) => b - a))
  await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Paginação' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Página 2' })).toBeVisible()
  expect(
    consoleErrors.filter((message) => !message.includes('401 (Unauthorized)')),
  ).toEqual([])
  expect(failedRequests).toEqual([])
})

test('registers a by-brand product with the summed initial stock', async ({ page }) => {
  const productName = `Produto marca E2E ${Date.now()}`
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(managerEmail)
  await page.getByRole('textbox', { name: 'Senha' }).fill(managerPassword)
  await page.getByRole('button', { name: 'Entrar no Scoops' }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/products')

  await page.getByRole('button', { name: /Novo produto/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Novo produto' })
  await dialog.getByLabel('Nome do produto').fill(productName)
  await dialog.getByRole('checkbox').first().check()
  await dialog.getByText('Permitir estoque negativo', { exact: true }).click()
  await dialog.getByRole('button', { name: 'Por marca' }).click()
  await dialog.getByRole('textbox', { name: 'Nome', exact: true }).fill('Marca E2E')
  await dialog.getByRole('spinbutton', { name: 'Qtd. por embalagem' }).fill('2')
  await dialog.getByRole('spinbutton', { name: 'Quantidade de embalagens' }).fill('3')
  await expect(dialog.getByRole('spinbutton', { name: 'Estoque inicial' })).toHaveValue(
    '6',
  )
  await dialog.getByRole('spinbutton', { name: 'Estoque ideal' }).fill('10')

  const registrationResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/products') && response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Criar produto' }).click()
  const registrationResponse = await registrationResponsePromise
  const registrationBody = JSON.parse(await registrationResponse.text()) as {
    name: string
    allowNegativeStock: boolean
  }
  expect(registrationBody).toMatchObject({
    name: productName,
    allowNegativeStock: true,
  })
  expect(registrationResponse.status()).toBe(201)
})

test('opens a newly registered product and commits a real single-stock entry', async ({
  page,
}) => {
  const productName = `Produto estoque E2E ${Date.now()}`
  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`)
  })

  await page.goto('/login')
  await page.getByLabel('E-mail').fill(managerEmail)
  await page.getByRole('textbox', { name: 'Senha' }).fill(managerPassword)
  await page.getByRole('button', { name: 'Entrar no Scoops' }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/products')

  await page.getByRole('button', { name: /Novo produto/ }).click()
  const registrationDialog = page.getByRole('dialog', { name: 'Novo produto' })
  await registrationDialog.getByLabel('Nome do produto').fill(productName)
  await registrationDialog.getByRole('checkbox', { name: 'Ingrediente' }).check()
  await registrationDialog.getByRole('spinbutton', { name: 'Estoque inicial' }).fill('1')
  await registrationDialog.getByRole('spinbutton', { name: 'Estoque ideal' }).fill('10')

  const registrationResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/products') && response.request().method() === 'POST',
  )
  await registrationDialog.getByRole('button', { name: 'Criar produto' }).click()
  const registrationResponse = await registrationResponsePromise
  expect(registrationResponse.status()).toBe(201)
  const registeredProduct = (await registrationResponse.json()) as { id: string }

  const detailResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      response.request().method() === 'GET' &&
      url.pathname === `/products/${registeredProduct.id}/stock`
    )
  })
  await page.goto(`/products/${registeredProduct.id}`)
  expect((await detailResponsePromise).status()).toBe(200)
  await expect(page.getByRole('heading', { name: productName })).toBeVisible()

  await page.getByRole('button', { name: 'Entrada' }).click()
  const adjustmentDialog = page.getByRole('dialog', { name: 'Entrada de estoque' })
  await adjustmentDialog.getByLabel('Quantidade').fill('2')
  const adjustmentResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      response.request().method() === 'POST' &&
      url.pathname === `/products/${registeredProduct.id}/stock-adjustments`
    )
  })
  await adjustmentDialog.getByRole('button', { name: 'Confirmar entrada' }).click()
  const adjustmentResponse = await adjustmentResponsePromise
  expect(adjustmentResponse.status()).toBe(201)
  expect(adjustmentResponse.request().postDataJSON()).toEqual({
    type: 'entry',
    quantity: 2,
  })
  await expect(adjustmentDialog).toBeHidden()
  await expect(page.getByText('3 un', { exact: true }).first()).toBeVisible()
  await expect(
    page.getByRole('row', {
      name: /Entrada Manual Produto \+2 un Scoops Manager/,
    }),
  ).toBeVisible()
  expect(consoleErrors).toEqual([])
  expect(failedRequests).toEqual([])
})

test('applies repeated category filters through the real authenticated server', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`)
  })

  await page.goto('/login')
  await page.getByLabel('E-mail').fill(managerEmail)
  await page.getByRole('textbox', { name: 'Senha' }).fill(managerPassword)
  await page.getByRole('button', { name: 'Entrar no Scoops' }).click()
  await expect(page).toHaveURL(/\/$/)

  const initialProductsResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      response.request().method() === 'GET' &&
      url.port === '3336' &&
      url.pathname === '/products'
    )
  })
  await page.goto('/products')
  const initialProductsResponse = await initialProductsResponsePromise
  const initialResponseJson = (await initialProductsResponse.json()) as {
    items: unknown[]
    kpis: { products: number; brands: number; lowStock: number }
    total?: number
    totalItems?: number
  }
  const initialTotalItems =
    initialResponseJson.totalItems ?? initialResponseJson.total ?? 0
  await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
  await page.getByRole('button', { name: 'Filtros' }).click()
  const filtersDialog = page.getByRole('dialog', { name: 'Filtrar produtos' })
  await filtersDialog.getByRole('button', { name: 'Acompanhamento' }).click()
  await filtersDialog.getByRole('button', { name: 'Fabricável' }).click()

  const productsResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      response.request().method() === 'GET' &&
      url.port === '3336' &&
      url.pathname === '/products'
    )
  })
  await filtersDialog.getByRole('button', { name: 'Aplicar filtros' }).click()
  const productsResponse = await productsResponsePromise
  const responseBody = await productsResponse.text()

  expect(productsResponse.status(), `Products response body: ${responseBody}`).toBe(200)
  const requestUrl = new URL(productsResponse.url())
  expect(requestUrl.searchParams.getAll('category')).toEqual([
    'accompaniment',
    'manufacturable',
  ])
  expect(requestUrl.searchParams.get('categories')).toBeNull()
  expect(requestUrl.searchParams.get('sortBy')).toBe('createdAt')
  expect(requestUrl.searchParams.get('sortDirection')).toBe('desc')
  expect(requestUrl.searchParams.get('page')).toBe('1')

  const responseJson = JSON.parse(responseBody) as {
    items: Array<{ product: { name: string; categories: string[] } }>
    kpis: { products: number; brands: number; lowStock: number }
    total?: number
    totalItems?: number
  }
  const totalItems = responseJson.totalItems ?? responseJson.total ?? 0
  expect(totalItems).toBeGreaterThan(0)
  expect(totalItems).toBeLessThan(initialTotalItems)
  expect(responseJson.items).toHaveLength(totalItems)
  expect(responseJson.kpis).toEqual(initialResponseJson.kpis)
  expect(
    responseJson.items.every((item) =>
      item.product.categories.some((category) =>
        ['accompaniment', 'manufacturable'].includes(category),
      ),
    ),
  ).toBe(true)
  expect(responseJson.items.some((item) => item.product.name === 'Granola')).toBe(true)
  expect(
    responseJson.items.some((item) => item.product.name === 'Açaí tradicional 300 ml'),
  ).toBe(true)
  expect(responseJson.items.some((item) => item.product.name === 'Açaí base')).toBe(false)
  await expect(page).toHaveURL(
    /\/products\?search=&categories=%5B%22accompaniment%22%2C%22manufacturable%22%5D&sortBy=createdAt&sortDirection=desc&page=1$/,
  )
  await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
  await expect(page.getByText('Não foi possível carregar os produtos.')).toHaveCount(0)
  await expect(page.getByText('Granola', { exact: true })).toBeVisible()
  await expect(page.getByText('Açaí tradicional 300 ml', { exact: true })).toBeVisible()
  await page.screenshot({
    path: 'test-results/products-filters-applied-1481x1450.png',
    fullPage: true,
  })
  expect(consoleErrors).toEqual([])
  expect(failedRequests).toEqual([])
})

test('redirects an unauthenticated Products visit to login with its return path', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`)
  })

  await page.goto('/products')
  await expect(page).toHaveURL(/\/login\?returnTo=/)
  expect(new URL(page.url()).searchParams.get('returnTo')).toBe(
    '/products?search=&categories=%5B%5D&sortBy=createdAt&sortDirection=desc&page=1',
  )
  expect(
    consoleErrors.filter((message) => !message.includes('401 (Unauthorized)')),
  ).toEqual([])
  expect(failedRequests).toEqual([])
})

test('shows the Products error state when an authenticated operator receives 403', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`)
  })

  await page.goto('/login')
  await page.getByLabel('E-mail').fill(operatorEmail)
  await page.getByRole('textbox', { name: 'Senha' }).fill(operatorPassword)
  await page.getByRole('button', { name: 'Entrar no Scoops' }).click()
  await expect(page).toHaveURL(/\/$/)

  const productsResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      response.request().method() === 'GET' &&
      url.port === '3336' &&
      url.pathname === '/products'
    )
  })
  await page.goto('/products')
  const productsResponse = await productsResponsePromise
  expect(productsResponse.status()).toBe(403)
  expect(new URL(productsResponse.url()).pathname).toBe('/products')
  await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
  await expect(page.getByText('Não foi possível carregar os produtos.')).toBeVisible()
  expect(consoleErrors.filter((message) => !message.includes('403 (Forbidden)'))).toEqual(
    [],
  )
  expect(failedRequests).toEqual([])
})
