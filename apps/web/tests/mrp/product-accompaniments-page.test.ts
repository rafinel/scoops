import type { Page } from '@playwright/test'

import type { IdentityModuleFixture } from '../fixtures/identity-module-fixture'
import type { MrpFixture } from '../fixtures/mrp-module-fixture'
import { expect, test } from '../playwright'

type ManagerPageFixtures = {
  identityFixture: IdentityModuleFixture
  mrpFixture: MrpFixture
  page: Page
}

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

const CANDIDATE = {
  productId: ACCOMPANIMENT_ID,
  name: 'Granola',
  unit: 'g',
  stockControl: 'single',
  accompanimentPrice: null,
  isGlobal: false,
  hasPortionLinks: false,
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
              isGlobal: true,
              hasOtherPortionLinks: false,
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
    await expect(page.getByText('Global', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Itens globais aparecem em todas as porções.'),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Vincular Acompanhamento' }),
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
    let savedPrice: number | null = null
    const pricingRequests: string[] = []
    let holdNextPricingResponse = false
    let releasePricingResponse: (() => void) | undefined
    await mrpFixture.mockProductStock({
      respond: (request) => ({
        body: {
          product:
            request.url.pathname === `/products/${ACCOMPANIMENT_ID}/stock`
              ? ACCOMPANIMENT
              : PRODUCT,
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
                      isGlobal: false,
                      hasOtherPortionLinks: false,
                    },
                  ],
          },
        }
      },
    })
    const candidateRequests = await mrpFixture.mockProductAccompanimentCandidates({
      respond: () => ({ body: [CANDIDATE] }),
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
      if (holdNextPricingResponse) {
        holdNextPricingResponse = false
        await new Promise<void>((resolve) => {
          releasePricingResponse = resolve
        })
      }
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
    await expect(backLink).toBeVisible({ timeout: 30_000 })
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

    await page.setViewportSize({ width: 1560, height: 1178 })
    await page.getByRole('button', { name: 'Vincular Acompanhamento' }).click()
    const dialog = page.getByRole('dialog', { name: 'Vincular Acompanhamento' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('combobox', { name: 'Acompanhamento' }).click()
    await page.getByRole('option', { name: 'Granola' }).click()
    expect(candidateRequests.requests).toHaveLength(1)
    expect(candidateRequests.requests[0]?.method).toBe('GET')
    expect(candidateRequests.requests[0]?.url.pathname).toBe(
      `/products/${PRODUCT_ID}/accompaniments/candidates`,
    )
    await expect(dialog.getByLabel('Marca atual')).toHaveValue('Estoque único')
    const priceInput = dialog.getByRole('textbox', { name: 'Preço do acompanhamento' })
    await expect(priceInput).toHaveValue('3,00')
    await expect(
      dialog.getByText('Sugestão baseada no preço de revenda único.'),
    ).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
    await dialog.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Cobertura' }).click()
    await dialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('25')
    await expect(dialog.getByText(/R\$\s0,2[23]/)).toBeVisible()
    await priceInput.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(dialog).toBeHidden()
    await page.setViewportSize({ width: 1560, height: 1178 })
    await expect(
      page.getByRole('columnheader', { name: 'PREÇO' }),
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

    const editButton = page.getByRole('button', { name: 'Editar Granola' })
    await expect(editButton).toBeVisible()
    await page.setViewportSize({ width: 390, height: 568 })
    holdNextPricingResponse = true
    await editButton.click()
    const editDialog = page.getByRole('dialog', { name: 'Editar Acompanhamento' })
    await expect(editDialog).toBeVisible()
    const refreshStatus = editDialog.getByRole('status', { name: 'Atualizando…' })
    const editPrice = editDialog.getByRole('textbox', { name: 'Preço do acompanhamento' })
    try {
      await expect(refreshStatus).toBeVisible()
      await expect(editPrice).toHaveValue('3,00')
      const saveButton = editDialog.getByRole('button', { name: 'Salvar alterações' })
      await expect(saveButton).toBeInViewport()
      await expect(editDialog.getByRole('button', { name: 'Cancelar' })).toBeInViewport()
      const fields = editDialog.locator('form > div').first()
      await expect
        .poll(() =>
          fields.evaluate((element) => element.scrollHeight > element.clientHeight),
        )
        .toBe(true)
      await fields.evaluate((element) => {
        element.scrollTop = element.scrollHeight
      })
      await expect(
        editDialog.getByRole('textbox', { name: 'Preço do acompanhamento' }),
      ).toBeInViewport()
      await expect(saveButton).toBeInViewport()
    } finally {
      releasePricingResponse?.()
    }
    await expect(refreshStatus).toBeHidden()
    await page.setViewportSize({ width: 1560, height: 1178 })
    const brandInput = editDialog.getByRole('textbox', { name: 'Marca atual' })
    await expect(brandInput).toBeDisabled()
    await expect(brandInput).toHaveValue('Estoque único')
    await expect(editPrice).toHaveValue('3,00')
    await page.setViewportSize({ width: 390, height: 844 })
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
    })
    await editButton.click()
    const zeroPriceDialog = page.getByRole('dialog', { name: 'Editar Acompanhamento' })
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
    await expect(page.getByRole('button', { name: 'Remover Granola' })).toBeFocused()
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
  })

  test('shows candidate and stock recovery states without hiding source failures', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const unavailableAccompaniment = { ...ACCOMPANIMENT, currentUnitCost: undefined }
    let releaseCandidates!: () => void
    const candidatesGate = new Promise<void>((resolve) => {
      releaseCandidates = resolve
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
    await mrpFixture.mockProductAccompanimentCandidates({
      respond: async (_request, requestNumber) => {
        if (requestNumber === 1) {
          await candidatesGate
          return { status: 503, body: {} }
        }
        return { body: [CANDIDATE] }
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
      page.getByRole('button', { name: 'Vincular Acompanhamento' }),
    ).toBeVisible()
    const pendingCandidatesRequest = page.waitForRequest(
      (request) =>
        ['fetch', 'xhr'].includes(request.resourceType()) &&
        request.method() === 'GET' &&
        new URL(request.url()).pathname ===
          `/products/${PRODUCT_ID}/accompaniments/candidates`,
    )
    await page.getByRole('button', { name: 'Vincular Acompanhamento' }).click()
    const dialog = page.getByRole('dialog', { name: 'Vincular Acompanhamento' })
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
                salePrice: 3,
                brandName: 'Estoque único',
                unitCost: 0.009,
                estimatedCost: 0.18,
                isGlobal: false,
                hasOtherPortionLinks: false,
              },
            ],
          },
        }
      },
    })
    await mrpFixture.mockProductAccompanimentCandidates({
      respond: () => ({ body: [CANDIDATE] }),
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
    await page.getByRole('button', { name: 'Vincular Acompanhamento' }).click()
    const linkDialog = page.getByRole('dialog', { name: 'Vincular Acompanhamento' })
    await linkDialog.getByRole('button', { name: 'Vincular' }).click()
    await expect(linkDialog.getByText('Selecione um acompanhamento.')).toBeVisible()
    await expect(linkDialog.getByText('Selecione um tipo.')).toBeVisible()
    await linkDialog.getByRole('combobox', { name: 'Acompanhamento' }).click()
    await page.getByRole('option', { name: 'Granola' }).click()
    await linkDialog.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Cobertura' }).click()
    await linkDialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('25')
    await linkDialog
      .getByRole('textbox', { name: 'Preço do acompanhamento' })
      .fill('3,00')
    await linkDialog.getByRole('button', { name: 'Vincular' }).click()
    await expect(linkDialog.getByRole('button', { name: 'Salvando…' })).toBeDisabled()
    await expect(linkDialog).toBeVisible()
    await expect(linkDialog.getByRole('alert')).toContainText('Não foi possível salvar')

    await linkDialog.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Editar Granola' }).click()
    const editDialog = page.getByRole('dialog', { name: 'Editar Acompanhamento' })
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

  test.describe('global accompaniments', () => {
    const GLOBAL_LINK = {
      id: 'link-global-1',
      accompanimentProductId: ACCOMPANIMENT_ID,
      accompanimentProductName: 'Granola',
      accompanimentTypeId: TYPE_ID,
      accompanimentTypeName: 'Cobertura',
      unit: 'g',
      quantityPerPortion: 50,
      salePrice: 3,
      brandName: 'Mãe Terra',
      unitCost: 0.009,
      estimatedCost: 0.45,
      isGlobal: true,
      hasOtherPortionLinks: false,
    }
    const INDIVIDUAL_LINK = {
      id: 'link-banana-1',
      accompanimentProductId: 'banana-1',
      accompanimentProductName: 'Banana',
      accompanimentTypeId: TYPE_ID,
      accompanimentTypeName: 'Cobertura',
      unit: 'un',
      quantityPerPortion: 1,
      salePrice: 2,
      brandName: 'Feira',
      unitCost: 0.8,
      estimatedCost: 0.8,
      isGlobal: false,
      hasOtherPortionLinks: true,
    }
    const TYPES_BODY = {
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
    }

    async function mockManagerPage(
      { identityFixture, mrpFixture, page }: ManagerPageFixtures,
      options: {
        candidates?: unknown[]
        respondAccompaniments: Parameters<
          MrpFixture['mockProductAccompaniments']
        >[0]['respond']
      },
    ) {
      await identityFixture.mockManagerSession()
      await identityFixture.mockManagerAccount()
      await mrpFixture.mockProductStock({
        respond: (request) => ({
          body: {
            product:
              request.url.pathname === `/products/${PRODUCT_ID}/stock`
                ? PRODUCT
                : { ...ACCOMPANIMENT, currentUnitCost: 0.02 },
            stockQuantity: 1,
            stockSituation: 'normal',
            brands: [],
          },
        }),
      })
      const accompanimentRequests = await mrpFixture.mockProductAccompaniments({
        respond: options.respondAccompaniments,
      })
      const candidateRequests = await mrpFixture.mockProductAccompanimentCandidates({
        respond: () => ({ body: options.candidates ?? [] }),
      })
      await mrpFixture.mockAccompanimentTypes({ respond: () => ({ body: TYPES_BODY }) })
      await page.route('**/products/*/pricing', async (route) => {
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
      return { accompanimentRequests, candidateRequests }
    }

    test('renders Global badges first with the description for Managers', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockManagerPage(
        { identityFixture, mrpFixture, page },
        {
          respondAccompaniments: () => ({
            body: { product: PRODUCT, accompaniments: [GLOBAL_LINK, INDIVIDUAL_LINK] },
          }),
        },
      )

      await page.setViewportSize({ width: 1560, height: 1178 })
      await page.goto(`/products/${PRODUCT_ID}/accompaniments`)

      await expect(
        page.getByRole('heading', { name: /Acompanhamentos \(2\)/ }),
      ).toBeVisible()
      await expect(
        page.getByText(/Itens globais aparecem em todas as porções\.$/),
      ).toBeVisible()
      const rows = page.getByRole('row')
      await expect(rows.nth(1)).toContainText('Granola')
      await expect(rows.nth(1).getByText('Global', { exact: true })).toBeVisible()
      await expect(rows.nth(2)).toContainText('Banana')
      await expect(rows.nth(2).getByText('Global', { exact: true })).toHaveCount(0)
    })

    test('links globally by keyboard with the replacement notice and the isGlobal payload', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      let isLinked = false
      const { accompanimentRequests } = await mockManagerPage(
        { identityFixture, mrpFixture, page },
        {
          candidates: [{ ...CANDIDATE, hasPortionLinks: true, accompanimentPrice: null }],
          respondAccompaniments: (request) => {
            if (request.method === 'POST') {
              isLinked = true
              return { status: 201, body: GLOBAL_LINK }
            }
            return {
              body: {
                product: PRODUCT,
                accompaniments: isLinked ? [GLOBAL_LINK] : [],
              },
            }
          },
        },
      )

      await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
      await page.getByRole('button', { name: 'Vincular Acompanhamento' }).click()
      const dialog = page.getByRole('dialog', { name: 'Vincular Acompanhamento' })
      await dialog.getByRole('button', { name: 'Cancelar' }).click()
      await expect(dialog).toBeHidden()
      await expect(
        page.getByRole('button', { name: 'Vincular Acompanhamento' }).first(),
      ).toBeFocused()
      await page.getByRole('button', { name: 'Vincular Acompanhamento' }).first().click()
      await dialog.getByRole('combobox', { name: 'Acompanhamento' }).click()
      await page.getByRole('option', { name: 'Granola' }).click()

      const globalSwitch = dialog.getByRole('switch', {
        name: 'Disponível para todas as porções',
      })
      await expect(globalSwitch).toHaveAttribute('aria-checked', 'false')
      await expect(globalSwitch).not.toHaveAttribute('aria-disabled', 'true')
      await expect(dialog.getByRole('status')).toHaveCount(0)

      await globalSwitch.focus()
      await page.keyboard.press('Space')
      await expect(globalSwitch).toHaveAttribute('aria-checked', 'true')
      await expect(
        dialog.getByRole('status').filter({ hasText: 'Acompanhamento global:' }),
      ).toBeVisible()
      const replacementNotice = dialog
        .getByRole('status')
        .filter({ hasText: 'já está vinculado individualmente a outras porções' })
      await expect(replacementNotice).toBeVisible()
      await expect(globalSwitch).toHaveAccessibleDescription(
        /Tipo, quantidade e preço são compartilhados\..*substituídos pela configuração global/,
      )
      await expect(dialog.getByRole('combobox', { name: 'Tipo' })).toContainText(
        'Selecione um tipo',
      )
      await expect(
        dialog.getByRole('textbox', { name: /Quantidade por porção/ }),
      ).toHaveValue('')

      await dialog.getByRole('combobox', { name: 'Tipo' }).click()
      await page.getByRole('option', { name: 'Cobertura' }).click()
      await dialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('50')
      await dialog.getByRole('button', { name: 'Vincular', exact: true }).click()
      await expect(dialog).toBeHidden()

      const post = accompanimentRequests.requests.find(
        (request) => request.method === 'POST',
      )
      expect(post?.url.pathname).toBe(`/products/${PRODUCT_ID}/accompaniments`)
      expect(post?.body).toEqual({
        accompanimentProductId: ACCOMPANIMENT_ID,
        accompanimentTypeId: TYPE_ID,
        quantityPerPortion: 50,
        isGlobal: true,
      })
      await expect(
        page.getByRole('row').nth(1).getByText('Global', { exact: true }),
      ).toBeVisible()
    })

    test('links a removed global again with the global notice, no switch and shared values', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { accompanimentRequests } = await mockManagerPage(
        { identityFixture, mrpFixture, page },
        {
          candidates: [
            {
              ...CANDIDATE,
              accompanimentPrice: 3,
              isGlobal: true,
              hasPortionLinks: false,
              global: { accompanimentTypeId: TYPE_ID, quantityPerPortion: 50 },
            },
          ],
          respondAccompaniments: (request) =>
            request.method === 'POST'
              ? { status: 201, body: GLOBAL_LINK }
              : { body: { product: PRODUCT, accompaniments: [] } },
        },
      )

      await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
      await page.getByRole('button', { name: 'Vincular Acompanhamento' }).first().click()
      const dialog = page.getByRole('dialog', { name: 'Vincular Acompanhamento' })
      await dialog.getByRole('combobox', { name: 'Acompanhamento' }).click()
      await page.getByRole('option', { name: 'Granola' }).click()

      await expect(dialog.getByRole('switch')).toHaveCount(0)
      await expect(
        dialog.getByText('Este preço vale para todas as porções.'),
      ).toBeVisible()
      await expect(
        dialog.getByText('Disponível para todas as porções', { exact: true }),
      ).toHaveCount(0)
      const globalNotice = dialog.getByRole('status')
      await expect(globalNotice).toBeVisible()
      await expect(globalNotice).toHaveText(
        'Acompanhamento global: as alterações valem para todas as porções. Para deixar de ser global, use Remover na tabela.',
      )
      await expect(
        dialog.getByText(/Aparece em todas as porções, incluindo as novas/),
      ).toHaveCount(0)
      await expect(dialog.getByRole('combobox', { name: 'Tipo' })).toContainText(
        'Cobertura',
      )
      await expect(
        dialog.getByRole('textbox', { name: /Quantidade por porção/ }),
      ).toHaveValue('50')
      await expect(dialog.getByRole('textbox', { name: /Preço/ })).toHaveValue('3,00')
      await expect(
        dialog.getByText(/vinculado individualmente a outras porções/),
      ).toHaveCount(0)
      await expect(dialog.getByRole('status')).toHaveCount(1)
      await expect(
        dialog.getByRole('button', { name: 'Vincular', exact: true }),
      ).toBeEnabled()

      await dialog.getByRole('button', { name: 'Vincular', exact: true }).click()
      await expect(dialog).toBeHidden()
      expect(
        accompanimentRequests.requests.find((request) => request.method === 'POST')?.body,
      ).toEqual({
        accompanimentProductId: ACCOMPANIMENT_ID,
        accompanimentTypeId: TYPE_ID,
        quantityPerPortion: 50,
        isGlobal: true,
      })
    })

    test('edits a global with the global notice and no switch and converts an individual row', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { accompanimentRequests } = await mockManagerPage(
        { identityFixture, mrpFixture, page },
        {
          respondAccompaniments: (request) =>
            request.method === 'PATCH'
              ? { body: GLOBAL_LINK }
              : {
                  body: {
                    product: PRODUCT,
                    accompaniments: [GLOBAL_LINK, INDIVIDUAL_LINK],
                  },
                },
        },
      )

      await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
      await page.getByRole('button', { name: 'Editar Granola' }).click()
      const globalDialog = page.getByRole('dialog', { name: 'Editar Acompanhamento' })
      await expect(globalDialog.getByRole('switch')).toHaveCount(0)
      await expect(
        globalDialog.getByText('Este preço vale para todas as porções.'),
      ).toBeVisible()
      await expect(globalDialog.getByRole('status')).toHaveCount(1)
      await expect(
        globalDialog.getByRole('status').filter({ hasText: 'Acompanhamento global:' }),
      ).toBeVisible()
      await expect(
        globalDialog.getByRole('status').filter({ hasText: 'Acompanhamento global:' }),
      ).toHaveText(
        'Acompanhamento global: as alterações valem para todas as porções. Para deixar de ser global, use Remover na tabela.',
      )
      await expect(
        globalDialog.getByText(/Aparece em todas as porções, incluindo as novas/),
      ).toHaveCount(0)
      await globalDialog
        .getByRole('textbox', { name: /Quantidade por porção/ })
        .fill('40')
      await globalDialog.getByRole('button', { name: 'Salvar alterações' }).click()
      await expect(globalDialog).toBeHidden()
      await expect(page.getByRole('button', { name: 'Editar Granola' })).toBeFocused()
      expect(
        accompanimentRequests.requests.find((request) => request.method === 'PATCH'),
      ).toMatchObject({
        url: { pathname: `/products/${PRODUCT_ID}/accompaniments/${GLOBAL_LINK.id}` },
        body: { accompanimentTypeId: TYPE_ID, isGlobal: true, quantityPerPortion: 40 },
      })

      await page.getByRole('button', { name: 'Editar Banana' }).click()
      const individualDialog = page.getByRole('dialog', { name: 'Editar Acompanhamento' })
      const enabledSwitch = individualDialog.getByRole('switch', {
        name: 'Disponível para todas as porções',
      })
      await expect(enabledSwitch).toHaveAttribute('aria-checked', 'false')
      await expect(enabledSwitch).not.toHaveAttribute('aria-disabled', 'true')
      await expect(individualDialog.getByRole('status')).toHaveCount(0)
      await expect(
        individualDialog.getByText('Este preço vale só para este vínculo.'),
      ).toBeVisible()
      await enabledSwitch.click()
      await expect(enabledSwitch).toHaveAttribute('aria-checked', 'true')
      await expect(
        individualDialog.getByText('Este preço vale para todas as porções.'),
      ).toBeVisible()
      await expect(
        individualDialog.getByRole('status').filter({
          hasText: 'já está vinculado individualmente a outras porções',
        }),
      ).toBeVisible()
      await individualDialog.getByRole('button', { name: 'Salvar alterações' }).click()
      await expect(individualDialog).toBeHidden()
      expect(
        accompanimentRequests.requests
          .filter((request) => request.method === 'PATCH')
          .at(-1),
      ).toMatchObject({
        url: { pathname: `/products/${PRODUCT_ID}/accompaniments/${INDIVIDUAL_LINK.id}` },
        body: { isGlobal: true },
      })
    })

    test('removes a global from this Portion or from all Portions with the scope query', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { accompanimentRequests } = await mockManagerPage(
        { identityFixture, mrpFixture, page },
        {
          respondAccompaniments: (request) =>
            request.method === 'DELETE'
              ? { status: 204, body: {} }
              : {
                  body: {
                    product: PRODUCT,
                    accompaniments: [GLOBAL_LINK, INDIVIDUAL_LINK],
                  },
                },
        },
      )

      await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
      const removeButton = page.getByRole('button', { name: 'Remover Granola' })
      await removeButton.click()
      const dialog = page.getByRole('alertdialog', { name: 'Remover Granola?' })
      const scopeSwitch = dialog.getByRole('switch', {
        name: 'Remover de todas as porções',
      })
      await expect(scopeSwitch).toHaveAttribute('aria-checked', 'false')
      await expect(dialog.getByRole('status')).toContainText(
        'Granola continua nas outras porções e nas novas.',
      )
      await expect(
        dialog.getByText('Desligado: remove apenas de Taça de açaí.'),
      ).toBeVisible()

      await dialog.getByRole('button', { name: 'Cancelar' }).click()
      await expect(dialog).toBeHidden()
      await expect(removeButton).toBeFocused()

      await removeButton.click()
      await expect(scopeSwitch).toHaveAttribute('aria-checked', 'false')
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(removeButton).toBeFocused()

      await removeButton.click()
      await dialog.getByRole('button', { name: 'Remover desta porção' }).click()
      await expect(dialog).toBeHidden()
      const portionDelete = accompanimentRequests.requests.find(
        (request) => request.method === 'DELETE',
      )
      expect(portionDelete?.url.pathname).toBe(
        `/products/${PRODUCT_ID}/accompaniments/${GLOBAL_LINK.id}`,
      )
      expect(portionDelete?.url.searchParams.get('scope')).toBe('portion')

      await removeButton.click()
      await expect(scopeSwitch).toHaveAttribute('aria-checked', 'false')
      await scopeSwitch.click()
      await expect(scopeSwitch).toHaveAttribute('aria-checked', 'true')
      await expect(dialog.getByRole('status')).toContainText(
        'Será removido de todas as porções, incluindo esta.',
      )
      await dialog.getByRole('button', { name: 'Remover de todas', exact: true }).click()
      await expect(dialog).toBeHidden()
      const deletes = accompanimentRequests.requests.filter(
        (request) => request.method === 'DELETE',
      )
      expect(deletes).toHaveLength(2)
      expect(deletes[1]?.url.searchParams.get('scope')).toBe('all')
    })

    test('keeps the removal scope and shows an inline error when removal fails', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockManagerPage(
        { identityFixture, mrpFixture, page },
        {
          respondAccompaniments: (request) =>
            request.method === 'DELETE'
              ? { status: 409, body: { message: 'Não foi possível remover o vínculo.' } }
              : { body: { product: PRODUCT, accompaniments: [GLOBAL_LINK] } },
        },
      )

      await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
      await page.getByRole('button', { name: 'Remover Granola' }).click()
      const dialog = page.getByRole('alertdialog', { name: 'Remover Granola?' })
      const scopeSwitch = dialog.getByRole('switch', {
        name: 'Remover de todas as porções',
      })
      await scopeSwitch.click()
      await dialog.getByRole('button', { name: 'Remover de todas', exact: true }).click()

      await expect(dialog.getByRole('alert')).toContainText('Não foi possível remover')
      await expect(dialog).toBeVisible()
      await expect(scopeSwitch).toHaveAttribute('aria-checked', 'true')
    })

    test('removes an individual row without a scope query', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { accompanimentRequests } = await mockManagerPage(
        { identityFixture, mrpFixture, page },
        {
          respondAccompaniments: (request) =>
            request.method === 'DELETE'
              ? { status: 204, body: {} }
              : {
                  body: {
                    product: PRODUCT,
                    accompaniments: [GLOBAL_LINK, INDIVIDUAL_LINK],
                  },
                },
        },
      )

      await page.goto(`/products/${PRODUCT_ID}/accompaniments`)
      await page.getByRole('button', { name: 'Remover Banana' }).click()
      const dialog = page.getByRole('alertdialog', { name: 'Remover acompanhamento?' })
      await expect(dialog.getByRole('switch')).toHaveCount(0)
      await dialog.getByRole('button', { name: 'Remover', exact: true }).click()
      await expect(dialog).toBeHidden()

      const individualDelete = accompanimentRequests.requests.find(
        (request) => request.method === 'DELETE',
      )
      expect(individualDelete?.url.pathname).toBe(
        `/products/${PRODUCT_ID}/accompaniments/${INDIVIDUAL_LINK.id}`,
      )
      expect(individualDelete?.url.search).toBe('')
    })
  })
})
