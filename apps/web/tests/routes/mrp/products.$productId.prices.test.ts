import path from 'node:path'
import type { Page } from '@playwright/test'

import { ProductFaker, ProductSizeFaker } from '@scoops/core/mrp/domain/entities/fakers'

import { expect, test } from '../../playwright'

const PRODUCT_ID = 'product-pricing-1'
const SIZE_ID = 'size-small'
const SCREENSHOT_DIRECTORY = path.resolve(process.cwd(), 'test-results')

async function captureViewport(page: Page, filename: string) {
  const viewport = page.viewportSize()
  if (!viewport) throw new Error('Playwright viewport is not configured')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      try {
        animation.finish()
      } catch {
        // An animation may already be complete when the screenshot settles.
      }
    }
  })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
    path: path.join(SCREENSHOT_DIRECTORY, filename),
  })
}

const PORTION_PRODUCT = ProductFaker.fake({
  id: PRODUCT_ID,
  establishmentId: 'establishment-1',
  name: 'Açaí especial',
  unit: 'ml',
  categories: ['portion'],
  stockControl: 'single',
  status: 'active',
})

const PORTION_SIZE = ProductSizeFaker.fake({
  id: SIZE_ID,
  establishmentId: 'establishment-1',
  productId: PRODUCT_ID,
  name: '300 ml',
  quantity: 300,
  price: 18.5,
  isActive: true,
})

const RESALE_PRODUCT = ProductFaker.fake({
  id: PRODUCT_ID,
  establishmentId: 'establishment-1',
  name: 'Pote de açaí',
  unit: 'un',
  categories: ['resale'],
  stockControl: 'single',
  status: 'active',
})

test.describe('Product pricing route with mocked transport', () => {
  test('redirects anonymous access and preserves the semantic product path', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1560, height: 1178 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await page.waitForURL(/\/login\?returnTo=/)
    await expect(page).toHaveURL(/\/login\?returnTo=/)
    expect(new URL(page.url()).searchParams.get('returnTo')).toBe(
      `/products/${PRODUCT_ID}/prices`,
    )
  })

  test('renders a populated Portion table at the canonical URL', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const consoleErrors: string[] = []
    const failedRequests: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()}`)
    })
    const { requests } = await mrpFixture.mockProductPricing({
      respond: () => ({ body: portionPricingResponse([PORTION_SIZE]) }),
    })

    await page.setViewportSize({ width: 1560, height: 1178 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)

    await expect(page).toHaveURL(`/products/${PRODUCT_ID}/prices`)
    await expect(page.getByRole('heading', { name: PORTION_PRODUCT.name })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tamanhos e preços' })).toBeVisible()
    await expect(page.getByRole('row', { name: /300 ml.*300 ml/ })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'R$ 18,50' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Lucro' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'R$ 11,00' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Editar 300 ml' })).toBeVisible()
    expect(requests[0]?.method).toBe('GET')
    expect(requests[0]?.url.pathname).toBe(`/products/${PRODUCT_ID}/pricing`)
    await captureViewport(page, 'pricing-portion-populated-1560x1178.png')
    expect(consoleErrors).toEqual([])
    expect(failedRequests).toEqual([])
  })

  test('captures a populated Portion table with horizontal scrolling at 390x844', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductPricing({
      respond: () => ({ body: portionPricingResponse([PORTION_SIZE]) }),
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)

    await expect(page.getByRole('heading', { name: PORTION_PRODUCT.name })).toBeVisible()
    await expect(page.getByRole('row', { name: /300 ml.*300 ml/ })).toBeVisible()
    const tableViewport = page.getByRole('table').locator('..')
    await expect
      .poll(() =>
        tableViewport.evaluate((element) => element.scrollWidth > element.clientWidth),
      )
      .toBe(true)
    await captureViewport(page, 'f4-fnd011-portion-populated-scroll-390x844.png')
  })

  test('captures the supplied Portion references after the label correction', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductPricing({
      respond: () => ({ body: portionPricingResponse([PORTION_SIZE]) }),
    })

    await page.setViewportSize({ width: 1560, height: 1178 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await expect(page.getByRole('heading', { name: PORTION_PRODUCT.name })).toBeVisible()
    await expect(page.getByRole('row', { name: /300 ml.*300 ml/ })).toBeVisible()
    await captureViewport(page, 'f4-fnd003-X1avQ-1560x1178.png')

    const addButton = page.getByRole('button', { name: 'Adicionar tamanho' })
    await addButton.click()
    const addDialog = page.getByRole('dialog', { name: 'Adicionar tamanho' })
    await expect(addDialog).toBeVisible()
    await captureViewport(page, 'f4-fnd003-yX4RY-add-1560x1178.png')
    await addDialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(addDialog).toBeHidden()
    await expect(addButton).toBeFocused()

    const editButton = page.getByRole('button', { name: 'Editar 300 ml' })
    await editButton.click()
    const editDialog = page.getByRole('dialog', { name: 'Editar tamanho' })
    await expect(editDialog).toBeVisible()
    await captureViewport(page, 'f4-fnd003-hqaUm-edit-1560x1178.png')
    await editDialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(editDialog).toBeHidden()
    await expect(editButton).toBeFocused()

    const removeButton = page.getByRole('button', { name: 'Remover 300 ml' })
    await removeButton.click()
    const removeDialog = page.getByRole('dialog', { name: 'Remover tamanho?' })
    await expect(removeDialog).toBeVisible()
    await captureViewport(page, 'f4-fnd003-uQYUR-remove-1560x1178.png')
  })

  test('captures the supplied Single-stock Resale reference', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductPricing({
      respond: () => ({ body: resalePricingResponse() }),
    })

    await page.setViewportSize({ width: 1560, height: 1178 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await expect(page.getByRole('heading', { name: 'Preço de Revenda' })).toBeVisible()
    await expect(page.getByLabel('Preço de venda')).toBeVisible()
    await captureViewport(page, 'f4-fnd003-JwtuK-single-1560x1178.png')
  })

  test('captures Portion loading at desktop', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let finishLoading: (() => void) | undefined
    await mrpFixture.mockProductPricing({
      respond: () =>
        new Promise((resolve) => {
          finishLoading = () => resolve({ body: portionPricingResponse([PORTION_SIZE]) })
        }),
    })

    await page.setViewportSize({ width: 1560, height: 1178 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await expect(
      page.getByRole('status', { name: 'Carregando preços do produto' }),
    ).toBeVisible()
    await captureViewport(page, 'f4-fnd003-portion-loading-1560x1178.png')
    finishLoading?.()
    await expect(page.getByRole('heading', { name: 'Tamanhos e preços' })).toBeVisible()
  })

  test('captures Portion loading at 390x844', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let finishLoading: (() => void) | undefined
    await mrpFixture.mockProductPricing({
      respond: () =>
        new Promise((resolve) => {
          finishLoading = () => resolve({ body: portionPricingResponse([PORTION_SIZE]) })
        }),
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await expect(
      page.getByRole('status', { name: 'Carregando preços do produto' }),
    ).toBeVisible()
    await captureViewport(page, 'f4-fnd003-portion-loading-390x844.png')
    finishLoading?.()
    await expect(page.getByRole('heading', { name: 'Tamanhos e preços' })).toBeVisible()
  })

  test('captures Portion read error/retry and empty at desktop', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let calls = 0
    await mrpFixture.mockProductPricing({
      respond: () => {
        calls += 1
        return calls === 1
          ? { body: { message: 'pricing unavailable' }, status: 503 }
          : { body: portionPricingResponse([]) }
      },
    })

    await page.setViewportSize({ width: 1560, height: 1178 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await expect(page.getByText('Não foi possível carregar os preços')).toBeVisible()
    await captureViewport(page, 'f4-fnd003-portion-error-retry-1560x1178.png')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText('Nenhum tamanho cadastrado')).toBeVisible()
    await captureViewport(page, 'f4-fnd003-portion-empty-1560x1178.png')
  })

  test('captures Portion read error/retry and empty at 390x844', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let calls = 0
    await mrpFixture.mockProductPricing({
      respond: () => {
        calls += 1
        return calls === 1
          ? { body: { message: 'pricing unavailable' }, status: 503 }
          : { body: portionPricingResponse([]) }
      },
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await expect(page.getByText('Não foi possível carregar os preços')).toBeVisible()
    await captureViewport(page, 'f4-fnd003-portion-error-retry-390x844.png')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText('Nenhum tamanho cadastrado')).toBeVisible()
    await captureViewport(page, 'f4-fnd003-portion-empty-390x844.png')
  })

  test('captures size validation, pending and mutation-error recovery at 390x844', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let sizes = [] as (typeof PORTION_SIZE)[]
    let postCalls = 0
    let finishPending: (() => void) | undefined
    await mrpFixture.mockProductPricing({
      respond: ({ method, body }) => {
        if (method === 'POST') {
          postCalls += 1
          if (postCalls === 1) {
            return new Promise((resolve) => {
              finishPending = () => {
                sizes = [
                  ProductSizeFaker.fake({
                    id: 'size-pending',
                    establishmentId: 'establishment-1',
                    productId: PRODUCT_ID,
                    name: String((body as { name: string }).name),
                    quantity: Number((body as { quantity: number }).quantity),
                    price: Number((body as { price: number }).price),
                  }),
                ]
                resolve({ body: portionPricingResponse(sizes), status: 201 })
              }
            })
          }
          return { body: { message: 'Não foi possível salvar o tamanho' }, status: 503 }
        }
        return { body: portionPricingResponse(sizes) }
      },
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await page.getByRole('button', { name: 'Adicionar primeiro tamanho' }).click()
    const dialog = page.getByRole('dialog', { name: 'Adicionar tamanho' })
    await dialog.getByLabel('Quantidade').fill('0')
    await dialog.getByLabel('Preço').fill('-1')
    await dialog.getByRole('button', { name: 'Adicionar tamanho' }).click()
    await expect(dialog.getByRole('alert')).toHaveCount(3)
    await captureViewport(page, 'f4-fnd003-size-validation-390x844.png')

    await dialog.getByLabel('Nome').fill('500 ml')
    await dialog.getByLabel('Quantidade').fill('500')
    await dialog.getByLabel('Preço').fill('22,50')
    await dialog.getByRole('button', { name: 'Adicionar tamanho' }).click()
    await expect(dialog.getByRole('button', { name: 'Salvando…' })).toBeVisible()
    await captureViewport(page, 'f4-fnd003-size-pending-390x844.png')

    finishPending?.()
    await expect(dialog).toBeHidden()
    await page.getByRole('button', { name: 'Adicionar tamanho' }).click()
    const mutationErrorDialog = page.getByRole('dialog', { name: 'Adicionar tamanho' })
    await mutationErrorDialog.getByLabel('Nome').fill('600 ml')
    await mutationErrorDialog.getByLabel('Quantidade').fill('600')
    await mutationErrorDialog.getByLabel('Preço').fill('24,50')
    await mutationErrorDialog.getByRole('button', { name: 'Adicionar tamanho' }).click()
    await expect(mutationErrorDialog.getByRole('alert')).toBeVisible()
    await captureViewport(page, 'f4-fnd003-size-mutation-error-390x844.png')
  })

  test('retains invalid add values and submits a new size through the mocked REST contract', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let sizes = [] as (typeof PORTION_SIZE)[]
    const { requests } = await mrpFixture.mockProductPricing({
      respond: ({ method, url, body }) => {
        if (method === 'POST' && url.pathname.endsWith('/sizes')) {
          sizes = [
            ProductSizeFaker.fake({
              id: 'size-new',
              establishmentId: 'establishment-1',
              productId: PRODUCT_ID,
              name: String((body as { name: string }).name),
              quantity: Number((body as { quantity: number }).quantity),
              price: Number((body as { price: number }).price),
            }),
          ]
          return { body: portionPricingResponse(sizes), status: 201 }
        }
        return { body: portionPricingResponse(sizes) }
      },
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await page.getByRole('button', { name: 'Adicionar primeiro tamanho' }).click()
    const dialog = page.getByRole('dialog', { name: 'Adicionar tamanho' })
    await expect(dialog.getByLabel('Nome')).toBeFocused()
    await dialog.getByLabel('Nome').fill('')
    await dialog.getByLabel('Quantidade').fill('0')
    await dialog.getByLabel('Preço').fill('-1')
    await dialog.getByRole('button', { name: 'Adicionar tamanho' }).click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('alert')).toHaveCount(3)
    await expect(dialog.getByLabel('Nome')).toHaveValue('')

    await dialog.getByLabel('Nome').fill('500 ml')
    await dialog.getByLabel('Quantidade').fill('500')
    await dialog.getByLabel('Preço').fill('22,50')
    await dialog.getByRole('button', { name: 'Adicionar tamanho' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('row', { name: /500 ml.*500 ml/ })).toBeVisible()
    const request = requests.find(
      ({ method, url }) => method === 'POST' && url.pathname.endsWith('/sizes'),
    )
    expect(request?.body).toEqual({ name: '500 ml', quantity: 500, price: 22.5 })
  })

  test('supports edit, cancel, confirm removal and focus return', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let sizes = [PORTION_SIZE]
    const { requests } = await mrpFixture.mockProductPricing({
      respond: ({ method, body }) => {
        if (method === 'PATCH') {
          sizes = [{ ...PORTION_SIZE, name: String((body as { name: string }).name) }]
          return { body: portionPricingResponse(sizes) }
        }
        if (method === 'DELETE') {
          sizes = []
          return { body: null, status: 204 }
        }
        return { body: portionPricingResponse(sizes) }
      },
    })

    await page.setViewportSize({ width: 1560, height: 1178 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    const editButton = page.getByRole('button', { name: 'Editar 300 ml' })
    await editButton.click()
    const editDialog = page.getByRole('dialog', { name: 'Editar tamanho' })
    await editDialog.getByLabel('Nome').fill('300 ml família')
    await editDialog.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(editDialog).toBeHidden()
    await expect(page.getByRole('row', { name: /300 ml família.*300 ml/ })).toBeVisible()

    const removeButton = page.getByRole('button', { name: 'Remover 300 ml família' })
    await removeButton.click()
    const removeDialog = page.getByRole('dialog', { name: 'Remover tamanho?' })
    await removeDialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(removeDialog).toBeHidden()
    await expect(removeButton).toBeFocused()

    await removeButton.click()
    await removeDialog.getByRole('button', { name: 'Remover tamanho' }).click()
    await expect(removeDialog).toBeHidden()
    await expect(page.getByText('Nenhum tamanho cadastrado')).toBeVisible()
    expect(requests.some(({ method }) => method === 'PATCH')).toBe(true)
    expect(requests.some(({ method }) => method === 'DELETE')).toBe(true)
  })

  test('recovers a Portion read error and renders the empty action', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let calls = 0
    await mrpFixture.mockProductPricing({
      respond: () => {
        calls += 1
        return calls === 1
          ? { body: { message: 'pricing unavailable' }, status: 503 }
          : { body: portionPricingResponse([]) }
      },
    })

    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await expect(page.getByText('Não foi possível carregar os preços')).toBeVisible()
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText('Nenhum tamanho cadastrado')).toBeVisible()
  })

  test('renders Single Resale without a package field and saves availability and price', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const { requests } = await mrpFixture.mockProductPricing({
      respond: ({ method, body }) => ({
        body: resalePricingResponse({
          isActive:
            method === 'PUT' ? Boolean((body as { isActive: boolean }).isActive) : true,
          price: method === 'PUT' ? Number((body as { price: number }).price) : 12,
        }),
        status: method === 'PUT' ? 200 : 200,
      }),
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await expect(page.getByRole('heading', { name: 'Preço de Revenda' })).toBeVisible()
    await expect(
      page.getByText(
        'O produto é vendido avulso como uma unidade da unidade de estoque.',
      ),
    ).toBeVisible()
    await expect(page.getByLabel('Preço de venda')).toBeVisible()
    await expect(page.getByLabel('Quantidade por embalagem')).toHaveCount(0)
    await page.getByLabel('Preço de venda').fill('15,50')
    await page.getByLabel('Disponível no PDV').focus()
    await page.getByLabel('Disponível no PDV').press('Space')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByLabel('Disponível no PDV')).not.toBeChecked()
    const request = requests.find(({ method }) => method === 'PUT')
    expect(request?.url.pathname).toBe(`/products/${PRODUCT_ID}/resale-configuration`)
    expect(request?.body).toEqual({ price: 15.5, isActive: false })
    await captureViewport(page, 'f4-fnd003-single-unavailable-390x844.png')
  })

  test('captures Single-stock validation at 390x844', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductPricing({
      respond: () => ({ body: resalePricingResponse() }),
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await page.getByLabel('Preço de venda').fill('-1')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await captureViewport(page, 'f4-fnd003-single-validation-390x844.png')
  })

  test('renders By-brand no-brands guidance without an unbranded fallback', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductPricing({
      respond: () => ({
        body: resalePricingResponse({ mode: 'resale-by-brand', resale: [] }),
      }),
    })

    await page.setViewportSize({ width: 1560, height: 1178 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await expect(page.getByText('Nenhuma marca cadastrada')).toBeVisible()
    await expect(
      page.getByText(
        'Cadastre uma marca em Estoque antes de configurar a revenda por marca.',
      ),
    ).toBeVisible()
    await expect(page.getByLabel('Quantidade por embalagem')).toHaveCount(0)
    await captureViewport(page, 'f4-fnd003-by-brand-no-brands-1560x1178.png')

    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await expect(page.getByText('Nenhuma marca cadastrada')).toBeVisible()
    await captureViewport(page, 'f4-fnd003-by-brand-no-brands-390x844.png')
  })

  test('captures By-brand failed row save and recovery at desktop', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let saveCalls = 0
    const { requests } = await mrpFixture.mockProductPricing({
      respond: ({ method }) => {
        if (method === 'PUT') {
          saveCalls += 1
          return saveCalls === 1
            ? { body: { message: 'Não foi possível salvar a marca' }, status: 503 }
            : { body: byBrandPricingResponse() }
        }
        return { body: byBrandPricingResponse() }
      },
    })

    await page.setViewportSize({ width: 1560, height: 1178 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await page.getByLabel('Preço Frooty').fill('28,00')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await captureViewport(page, 'f4-fnd003-by-brand-failed-row-1560x1178.png')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(
      requests
        .filter(({ method }) => method === 'PUT')
        .every(
          ({ url }) =>
            url.pathname ===
            `/products/${PRODUCT_ID}/brands/brand-frooty/resale-configuration`,
        ),
    ).toBe(true)
    await captureViewport(page, 'f4-fnd003-by-brand-recovered-row-1560x1178.png')
  })

  test('captures By-brand failed row save and recovery at 390x844', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let saveCalls = 0
    const { requests } = await mrpFixture.mockProductPricing({
      respond: ({ method }) => {
        if (method === 'PUT') {
          saveCalls += 1
          return saveCalls === 1
            ? { body: { message: 'Não foi possível salvar a marca' }, status: 503 }
            : { body: byBrandPricingResponse() }
        }
        return { body: byBrandPricingResponse() }
      },
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/products/${PRODUCT_ID}/prices`)
    await page.getByLabel('Preço Frooty').fill('28,00')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await captureViewport(page, 'f4-fnd003-by-brand-failed-row-390x844.png')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(
      requests
        .filter(({ method }) => method === 'PUT')
        .every(
          ({ url }) =>
            url.pathname ===
            `/products/${PRODUCT_ID}/brands/brand-frooty/resale-configuration`,
        ),
    ).toBe(true)
    await captureViewport(page, 'f4-fnd003-by-brand-recovered-row-390x844.png')
  })
})

function portionPricingResponse(sizes: readonly (typeof PORTION_SIZE)[]) {
  return {
    product: PORTION_PRODUCT,
    mode: 'portion',
    sizes: sizes.map((size) => ({
      size,
      operatingCost: 7.5,
      profit: size.price - 7.5,
      marginPercentage: ((size.price - 7.5) / size.price) * 100,
    })),
    resale: [],
  }
}

function resalePricingResponse({
  isActive = true,
  mode = 'resale-single',
  price = 12,
  resale,
}: {
  isActive?: boolean
  mode?: 'resale-single' | 'resale-by-brand'
  price?: number
  resale?: readonly unknown[]
} = {}) {
  return {
    product:
      mode === 'resale-single'
        ? RESALE_PRODUCT
        : { ...RESALE_PRODUCT, stockControl: 'by-brand' },
    mode,
    sizes: [],
    resale: resale ?? [
      {
        configuration: {
          id: 'resale-config-1',
          establishmentId: 'establishment-1',
          productId: PRODUCT_ID,
          price,
          isActive,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        packageQuantity: 1,
        price,
        isActive,
      },
    ],
  }
}

function byBrandPricingResponse() {
  return resalePricingResponse({
    mode: 'resale-by-brand',
    resale: [
      {
        brand: {
          id: 'brand-frooty',
          establishmentId: 'establishment-1',
          productId: PRODUCT_ID,
          name: 'Frooty',
          packageQuantity: 2,
          packagePrice: 20,
          isPrimary: true,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        configuration: {
          id: 'resale-brand-config-1',
          establishmentId: 'establishment-1',
          productId: PRODUCT_ID,
          brandId: 'brand-frooty',
          price: 24,
          isActive: true,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        packageQuantity: 2,
        price: 24,
        isActive: true,
      },
    ],
  })
}
