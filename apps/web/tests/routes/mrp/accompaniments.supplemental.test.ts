import { expect, test } from '../../playwright'

const PRODUCT_ID = 'portion-1'
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

const TYPE = {
  id: 'type-1',
  establishmentId: 'establishment-1',
  name: 'Cobertura',
  createdAt: '2026-08-22T12:00:00.000Z',
  updatedAt: '2026-08-22T12:00:00.000Z',
}

const ACCOMPANIMENT = {
  id: 'granola-1',
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

const LINKED_ACCOMPANIMENT = {
  id: 'link-1',
  accompanimentProductId: ACCOMPANIMENT.id,
  accompanimentProductName: ACCOMPANIMENT.name,
  accompanimentTypeId: TYPE.id,
  accompanimentTypeName: TYPE.name,
  unit: 'g',
  quantityPerPortion: 20,
  brandName: 'Estoque único',
  unitCost: 0.009,
  estimatedCost: 0.18,
}

test.describe('MRP supplemental browser coverage', () => {
  test('shows the Manager contextual Types link on Products without a global sidebar entry', async ({
    page,
    mrpFixture,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProducts({
      getResponse: (_request) => ({
        body: {
          items: [],
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
          kpis: { products: 0, brands: 0, lowStock: 0 },
        },
      }),
    })

    const productsResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname === '/products',
    )
    await page.goto('/products')
    await (await productsResponse).finished()
    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
    const primaryNavigation = page.getByRole('navigation', {
      name: 'Navegação principal',
    })
    await expect(
      primaryNavigation.getByRole('link', { name: /Tipos de acompanhamento/ }),
    ).toHaveCount(0)

    const contextualLink = page.getByRole('main').getByRole('link', {
      name: 'Tipos de acompanhamento',
    })
    await expect(contextualLink).toBeVisible()
    await contextualLink.focus()
    await expect(contextualLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/accompaniment-types(?:\/)?(?:\?[^#]*)?$/)
    await expect(
      page.getByRole('heading', { name: 'Tipos de acompanhamento' }),
    ).toBeVisible()
    await expect(
      primaryNavigation.getByRole('link', { name: /Tipos de acompanhamento/ }),
    ).toHaveCount(0)
  })

  test('captures the narrow Types page and create dialog', async ({
    page,
    mrpFixture,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockAccompanimentTypes({
      respond: () => ({
        body: {
          items: [{ type: TYPE, usageCount: 0 }],
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
      }),
    })

    await page.setViewportSize({ width: 320, height: 900 })
    await page.goto('/accompaniment-types?page=1')

    await expect(
      page.getByRole('heading', { name: 'Tipos de acompanhamento' }),
    ).toBeVisible()
    await expect(page.getByText(TYPE.name)).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/supplemental/accompaniment-types-page-320x900.png',
    })

    await page
      .getByRole('main')
      .locator('header')
      .getByRole('button', { name: 'Novo tipo' })
      .click()

    const dialog = page.getByRole('dialog', {
      name: 'Novo tipo de acompanhamento',
    })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('textbox', { name: 'Nome do tipo' })).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/supplemental/accompaniment-type-create-dialog-320x900.png',
    })

    await dialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(dialog).toBeHidden()
  })

  test('covers accompaniment loading, error, retry, and recovery states', async ({
    page,
    mrpFixture,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductStock({
      respond: (_request) => ({
        body: {
          product: PRODUCT,
          stockQuantity: 1,
          stockSituation: 'normal',
          brands: [],
        },
      }),
    })
    await mrpFixture.mockProductAccompaniments({
      respond: async (_request, requestNumber) => {
        if (requestNumber === 1) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          return { status: 503, body: {} }
        }

        return {
          body: {
            product: PRODUCT,
            accompaniments: [],
          },
        }
      },
    })

    await page.setViewportSize({ width: 1560, height: 1097 })
    await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
    await expect(
      page.getByRole('status', { name: 'Carregando acompanhamentos' }),
    ).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/supplemental/product-accompaniments-loading-1560x1097.png',
    })

    await expect(page.getByRole('alert')).toContainText(
      'Não foi possível carregar os acompanhamentos',
    )
    await page.screenshot({
      path: 'test-results/mrp/supplemental/product-accompaniments-error-1560x1097.png',
    })

    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText('Nenhum acompanhamento vinculado')).toBeVisible()
  })

  test('shows the accompaniment remove confirmation without mutating data', async ({
    page,
    mrpFixture,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductStock({
      respond: (_request) => ({
        body: {
          product: PRODUCT,
          stockQuantity: 1,
          stockSituation: 'normal',
          brands: [],
        },
      }),
    })
    await mrpFixture.mockProductAccompaniments({
      respond: (_request) => ({
        body: {
          product: PRODUCT,
          accompaniments: [
            {
              id: 'link-1',
              accompanimentProductId: 'granola-1',
              accompanimentProductName: 'Granola',
              accompanimentTypeId: 'type-1',
              accompanimentTypeName: 'Cobertura',
              unit: 'g',
              quantityPerPortion: 20,
              brandName: 'Estoque único',
              unitCost: 0.009,
              estimatedCost: 0.18,
            },
          ],
        },
      }),
    })

    await page.setViewportSize({ width: 596, height: 353 })
    await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
    await page.getByRole('button', { name: 'Remover Granola' }).click()

    const dialog = page.getByRole('alertdialog', {
      name: 'Remover acompanhamento?',
    })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('O estoque e o histórico permanecem intactos.')
    await page.screenshot({
      path: 'test-results/mrp/supplemental/product-accompaniment-remove-confirmation-596x353.png',
    })

    await dialog.getByRole('button', { name: 'Cancelar' }).click()
    await expect(dialog).toBeHidden()
  })

  test('covers Types loading, GET error retry, empty, and URL pagination', async ({
    page,
    mrpFixture,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const types = await mrpFixture.mockAccompanimentTypes({
      respond: async (request, requestNumber) => {
        if (requestNumber === 1) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          return { status: 503, body: {} }
        }
        if (requestNumber === 2) {
          return {
            body: { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 },
          }
        }

        const pageNumber = Number(request.url.searchParams.get('page') ?? 1)
        const type = pageNumber === 2 ? { ...TYPE, id: 'type-2', name: 'Extra' } : TYPE
        return {
          body: {
            items: [{ type, usageCount: pageNumber === 2 ? 0 : 2 }],
            page: pageNumber,
            pageSize: 10,
            total: 20,
            totalPages: 2,
          },
        }
      },
    })

    await page.setViewportSize({ width: 1560, height: 956 })
    await page.goto('/accompaniment-types?page=1')
    await expect(
      page.getByRole('status', { name: 'Carregando tipos de acompanhamento' }),
    ).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/supplemental/accompaniment-types-loading-1560x956.png',
    })

    await expect(page.getByRole('alert')).toContainText(
      'Não foi possível carregar os tipos',
    )
    await page.screenshot({
      path: 'test-results/mrp/supplemental/accompaniment-types-error-1560x956.png',
    })

    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(
      page.getByRole('heading', { name: 'Nenhum tipo cadastrado' }),
    ).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/supplemental/accompaniment-types-empty-1560x956.png',
    })

    await page.reload()
    await expect(page.getByText(TYPE.name, { exact: true })).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/supplemental/accompaniment-types-page-1-1560x956.png',
    })

    await page.getByRole('button', { name: 'Próxima página' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByText('Extra', { exact: true })).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/supplemental/accompaniment-types-page-2-1560x956.png',
    })
    expect(types.requests.at(-1)?.url.searchParams.get('page')).toBe('2')
  })

  test('captures narrow link and edit accompaniment dialogs', async ({
    page,
    mrpFixture,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProducts({
      getResponse: (_request) => ({
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
      }),
    })
    await mrpFixture.mockProductStock({
      respond: (_request, requestNumber) => ({
        body: {
          product: requestNumber === 1 ? PRODUCT : ACCOMPANIMENT,
          stockQuantity: 10,
          stockSituation: 'normal',
          brands: [],
        },
      }),
    })
    await mrpFixture.mockProductAccompaniments({
      respond: (_request) => ({
        body: { product: PRODUCT, accompaniments: [LINKED_ACCOMPANIMENT] },
      }),
    })
    await mrpFixture.mockAccompanimentTypes({
      respond: (_request) => ({
        body: {
          items: [{ type: TYPE, usageCount: 0 }],
          page: 1,
          pageSize: 100,
          total: 1,
          totalPages: 1,
        },
      }),
    })

    await page.setViewportSize({ width: 320, height: 900 })
    await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
    await page.getByRole('button', { name: 'Vincular acompanhamento' }).click()
    const linkDialog = page.getByRole('dialog', { name: 'Vincular acompanhamento' })
    await expect(
      linkDialog.getByRole('combobox', { name: 'Acompanhamento' }),
    ).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/supplemental/product-accompaniment-link-dialog-320x900.png',
    })
    await linkDialog.getByRole('button', { name: 'Cancelar' }).click()

    await page.getByRole('button', { name: 'Editar Granola' }).click()
    const editDialog = page.getByRole('dialog', { name: 'Editar acompanhamento' })
    await expect(editDialog).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/supplemental/product-accompaniment-edit-dialog-320x900.png',
    })
  })

  test('retains link and edit forms through validation, pending, and server failures', async ({
    page,
    mrpFixture,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await page.setViewportSize({ width: 676, height: 843 })
    await mrpFixture.mockProducts({
      getResponse: (_request) => ({
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
      }),
    })
    await mrpFixture.mockProductStock({
      respond: (_request, requestNumber) => ({
        body: {
          product: requestNumber === 1 ? PRODUCT : ACCOMPANIMENT,
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
          body: { product: PRODUCT, accompaniments: [LINKED_ACCOMPANIMENT] },
        }
      },
    })
    await mrpFixture.mockAccompanimentTypes({
      respond: (_request) => ({
        body: {
          items: [{ type: TYPE, usageCount: 0 }],
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
    await page.getByRole('option', { name: ACCOMPANIMENT.name }).click()
    await linkDialog.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: TYPE.name }).click()
    const linkQuantity = linkDialog.getByRole('textbox', {
      name: /Quantidade por porção/,
    })
    await linkQuantity.fill('25')
    await linkDialog.getByRole('button', { name: 'Vincular' }).click()
    await expect(linkDialog.getByRole('button', { name: 'Salvando…' })).toBeDisabled()
    await page.screenshot({
      path: 'test-results/mrp/supplemental/product-accompaniment-link-saving-676x843.png',
    })
    await expect(linkDialog.getByRole('alert')).toContainText('Não foi possível salvar')
    await expect(linkDialog).toBeVisible()
    await expect(linkQuantity).toHaveValue('25')
    await page.screenshot({
      path: 'test-results/mrp/supplemental/product-accompaniment-link-failure-676x843.png',
    })

    await linkDialog.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Editar Granola' }).click()
    const editDialog = page.getByRole('dialog', { name: 'Editar acompanhamento' })
    const editQuantity = editDialog.getByRole('textbox', {
      name: /Quantidade por porção/,
    })
    await editQuantity.fill('2')
    await editDialog.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(editDialog.getByRole('button', { name: 'Salvando…' })).toBeDisabled()
    await page.screenshot({
      path: 'test-results/mrp/supplemental/product-accompaniment-edit-saving-676x843.png',
    })
    await expect(editDialog.getByRole('alert')).toContainText('Não foi possível salvar')
    await expect(editDialog).toBeVisible()
    await expect(editQuantity).toHaveValue('2')
    await page.screenshot({
      path: 'test-results/mrp/supplemental/product-accompaniment-edit-failure-676x843.png',
    })
  })

  test('retains the Type remove dialog after an in-use rejection', async ({
    page,
    mrpFixture,
    identityFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockAccompanimentTypes({
      respond: (request) =>
        request.method === 'DELETE'
          ? { status: 409, body: { message: 'Tipos em uso não podem ser removidos.' } }
          : {
              body: {
                items: [{ type: TYPE, usageCount: 0 }],
                page: 1,
                pageSize: 10,
                total: 1,
                totalPages: 1,
              },
            },
    })

    await page.setViewportSize({ width: 596, height: 353 })
    await page.goto('/accompaniment-types')
    await page.getByRole('button', { name: 'Remover Cobertura' }).click()
    const removeDialog = page.getByRole('alertdialog', {
      name: 'Remover tipo de acompanhamento?',
    })
    await expect(removeDialog).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/supplemental/accompaniment-type-remove-confirmation-596x353.png',
    })

    await removeDialog.getByRole('button', { name: 'Remover' }).click()
    await expect(removeDialog).toBeVisible()
    await expect(removeDialog.getByRole('alert')).toContainText('Tipos em uso')
    await page.screenshot({
      path: 'test-results/mrp/supplemental/accompaniment-type-remove-in-use-596x353.png',
    })
  })
})
