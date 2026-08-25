import { expect, test } from '../../playwright'

const TYPE = (id: string, name: string, usageCount = 0) => ({
  type: {
    id,
    establishmentId: 'establishment-1',
    name,
    createdAt: '2026-08-22T12:00:00.000Z',
    updatedAt: '2026-08-22T12:00:00.000Z',
  },
  usageCount,
})

test.describe('Accompaniment types route', () => {
  test('renders Manager navigation and URL-backed pagination', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const types = await mrpFixture.mockAccompanimentTypes({
      respond: (request) => ({
        body: {
          items: [
            TYPE(
              request.url.searchParams.get('page') === '2' ? 'type-2' : 'type-1',
              request.url.searchParams.get('page') === '2' ? 'Extra' : 'Cobertura',
              request.url.searchParams.get('page') === '2' ? 0 : 4,
            ),
          ],
          page: Number(request.url.searchParams.get('page') ?? 1),
          pageSize: 10,
          total: 20,
          totalPages: 2,
        },
      }),
    })
    await page.goto('/accompaniment-types?page=1')
    await expect(
      page.getByRole('heading', { name: 'Tipos de acompanhamento' }),
    ).toBeVisible()
    await expect(page.getByText('Cobertura')).toBeVisible()
    const disabledRemoveButton = page.getByRole('button', { name: 'Remover Cobertura' })
    await expect(disabledRemoveButton).toBeDisabled()
    const backLink = page.getByRole('link', { name: 'Voltar' })
    await expect(backLink).toHaveAttribute('href', '/products')
    await backLink.focus()
    await expect(backLink).toBeFocused()
    await page.setViewportSize({ width: 1560, height: 956 })
    await page.screenshot({
      path: 'test-results/mrp/accompaniment-types-populated-1560x956.png',
    })

    await page.setViewportSize({ width: 676, height: 562 })
    await page.getByRole('button', { name: 'Editar Cobertura' }).click()
    const editDialog = page.getByRole('dialog', {
      name: 'Editar tipo de acompanhamento',
    })
    await expect(editDialog).toBeVisible()
    await expect(editDialog.getByRole('textbox', { name: 'Nome do tipo' })).toHaveValue(
      'Cobertura',
    )
    await page.screenshot({
      path: 'test-results/mrp/accompaniment-type-edit-dialog-676x562.png',
    })
    await editDialog.getByRole('button', { name: 'Cancelar' }).click()

    await page.getByRole('button', { name: 'Próxima página' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByText('Extra')).toBeVisible()
    expect(types.requests.at(-1)?.url.searchParams.get('page')).toBe('2')
  })

  test('returns to the previously visited page from the header back link', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockAccompanimentTypes({
      respond: () => ({
        body: { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 },
      }),
    })
    await mrpFixture.mockProducts({
      getResponse: {
        body: {
          items: [],
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
          kpis: { products: 0, brands: 0, lowStock: 0 },
        },
      },
    })

    await page.goto('/products?search=milk')
    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
    const previousProductsUrl = page.url()
    await page.getByRole('link', { name: 'Tipos de acompanhamento' }).click()
    await expect(
      page.getByRole('heading', { name: 'Tipos de acompanhamento' }),
    ).toBeVisible()
    await page.getByRole('link', { name: 'Voltar' }).click()
    await expect(page).toHaveURL(previousProductsUrl)
    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
  })

  test('falls back to Products when opened without browser history', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockAccompanimentTypes({
      respond: () => ({
        body: { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 },
      }),
    })
    await mrpFixture.mockProducts({
      getResponse: {
        body: {
          items: [],
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
          kpis: { products: 0, brands: 0, lowStock: 0 },
        },
      },
    })

    await page.goto('/accompaniment-types?page=1')
    await page.getByRole('link', { name: 'Voltar' }).click()
    await expect(page).toHaveURL(/\/products/)
    await expect(page.getByRole('heading', { name: 'Produtos' })).toBeVisible()
  })

  test('rejects malformed pagination search instead of normalizing it', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const types = await mrpFixture.mockAccompanimentTypes({
      respond: () => ({
        body: { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 },
      }),
    })

    await page.goto('/accompaniment-types?page=malformed')
    await expect(
      page.getByRole('heading', { name: 'Acesso temporariamente indisponível' }),
    ).toBeVisible()
    expect(types.requests).toHaveLength(0)
  })

  test('creates, renames, and removes an unused type through the UI', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let current: ReturnType<typeof TYPE> | undefined = TYPE('type-1', 'Cobertura')
    await mrpFixture.mockAccompanimentTypes({
      respond: (request) => {
        if (request.method === 'POST') {
          const body = request.body as { name: string }
          current = TYPE('type-created', body.name)
          return { status: 201, body: current.type }
        }
        if (request.method === 'PATCH') {
          const body = request.body as { name: string }
          current = TYPE(current?.type.id ?? 'type-created', body.name)
          return { status: 200, body: current.type }
        }
        if (request.method === 'DELETE') {
          current = undefined
          return { status: 204, body: {} }
        }
        return {
          body: {
            items: current ? [current] : [],
            page: 1,
            pageSize: 10,
            total: current ? 1 : 0,
            totalPages: current ? 1 : 0,
          },
        }
      },
    })
    await page.setViewportSize({ width: 1560, height: 956 })
    const accountResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/auth/session',
    )
    const typesResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/accompaniment-types',
    )
    await page.goto('/accompaniment-types?page=1')
    await (await accountResponse).finished()
    await (await typesResponse).finished()
    await expect(page.getByText('Cobertura', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remover Cobertura' })).toHaveClass(
      /text-destructive/,
    )
    await page.screenshot({
      path: 'test-results/mrp/accompaniment-types-available-remove-1560x956.png',
    })
    await page.setViewportSize({ width: 320, height: 900 })
    await page.screenshot({
      path: 'test-results/mrp/accompaniment-types-lifecycle-320x900.png',
    })

    const headerAdd = page
      .getByRole('main')
      .locator('header')
      .getByRole('button', { name: 'Novo tipo' })
    await headerAdd.click()
    const createDialog = page.getByRole('dialog', { name: 'Novo tipo de acompanhamento' })
    await expect(createDialog).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/accompaniment-type-create-dialog-320x900.png',
    })
    await createDialog.getByRole('textbox', { name: 'Nome do tipo' }).fill('AAA Criado')
    await createDialog.getByRole('button', { name: 'Adicionar tipo' }).click()
    await expect(page.getByText('AAA Criado', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Editar AAA Criado' }).click()
    const editDialog = page.getByRole('dialog', {
      name: 'Editar tipo de acompanhamento',
    })
    await editDialog.getByRole('textbox', { name: 'Nome do tipo' }).fill('AAA Renomeado')
    await editDialog.getByRole('button', { name: 'Salvar alterações' }).click()
    await expect(page.getByText('AAA Renomeado', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Remover AAA Renomeado' }).click()
    const removeDialog = page.getByRole('alertdialog', {
      name: 'Remover tipo de acompanhamento?',
    })
    await expect(removeDialog).toContainText('será removido permanentemente')
    await removeDialog.getByRole('button', { name: 'Remover' }).click()
    await expect(removeDialog).toBeHidden()
    await expect(page.getByText('AAA Renomeado', { exact: true })).toHaveCount(0)
  })

  test('retains the remove dialog after an in-use rejection', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockAccompanimentTypes({
      respond: (request) =>
        request.method === 'DELETE'
          ? { status: 409, body: { message: 'Tipos em uso não podem ser removidos.' } }
          : {
              body: {
                items: [TYPE('type-used', 'Cobertura')],
                page: 1,
                pageSize: 10,
                total: 1,
                totalPages: 1,
              },
            },
    })
    await page.goto('/accompaniment-types')
    await page.getByRole('button', { name: 'Remover Cobertura' }).click()
    const removeDialog = page.getByRole('alertdialog', {
      name: 'Remover tipo de acompanhamento?',
    })
    await removeDialog.getByRole('button', { name: 'Remover' }).click()
    await expect(removeDialog).toBeVisible()
    await expect(removeDialog.getByRole('alert')).toBeVisible()
  })

  test('keeps the create form open after a mocked conflict', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockAccompanimentTypes({
      respond: (request) =>
        request.method === 'POST'
          ? { status: 409, body: { message: 'Já existe um tipo com este nome.' } }
          : { body: { items: [], page: 1, pageSize: 10, total: 0, totalPages: 0 } },
    })
    await page.setViewportSize({ width: 676, height: 562 })
    await page.goto('/accompaniment-types')
    await page
      .getByRole('main')
      .locator('header')
      .getByRole('button', { name: 'Novo tipo' })
      .click()
    const dialog = page.getByRole('dialog', { name: 'Novo tipo de acompanhamento' })
    await expect(dialog.getByRole('textbox', { name: 'Nome do tipo' })).toBeVisible()
    await page.screenshot({
      path: 'test-results/mrp/accompaniment-type-create-dialog-676x562.png',
    })
    await dialog.getByRole('textbox', { name: 'Nome do tipo' }).fill('Cobertura')
    await dialog.getByRole('button', { name: 'Adicionar tipo' }).click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('textbox', { name: 'Nome do tipo' })).toHaveValue(
      'Cobertura',
    )
  })
})
