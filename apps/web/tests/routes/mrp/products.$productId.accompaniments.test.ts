import { expect, test } from '../../playwright'

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

test.describe('Product accompaniments route', () => {
  test('renders populated rows and submits a link through mocked transport', async ({
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
          product: PRODUCT,
          stockQuantity: 1,
          stockSituation: 'normal',
          brands: [],
        },
      }),
    })
    const accompanimentRequests = await mrpFixture.mockProductAccompaniments({
      respond: (request) => {
        if (request.method === 'POST') return { status: 201, body: { id: 'link-2' } }
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
                quantityPerPortion: 50,
                brandName: 'Estoque único',
                unitCost: 0.009,
                estimatedCost: 0.45,
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

    await page.setViewportSize({ width: 1560, height: 1097 })
    await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
    const backLink = page.getByRole('link', { name: 'Voltar para produtos' })
    await expect(backLink).toBeVisible()
    await expect(backLink).toContainText('Voltar')
    await expect(backLink).toHaveClass(/border-border/)
    await expect(backLink).toHaveClass(/font-medium/)
    await backLink.focus()
    await expect(backLink).toBeFocused()
    await expect(page.getByRole('heading', { name: 'Acompanhamentos' })).toBeVisible()
    await expect(page.getByText('Granola')).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Não disponível' })).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/product-accompaniments-populated-1560x1097.png',
    })

    await page.setViewportSize({ width: 676, height: 843 })
    await page.getByRole('button', { name: 'Vincular acompanhamento' }).click()
    const dialog = page.getByRole('dialog', { name: 'Vincular acompanhamento' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Não disponível')).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/product-accompaniment-link-dialog-676x843.png',
    })
    await page.setViewportSize({ width: 596, height: 353 })
    await page.screenshot({
      path: 'test-results/mrp/product-accompaniment-link-dialog-596x353.png',
    })
    await page.setViewportSize({ width: 676, height: 843 })
    await dialog.getByRole('combobox', { name: 'Acompanhamento' }).click()
    await page.getByRole('option', { name: 'Granola' }).click()
    await dialog.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Cobertura' }).click()
    await dialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('25')
    await dialog.getByRole('button', { name: 'Vincular' }).click()
    await expect(dialog).toBeHidden()
    expect(
      accompanimentRequests.requests.some((request) => request.method === 'POST'),
    ).toBe(true)

    const editButton = page.getByRole('button', { name: 'Editar Granola' })
    await expect(editButton).toBeVisible()
    await editButton.click()
    const editDialog = page.getByRole('dialog', { name: 'Editar acompanhamento' })
    await expect(editDialog).toBeVisible()
    await expect(editDialog.getByRole('textbox', { name: 'Marca atual' })).toBeDisabled()
    await page.screenshot({
      path: 'test-results/mrp/product-accompaniment-edit-dialog-676x843.png',
    })
    await editDialog.getByRole('button', { name: 'Cancelar' }).click()
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

    const pendingAccompanimentsRequest = page.waitForRequest(
      (request) =>
        ['fetch', 'xhr'].includes(request.resourceType()) &&
        request.method() === 'GET' &&
        new URL(request.url()).pathname ===
          `/products/${PRODUCT_ID}/accompaniments`,
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
