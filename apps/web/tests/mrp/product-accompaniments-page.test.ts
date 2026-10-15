import { expect, test } from '../playwright'

const PRODUCT_ID = 'portion-1'
const TYPE_ID = 'type-1'
const ACCOMPANIMENT_ID = 'granola-1'

const PRODUCT = {
  id: PRODUCT_ID,
  establishmentId: 'establishment-1',
  name: 'Taça de açaí',
  unit: 'un',
  categories: ['portion'],
  stockControl: 'single',
  status: 'active',
  createdAt: '2026-08-22T12:00:00.000Z',
  updatedAt: '2026-08-22T12:00:00.000Z',
}

const ACCOMPANIMENT = {
  id: ACCOMPANIMENT_ID,
  establishmentId: 'establishment-1',
  name: 'Granola',
  unit: 'g',
  categories: ['accompaniment'],
  stockControl: 'single',
  status: 'active',
  currentUnitCost: 0.009,
  createdAt: '2026-08-22T12:00:00.000Z',
  updatedAt: '2026-08-22T12:00:00.000Z',
}

test.describe('ProductAccompanimentsPage', () => {
  test('lets Operators read linked accompaniments without management controls', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockOperatorSession()
    await identityFixture.mockOperatorAccount()
    await mrpFixture.mockProductStock({
      respond: () => ({
        body: {
          product: PRODUCT,
          stockQuantity: 1,
          stockSituation: 'normal',
          brands: [],
        },
      }),
    })
    await mrpFixture.mockProductAccompaniments({
      respond: () => ({
        body: {
          product: PRODUCT,
          accompaniments: [
            {
              id: 'link-1',
              accompanimentProductId: ACCOMPANIMENT_ID,
              accompanimentProductName: 'Granola',
              accompanimentTypeId: TYPE_ID,
              accompanimentTypeName: 'Cobertura',
              unit: 'g',
              quantityPerPortion: 50,
              salePrice: 3,
              brandName: 'Estoque único',
              unitCost: 0.009,
              estimatedCost: 0.45,
            },
          ],
        },
      }),
    })
    await mrpFixture.mockAccompanimentTypes({
      respond: () => ({
        body: { items: [], page: 1, pageSize: 100, total: 0, totalPages: 0 },
      }),
    })

    await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
    await expect(page).toHaveURL(`/products/${PRODUCT_ID}/accompaniments`)
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible()
    await expect(page.getByText('Granola')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'R$ 3,00' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Vincular acompanhamento' }),
    ).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Editar Granola/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Remover Granola/ })).toHaveCount(0)
  })

  test('suggests and saves a shared price through Link and Edit consumers', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProducts({
      getResponse: {
        body: {
          items: [
            {
              product: { ...ACCOMPANIMENT, categories: ['accompaniment', 'resale'] },
              brandCount: 0,
              stockQuantity: 10,
              stockSituation: 'normal',
            },
          ],
          page: 1,
          pageSize: 100,
          totalItems: 1,
          totalPages: 1,
          kpis: { products: 1, brands: 0, lowStock: 0 },
        },
      },
    })
    let savedPrice: number | null = null
    const pricingRequests: string[] = []
    await mrpFixture.mockProductStock({
      respond: () => ({
        body: {
          product: PRODUCT,
          stockQuantity: 1,
          stockSituation: 'normal',
          brands: [],
        },
      }),
    })
    const accompanimentRequests = await mrpFixture.mockProductAccompaniments({
      respond: (request) => {
        if (request.method === 'POST') {
          savedPrice =
            (request.body as { accompanimentPrice?: number }).accompanimentPrice ?? null
          return { status: 201, body: { id: 'link-2' } }
        }
        if (request.method === 'PATCH') {
          savedPrice =
            (request.body as { accompanimentPrice?: number }).accompanimentPrice ?? null
          return { body: {} }
        }
        return {
          body: {
            product: PRODUCT,
            accompaniments:
              savedPrice === null
                ? []
                : [
                    {
                      id: 'link-2',
                      accompanimentProductId: ACCOMPANIMENT_ID,
                      accompanimentProductName: 'Granola',
                      accompanimentTypeId: TYPE_ID,
                      accompanimentTypeName: 'Cobertura',
                      unit: 'g',
                      quantityPerPortion: 25,
                      salePrice: savedPrice,
                      brandName: 'Estoque único',
                      unitCost: 0.009,
                      estimatedCost: 0.225,
                    },
                  ],
          },
        }
      },
    })
    await mrpFixture.mockAccompanimentTypes({
      respond: () => ({
        body: {
          items: [
            {
              type: {
                id: TYPE_ID,
                establishmentId: 'establishment-1',
                name: 'Cobertura',
                createdAt: '2026-08-22T12:00:00.000Z',
                updatedAt: '2026-08-22T12:00:00.000Z',
              },
              usageCount: 1,
            },
          ],
          page: 1,
          pageSize: 100,
          total: 1,
          totalPages: 1,
        },
      }),
    })
    await page.route(`**/products/${ACCOMPANIMENT_ID}/pricing`, async (route) => {
      pricingRequests.push(route.request().method())
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          product: { ...ACCOMPANIMENT, categories: ['accompaniment', 'resale'] },
          mode: 'resale-single',
          sizes: [],
          resale: [],
          accompanimentPrice: savedPrice,
          suggestedAccompanimentPrice: 3,
        }),
        status: 200,
      })
    })

    await page.setViewportSize({ width: 1560, height: 1178 })
    await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
    const backLink = page.getByRole('link', { name: 'Voltar para produtos' })
    await expect(backLink).toBeVisible()
    await expect(backLink).toContainText('Voltar')
    await expect(backLink).toHaveClass(/border-transparent/)
    await expect(backLink).toHaveClass(/bg-transparent/)
    await expect(backLink).toHaveClass(/text-primary/)
    await expect(backLink).toHaveClass(/font-medium/)
    await backLink.focus()
    await expect(backLink).toBeFocused()
    await expect(
      page.getByRole('heading', { name: 'Nenhum acompanhamento vinculado' }),
    ).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/product-accompaniments-populated-1560x1097.png',
    })

    await page.setViewportSize({ width: 1560, height: 1178 })
    await page.getByRole('button', { name: 'Vincular acompanhamento' }).click()
    const dialog = page.getByRole('dialog', { name: 'Vincular acompanhamento' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('combobox', { name: 'Acompanhamento' }).click()
    await page.getByRole('option', { name: 'Granola' }).click()
    const priceInput = dialog.getByRole('textbox', { name: 'Preço do acompanhamento' })
    await expect(priceInput).toHaveValue('3,00')
    await expect(
      dialog.getByText('Sugestão baseada no preço de revenda único.'),
    ).toBeVisible()
    await page.screenshot({
      animations: 'disabled',
      path: 'test-results/mrp/product-accompaniment-link-dialog-676x843.png',
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({
      animations: 'disabled',
      path: 'test-results/mrp/product-accompaniment-link-dialog-596x353.png',
    })
    await dialog.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Cobertura' }).click()
    await dialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('25')
    await priceInput.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(dialog).toBeHidden()
    await page.setViewportSize({ width: 1560, height: 1178 })
    await expect(
      page.getByRole('columnheader', { name: 'PREÇO DO PRODUTO' }),
    ).toBeVisible()
    await expect(page.getByRole('cell', { name: 'R$ 3,00' })).toBeVisible()
    expect(savedPrice).toBe(3)
    expect(
      accompanimentRequests.requests.find((request) => request.method === 'POST')?.body,
    ).toEqual({
      accompanimentProductId: ACCOMPANIMENT_ID,
      accompanimentTypeId: TYPE_ID,
      quantityPerPortion: 25,
      accompanimentPrice: 3,
    })
    expect(pricingRequests).toHaveLength(2)
    await page.screenshot({
      path: '.playwright-cli/screenshots/mrp/product-accompaniments-populated-1560x1178.png',
      animations: 'disabled',
    })

    const editButton = page.getByRole('button', { name: 'Editar Granola' })
    await expect(editButton).toBeVisible()
    await editButton.click()
    const editDialog = page.getByRole('dialog', { name: 'Editar acompanhamento' })
    await expect(editDialog).toBeVisible()
    const brandInput = editDialog.getByRole('textbox', { name: 'Marca atual' })
    await expect(brandInput).toBeDisabled()
    await expect(brandInput).toHaveValue('Estoque único')
    const editPrice = editDialog.getByRole('textbox', { name: 'Preço do acompanhamento' })
    await expect(editPrice).toHaveValue('3,00')
    await page.screenshot({
      animations: 'disabled',
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({
      animations: 'disabled',
    })
    await editPrice.fill('0')
    await editDialog.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(editDialog).toBeHidden()
    await expect(page.getByRole('cell', { name: 'Grátis' })).toBeVisible()
    expect(savedPrice).toBe(0)
    expect(
      accompanimentRequests.requests.find((request) => request.method === 'PATCH')?.body,
    ).toEqual({
      accompanimentTypeId: TYPE_ID,
      quantityPerPortion: 25,
      accompanimentPrice: 0,
      path: 'test-results/mrp/product-accompaniment-edit-dialog-676x843.png',
    })
    await editButton.click()
    const zeroPriceDialog = page.getByRole('dialog', { name: 'Editar acompanhamento' })
    await expect(
      zeroPriceDialog.getByRole('textbox', { name: 'Preço do acompanhamento' }),
    ).toHaveValue('0,00')
    await zeroPriceDialog.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Remover Granola' }).click()
    const removeDialog = page.getByRole('alertdialog', {
      name: 'Remover acompanhamento?',
    })
    await expect(removeDialog).toContainText('estoque e o histórico permanecem intactos')
    await removeDialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(removeDialog).toBeHidden()
  })

  test('shows retry and remains usable at 320px', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductStock({
      respond: () => ({
        body: {
          product: PRODUCT,
          stockQuantity: 1,
          stockSituation: 'normal',
          brands: [],
        },
      }),
    })
    await mrpFixture.mockProductAccompaniments({
      respond: (_request, requestNumber) =>
        requestNumber === 1
          ? { status: 503, body: {} }
          : { body: { product: PRODUCT, accompaniments: [] } },
    })
    await page.setViewportSize({ width: 320, height: 900 })
    await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
    await expect(
      page.getByText('Não foi possível carregar os acompanhamentos'),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText('Nenhum acompanhamento vinculado')).toBeVisible()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true)
    await page.screenshot({
      path: 'test-results/mrp-accompaniments-320x900.png',
    })
  })

  test('shows candidate and stock recovery states without hiding source failures', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const unavailableAccompaniment = { ...ACCOMPANIMENT, currentUnitCost: undefined }
    await mrpFixture.mockProducts({
      getResponse: (_request, requestNumber) => {
        if (requestNumber === 1) {
          return { status: 503, body: {} }
        }
        return {
          body: {
            items: [
              {
                product: unavailableAccompaniment,
                brandCount: 0,
                stockQuantity: 0,
                stockSituation: 'normal',
              },
            ],
            page: 1,
            pageSize: 100,
            totalItems: 1,
            totalPages: 1,
            kpis: { products: 1, brands: 0, lowStock: 0 },
          },
        }
      },
    })
    let releaseCandidates!: () => void
    const candidatesGate = new Promise<void>((resolve) => {
      releaseCandidates = resolve
    })
    let candidateRequests = 0
    await page.route('**/products**', async (route) => {
      const request = route.request()
      const requestUrl = new URL(request.url())
      if (
        !['fetch', 'xhr'].includes(request.resourceType()) ||
        request.method() !== 'GET' ||
        requestUrl.pathname !== '/products'
      ) {
        await route.fallback()
        return
      }

      candidateRequests += 1
      if (candidateRequests === 1) await candidatesGate
      await route.fallback()
    })
    await mrpFixture.mockProductStock({
      respond: (_request, requestNumber) =>
        requestNumber === 2
          ? { status: 503, body: {} }
          : {
              body: {
                product: requestNumber === 1 ? PRODUCT : unavailableAccompaniment,
                stockQuantity: 0,
                stockSituation: 'normal',
                brands: [],
              },
            },
    })
    let releaseAccompaniments!: () => void
    const accompanimentsGate = new Promise<void>((resolve) => {
      releaseAccompaniments = resolve
    })
    await mrpFixture.mockProductAccompaniments({
      respond: async () => {
        await accompanimentsGate
        return { body: { product: PRODUCT, accompaniments: [] } }
      },
    })
    await mrpFixture.mockAccompanimentTypes({
      respond: () => ({
        body: {
          items: [
            {
              type: {
                id: TYPE_ID,
                establishmentId: 'establishment-1',
                name: 'Cobertura',
                createdAt: '2026-08-22T12:00:00.000Z',
                updatedAt: '2026-08-22T12:00:00.000Z',
              },
              usageCount: 0,
            },
          ],
          page: 1,
          pageSize: 100,
          total: 1,
          totalPages: 1,
        },
      }),
    })
    await page.route(`**/products/${ACCOMPANIMENT_ID}/pricing`, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          product: unavailableAccompaniment,
          mode: 'accompaniment',
          sizes: [],
          resale: [],
          accompanimentPrice: null,
          suggestedAccompanimentPrice: null,
        }),
      })
    })
    const pendingAccompanimentsRequest = page.waitForRequest(
      (request) =>
        ['fetch', 'xhr'].includes(request.resourceType()) &&
        request.method() === 'GET' &&
        new URL(request.url()).pathname === `/products/${PRODUCT_ID}/accompaniments`,
    )
    const navigation = page.goto(`/products/${PRODUCT_ID}/accompaniments`, {
      waitUntil: 'commit',
    })
    await navigation
    await pendingAccompanimentsRequest
    await expect(
      page.getByRole('status', { name: 'Carregando acompanhamentos' }),
    ).toBeVisible()
    releaseAccompaniments()
    await expect(
      page.getByRole('button', { name: 'Vincular acompanhamento' }),
    ).toBeVisible()
    const pendingCandidatesRequest = page.waitForRequest(
      (request) =>
        ['fetch', 'xhr'].includes(request.resourceType()) &&
        request.method() === 'GET' &&
        new URL(request.url()).pathname === '/products',
    )
    await page.getByRole('button', { name: 'Vincular acompanhamento' }).click()
    const dialog = page.getByRole('dialog', { name: 'Vincular acompanhamento' })
    await pendingCandidatesRequest
    await expect(dialog.getByText('Carregando acompanhamentos…')).toBeVisible()
    releaseCandidates()
    await expect(dialog.getByRole('alert')).toContainText(
      'Não foi possível carregar os acompanhamentos',
    )
    const candidateRetry = dialog.getByRole('alert').getByText('Tentar novamente')
    await candidateRetry.focus()
    await page.keyboard.press('Enter')
    await dialog.getByRole('combobox', { name: 'Acompanhamento' }).click()
    await page.getByRole('option', { name: 'Granola' }).click()
    await expect(dialog.getByRole('alert')).toContainText(
      'Não foi possível carregar a marca e o custo atuais',
    )
    const stockRetry = dialog.getByRole('alert').getByText('Tentar novamente')
    await stockRetry.focus()
    await page.keyboard.press('Enter')
    await expect(dialog.getByRole('textbox', { name: 'Marca atual' })).toHaveValue(
      'Não disponível',
    )
    await expect(dialog.getByText('Não disponível')).toBeVisible()
  })

  test('retains link and edit dialogs through validation and server failures', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProducts({
      getResponse: {
        body: {
          items: [
            {
              product: ACCOMPANIMENT,
              brandCount: 0,
              stockQuantity: 10,
              stockSituation: 'normal',
            },
          ],
          page: 1,
          pageSize: 100,
          totalItems: 1,
          totalPages: 1,
          kpis: { products: 1, brands: 0, lowStock: 0 },
        },
      },
    })
    await mrpFixture.mockProductStock({
      respond: () => ({
        body: {
          product: ACCOMPANIMENT,
          stockQuantity: 10,
          stockSituation: 'normal',
          brands: [],
        },
      }),
    })
    await mrpFixture.mockProductAccompaniments({
      respond: async (request) => {
        if (request.method === 'POST' || request.method === 'PATCH') {
          await new Promise((resolve) => setTimeout(resolve, 300))
          return { status: 409, body: { message: 'Não foi possível salvar o vínculo.' } }
        }
        return {
          body: {
            product: PRODUCT,
            accompaniments: [
              {
                id: 'link-1',
                accompanimentProductId: ACCOMPANIMENT_ID,
                accompanimentProductName: 'Granola',
                accompanimentTypeId: TYPE_ID,
                accompanimentTypeName: 'Cobertura',
                unit: 'g',
                quantityPerPortion: 20,
                brandName: 'Estoque único',
                salePrice: 3,
                unitCost: 0.009,
                estimatedCost: 0.18,
              },
            ],
          },
        }
      },
    })
    await mrpFixture.mockAccompanimentTypes({
      respond: () => ({
        body: {
          items: [
            {
              type: {
                id: TYPE_ID,
                establishmentId: 'establishment-1',
                name: 'Cobertura',
                createdAt: '2026-08-22T12:00:00.000Z',
                updatedAt: '2026-08-22T12:00:00.000Z',
              },
              usageCount: 0,
            },
          ],
          page: 1,
          pageSize: 100,
          total: 1,
          totalPages: 1,
        },
      }),
    })

    await page.route(`**/products/${ACCOMPANIMENT_ID}/pricing`, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        status: 200,
        body: JSON.stringify({
          product: ACCOMPANIMENT,
          mode: 'accompaniment',
          sizes: [],
          resale: [],
          accompanimentPrice: 3,
          suggestedAccompanimentPrice: null,
        }),
      })
    })
    await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
    await page.getByRole('button', { name: 'Vincular acompanhamento' }).click()
    const linkDialog = page.getByRole('dialog', { name: 'Vincular acompanhamento' })
    await linkDialog.getByRole('button', { name: 'Vincular' }).click()
    await expect(linkDialog.getByText('Selecione um acompanhamento.')).toBeVisible()
    await expect(linkDialog.getByText('Selecione um tipo.')).toBeVisible()
    await linkDialog.getByRole('combobox', { name: 'Acompanhamento' }).click()
    await page.getByRole('option', { name: 'Granola' }).click()
    await linkDialog.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Cobertura' }).click()
    await linkDialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('25')
    await linkDialog.getByRole('button', { name: 'Vincular' }).click()
    await linkDialog
      .getByRole('textbox', { name: 'Preço do acompanhamento' })
      .fill('3,00')
    await expect(linkDialog.getByRole('button', { name: 'Salvando…' })).toBeDisabled()
    await expect(linkDialog).toBeVisible()
    await expect(linkDialog.getByRole('alert')).toContainText('Não foi possível salvar')

    await linkDialog.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Editar Granola' }).click()
    const editDialog = page.getByRole('dialog', { name: 'Editar acompanhamento' })
    await editDialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('0')
    await editDialog.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(
      editDialog.getByText(
        'Informe uma quantidade maior que zero, com até três casas decimais.',
      ),
    ).toBeVisible()
    await editDialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('2')
    await editDialog.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(editDialog.getByRole('button', { name: 'Salvando…' })).toBeDisabled()
    await expect(editDialog).toBeVisible()
    await expect(editDialog.getByRole('alert')).toContainText('Não foi possível salvar')
  })
})
