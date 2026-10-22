import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'

import type { IdentityModuleFixture } from '../fixtures/identity-module-fixture'
import type { MrpFixture } from '../fixtures/mrp-module-fixture'
import { expect, test } from '../playwright'

type DependencyFixtures = {
  identityFixture: IdentityModuleFixture
  mrpFixture: MrpFixture
}

const PRODUCT_ID = '00000000-0000-4000-8000-000000000010'
const FOREIGN_PRODUCT_ID = '00000000-0000-4000-8000-000000000011'
const PRODUCT = ProductFaker.fake({
  id: PRODUCT_ID,
  establishmentId: 'establishment-1',
  name: 'Açaí de settings',
  categories: ['ingredient', 'manufacturable'],
  stockControl: 'single',
  unit: 'g',
  idealStock: 4.5,
  allowNegativeStock: false,
  internalNotes: 'Visível apenas para o gerente.',
})

const COMPATIBLE_PREVIEW = {
  currentUnit: 'g',
  targetUnit: 'kg',
  affected: {
    balances: 2,
    brands: [],
    recipeYields: 1,
    recipeIngredients: 2,
    sizes: 0,
    accompanimentLinks: 0,
    hasIdealStock: true,
    hasCurrentUnitCost: true,
  },
}

const CROSS_DIMENSION_PREVIEW = {
  currentUnit: 'g',
  targetUnit: 'un',
  affected: {
    balances: 1,
    brands: [{ brandId: 'brand-1', brandName: 'Marca A' }],
    recipeYields: 1,
    recipeIngredients: 1,
    sizes: 1,
    accompanimentLinks: 0,
    hasIdealStock: true,
    hasCurrentUnitCost: true,
  },
}

const CATEGORY_IMPACT = {
  category: 'ingredient' as const,
  canRemove: false,
  dependencies: [
    {
      kind: 'consuming-recipe' as const,
      productId: PRODUCT_ID,
      productName: 'Receita de açaí',
    },
  ],
}

const REMOVAL_IMPACT = {
  productName: PRODUCT.name,
  removable: {
    brands: 1,
    balances: 2,
    ownedRecipe: 0,
    sizes: 0,
    resaleConfigurations: 0,
    ownedAccompanimentLinks: 0,
    consumingRecipeLinks: 1,
    inverseAccompanimentLinks: 0,
  },
  retainedHistory: { stockTransactions: 3, productions: 1, orders: 2 },
}

const CATEGORY_BLOCKER_SCENARIOS = [
  {
    category: 'ingredient' as const,
    label: 'Ingrediente',
    reference: 'qIePb',
    product: { ...PRODUCT, categories: ['ingredient', 'manufacturable'] as const },
    dependencies: [
      {
        kind: 'consuming-recipe' as const,
        productId: '00000000-0000-4000-8000-000000000020',
        productName: 'Receita: Açaí Batido — 400g',
      },
      {
        kind: 'consuming-recipe' as const,
        productId: '00000000-0000-4000-8000-000000000021',
        productName: 'Receita: Sorbet de Frutas — 200g',
      },
      {
        kind: 'consuming-recipe' as const,
        productId: '00000000-0000-4000-8000-000000000022',
        productName: 'Receita: Milkshake Especial — 150g',
      },
    ],
  },
  {
    category: 'manufacturable' as const,
    label: 'Fabricável',
    reference: 'sATbF',
    product: { ...PRODUCT, categories: ['manufacturable', 'ingredient'] as const },
    dependencies: [
      {
        kind: 'owned-recipe' as const,
        productId: '00000000-0000-4000-8000-000000000023',
        productName: 'Receita própria cadastrada',
      },
    ],
  },
  {
    category: 'accompaniment' as const,
    label: 'Acompanhamento',
    reference: 'C0bvNK',
    product: { ...PRODUCT, categories: ['accompaniment', 'ingredient'] as const },
    dependencies: [
      {
        kind: 'accompaniment-user' as const,
        productId: '00000000-0000-4000-8000-000000000024',
        productName: 'Vinculado a: Açaí Batido',
      },
      {
        kind: 'accompaniment-user' as const,
        productId: '00000000-0000-4000-8000-000000000025',
        productName: 'Vinculado a: Milkshake Especial',
      },
      {
        kind: 'accompaniment-user' as const,
        productId: '00000000-0000-4000-8000-000000000026',
        productName: 'Vinculado a: Sundae Especial',
      },
    ],
  },
  {
    category: 'resale' as const,
    label: 'Revenda',
    reference: 'YsyKL',
    product: { ...PRODUCT, categories: ['resale', 'ingredient'] as const },
    dependencies: [
      {
        kind: 'resale-configuration' as const,
        productId: '00000000-0000-4000-8000-000000000027',
        productName: 'Frooty — R$ 29,90 / un',
        configurationCount: 1,
      },
      {
        kind: 'resale-configuration' as const,
        productId: '00000000-0000-4000-8000-000000000028',
        productName: 'Açaí Brasil — R$ 15,90 / un',
        configurationCount: 1,
      },
      {
        kind: 'resale-configuration' as const,
        productId: '00000000-0000-4000-8000-000000000029',
        productName: 'Marca da Casa — R$ 54,90 / un',
        configurationCount: 1,
      },
    ],
  },
  {
    category: 'portion' as const,
    label: 'Porção',
    reference: 'uT6Rn',
    product: { ...PRODUCT, categories: ['portion', 'ingredient'] as const },
    dependencies: [
      {
        kind: 'portion-size' as const,
        productId: '00000000-0000-4000-8000-000000000030',
        productName: '3 tamanhos cadastrados',
        sizeCount: 3,
      },
      {
        kind: 'portion-accompaniment' as const,
        productId: '00000000-0000-4000-8000-000000000031',
        productName: '5 acompanhamentos vinculados',
        linkCount: 5,
      },
    ],
  },
] as const

test.describe('ProductSettingsPage', () => {
  test('redirects anonymous access and preserves validated retry state', async ({
    page,
  }) => {
    await page.goto(
      `/products/${PRODUCT_ID}/settings?retryCategory=ingredient&retryDependency=consuming-recipe&retryProductId=${PRODUCT_ID}`,
    )

    await page.waitForURL(/\/login\?returnTo=/)
    const returnTo = new URL(page.url()).searchParams.get('returnTo')
    expect(returnTo).toContain(`/products/${PRODUCT_ID}/settings`)
    expect(returnTo).toContain('retryCategory=ingredient')
    expect(returnTo).toContain('retryDependency=consuming-recipe')
  })

  test('lets Operators read product settings without management controls', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockOperatorSession()
    await identityFixture.mockOperatorAccount()
    await mrpFixture.mockProductStock({
      respond: () => ({ body: { product: PRODUCT, stockQuantity: 8, brands: [] } }),
    })

    await page.goto(`/products/${PRODUCT_ID}/settings`)
    await expect(page).toHaveURL(`/products/${PRODUCT_ID}/settings`)
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible()
    await expect(page.getByText('Visível apenas para o gerente.')).toBeVisible()
    await expect(page.getByRole('button', { name: /Salvar/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Editar/ })).toHaveCount(0)
  })

  test('clears a mismatched retry product while preserving the protected shell', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductStock({
      respond: () => ({ body: { product: PRODUCT, brands: [] } }),
    })

    await page.goto(
      `/products/${PRODUCT_ID}/settings?retryCategory=ingredient&retryDependency=consuming-recipe&retryProductId=${FOREIGN_PRODUCT_ID}`,
    )
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible()
    await expect(page).toHaveURL(`/products/${PRODUCT_ID}/settings`)
  })

  test('locks manufacturable for products controlled by brand', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductStock({
      respond: () => ({
        body: {
          product: {
            ...PRODUCT,
            categories: ['ingredient'],
            stockControl: 'by-brand',
          },
          brands: [],
        },
      }),
    })

    await page.goto(`/products/${PRODUCT_ID}/settings`)
    const categoryRegion = page.getByRole('region', { name: 'Categorias do produto' })
    await expect(
      categoryRegion.getByRole('button', { name: 'Fabricável' }),
    ).toBeDisabled()
    await expect(categoryRegion.getByText(/não podem ser fabricáveis/)).toBeVisible()
  })

  for (const scenario of CATEGORY_BLOCKER_SCENARIOS) {
    test(`covers ${scenario.label} blocker ${scenario.reference} at 1560x1450`, async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await identityFixture.mockManagerSession()
      await identityFixture.mockManagerAccount()
      const { requests } = await mrpFixture.mockProductStock({
        respond: (request) => {
          if (request.url.pathname.endsWith('/category-removal-impact')) {
            return {
              body: {
                category: scenario.category,
                canRemove: false,
                dependencies: scenario.dependencies,
              },
            }
          }
          return { body: { product: scenario.product } }
        },
      })
      await mrpFixture.mockGlobalAccompaniment({
        respond: () => ({
          body: {
            accompanimentProductId: PRODUCT_ID,
            accompanimentProductName: PRODUCT.name,
            isGlobal: false,
            unit: PRODUCT.unit,
            salePrice: null,
          },
        }),
      })

      await page.setViewportSize({ width: 1560, height: 1450 })
      await page.goto(`/products/${PRODUCT_ID}/settings`)
      const categoryRegion = page.getByRole('region', { name: 'Categorias do produto' })
      await expect(
        categoryRegion.getByRole('button', { name: scenario.label }),
      ).toBeVisible()
      await categoryRegion.getByRole('button', { name: scenario.label }).click()
      await expect(
        page.getByRole('heading', { name: `${scenario.label} em uso` }),
      ).toBeVisible()
      expect(
        requests.some((request) =>
          request.url.pathname.endsWith('/category-removal-impact'),
        ),
      ).toBe(true)
    })
  }

  test.describe('Accompaniment dependency navigation', () => {
    const ACCOMPANIMENT_DEPENDENCY = {
      category: 'accompaniment' as const,
      canRemove: false,
      dependencies: [
        {
          kind: 'accompaniment-user' as const,
          productId: '00000000-0000-4000-8000-000000000024',
          productName: 'Vinculado a: Açaí Batido',
        },
      ],
    }

    async function mockDependencyScenario(
      { identityFixture, mrpFixture }: DependencyFixtures,
      categories: readonly string[],
    ) {
      await identityFixture.mockManagerSession()
      await identityFixture.mockManagerAccount()
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
      await mrpFixture.mockProductStock({
        respond: (request) => {
          if (request.url.pathname.endsWith('/category-removal-impact')) {
            return { body: ACCOMPANIMENT_DEPENDENCY }
          }
          return {
            body: {
              product: { ...PRODUCT, categories },
              stockQuantity: 0,
              stockSituation: 'normal',
              brands: [],
            },
          }
        },
      })
      await mrpFixture.mockAccompanimentPortions({
        respond: () => ({
          body: {
            items: [],
            page: 1,
            pageSize: 10,
            total: 0,
            totalPages: 0,
            hasPortionProducts: true,
          },
        }),
      })
      await mrpFixture.mockGlobalAccompaniment({
        respond: () => ({
          body: {
            accompanimentProductId: PRODUCT_ID,
            accompanimentProductName: PRODUCT.name,
            isGlobal: false,
            unit: PRODUCT.unit,
            salePrice: null,
          },
        }),
      })
    }

    test('opens the Porções tab of an Accompaniment without Portion with the retry parameters', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockDependencyScenario({ identityFixture, mrpFixture }, [
        'accompaniment',
        'ingredient',
      ])

      await page.goto(`/products/${PRODUCT_ID}/settings`)
      const categoryRegion = page.getByRole('region', { name: 'Categorias do produto' })
      await categoryRegion.getByRole('button', { name: 'Acompanhamento' }).click()
      await expect(
        page.getByRole('heading', { name: 'Acompanhamento em uso' }),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Ver produtos' }).click()

      await expect(page).toHaveURL(
        `/products/${PRODUCT_ID}/portions?retryCategory=accompaniment&retryDependency=accompaniment-user&retryProductId=${PRODUCT_ID}`,
      )
      await expect(page.getByRole('tab', { name: 'Porções' })).toHaveAttribute(
        'aria-selected',
        'true',
      )
    })

    test('keeps the filtered Products listing for a legacy product that is also a Portion', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockDependencyScenario({ identityFixture, mrpFixture }, [
        'portion',
        'accompaniment',
      ])

      await page.goto(`/products/${PRODUCT_ID}/settings`)
      const categoryRegion = page.getByRole('region', { name: 'Categorias do produto' })
      await categoryRegion.getByRole('button', { name: 'Acompanhamento' }).click()
      await expect(
        page.getByRole('heading', { name: 'Acompanhamento em uso' }),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Ver produtos' }).click()

      await expect(page).toHaveURL(
        `/products?retryCategory=accompaniment&retryDependency=accompaniment-user&retryProductId=${PRODUCT_ID}&usedAsAccompanimentId=${PRODUCT_ID}`,
      )
    })
  })

  test('renders persisted settings at desktop and narrow viewports', async ({
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
    const { requests } = await mrpFixture.mockProductStock({
      respond: (request) => ({
        body: request.url.pathname.endsWith('/settings')
          ? { product: PRODUCT }
          : { product: PRODUCT, brands: [] },
      }),
    })

    await page.setViewportSize({ width: 1560, height: 1450 })
    await page.goto(`/products/${PRODUCT_ID}/settings`)
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Informações básicas' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Nome do produto' })).toHaveValue(
      PRODUCT.name,
    )
    await expect(page.getByRole('textbox', { name: 'Estoque ideal' })).toHaveValue('4.5')
    await expect(page.getByRole('combobox', { name: 'Status' })).toContainText('Ativo')
    await expect(
      page.getByRole('checkbox', { name: 'Permitir estoque negativo' }),
    ).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remover produto' })).toBeVisible()
    expect(requests[0]?.method).toBe('GET')
    expect(requests[0]?.url.pathname).toBe(`/products/${PRODUCT_ID}/settings`)
    expect(consoleErrors).toEqual([])
    expect(failedRequests).toEqual([])
  })

  test('covers loading and recoverable read failure states', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let finishLoading: (() => void) | undefined
    await mrpFixture.mockProductStock({
      respond: (_request, requestNumber) => {
        if (requestNumber > 2) {
          return { status: 500, body: { message: 'read failure' } }
        }
        return new Promise((resolve) => {
          finishLoading = () => resolve({ body: { product: PRODUCT } })
        })
      },
    })
    await page.setViewportSize({ width: 1560, height: 1450 })
    const navigation = page.goto(`/products/${PRODUCT_ID}/settings`)
    await expect(
      page.getByRole('status', { name: 'Carregando configurações do produto' }),
    ).toBeVisible()
    finishLoading?.()
    await navigation
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    const narrowNavigation = page.reload()
    await expect(
      page.getByRole('status', { name: 'Carregando configurações do produto' }),
    ).toBeVisible()
    finishLoading?.()
    await narrowNavigation
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible()

    await page.setViewportSize({ width: 1560, height: 1450 })
    const failedSettingsResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === `/products/${PRODUCT_ID}/settings` &&
        response.status() === 500,
    )
    await page.reload()
    await (await failedSettingsResponse).finished()
    await expect(
      page.getByRole('heading', { name: 'Não foi possível carregar as configurações' }),
    ).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })
  })

  test('covers pending save, dependency recovery and removal impact dialogs', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let finishSave: (() => void) | undefined
    const { requests } = await mrpFixture.mockProductStock({
      respond: (request) => {
        if (request.method === 'PATCH' && request.url.pathname.endsWith('/settings')) {
          return new Promise((resolve) => {
            finishSave = () => resolve({ body: { product: PRODUCT } })
          })
        }
        if (request.url.pathname.endsWith('/category-removal-impact')) {
          return { body: CATEGORY_IMPACT }
        }
        if (request.url.pathname.endsWith('/removal-impact')) {
          return { body: REMOVAL_IMPACT }
        }
        if (request.url.pathname.endsWith('/unit-change-preview')) {
          return { body: COMPATIBLE_PREVIEW }
        }
        return { body: { product: PRODUCT } }
      },
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/products/${PRODUCT_ID}/settings`)

    const name = page.getByRole('textbox', { name: 'Nome do produto' })
    await name.fill('Açaí pendente')
    await name.blur()
    await expect
      .poll(() => requests.some((request) => request.method === 'PATCH'))
      .toBe(true)
    await expect(page.getByRole('status')).toContainText('Salvando alteração…')
    finishSave?.()

    const categoryRegion = page.getByRole('region', { name: 'Categorias do produto' })
    await expect(categoryRegion).toBeVisible()
    await expect(
      categoryRegion.getByRole('button', { name: 'Ingrediente' }),
    ).toBeEnabled()
    await categoryRegion.getByRole('button', { name: 'Ingrediente' }).click()
    await expect(page.getByRole('heading', { name: 'Ingrediente em uso' })).toBeVisible()
    await page.getByRole('button', { name: 'Entendi' }).click()

    await page.getByRole('button', { name: 'Remover produto' }).click()
    await expect(page.getByRole('heading', { name: 'Remover produto?' })).toBeVisible()
    await expect(page.getByText(/Nenhuma remoção parcial será feita/)).toBeVisible()
    expect(
      requests.some((request) => request.url.pathname.endsWith('/removal-impact')),
    ).toBe(true)
  })

  test('covers save-pending at the exact desktop and narrow viewports', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let patchCount = 0
    let finishSave: (() => void) | undefined
    await mrpFixture.mockProductStock({
      respond: (request) => {
        if (request.method === 'PATCH' && request.url.pathname.endsWith('/settings')) {
          patchCount += 1
          return new Promise((resolve) => {
            finishSave = () => resolve({ body: { product: PRODUCT } })
          })
        }
        return { body: { product: PRODUCT } }
      },
    })

    await page.setViewportSize({ width: 1560, height: 1450 })
    await page.goto(`/products/${PRODUCT_ID}/settings`)
    const name = page.getByRole('textbox', { name: 'Nome do produto' })
    await name.fill('Açaí pendente desktop')
    await name.blur()
    await expect.poll(() => patchCount).toBe(1)
    await expect(page.getByRole('status')).toContainText('Salvando alteração…')
    finishSave?.()

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(name).toHaveValue(PRODUCT.name)
    await name.fill('Açaí pendente narrow')
    await name.blur()
    await expect.poll(() => patchCount).toBe(2)
    await expect(page.getByRole('status')).toContainText('Salvando alteração…')
    finishSave?.()
  })

  test('uses the latest returned version for consecutive field saves', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let patchCount = 0
    const firstUpdatedAt = new Date(PRODUCT.updatedAt.getTime() + 1000)
    const secondUpdatedAt = new Date(PRODUCT.updatedAt.getTime() + 2000)
    const { requests } = await mrpFixture.mockProductStock({
      respond: (request) => {
        if (request.method === 'PATCH' && request.url.pathname.endsWith('/settings')) {
          patchCount += 1
          return {
            body: {
              product: {
                ...PRODUCT,
                name: patchCount === 1 ? 'Primeiro nome salvo' : 'Primeiro nome salvo',
                idealStock: patchCount === 1 ? PRODUCT.idealStock : null,
                updatedAt: patchCount === 1 ? firstUpdatedAt : secondUpdatedAt,
              },
            },
          }
        }
        return { body: { product: PRODUCT } }
      },
    })

    await page.goto(`/products/${PRODUCT_ID}/settings`)
    const name = page.getByRole('textbox', { name: 'Nome do produto' })
    await name.fill('Primeiro nome salvo')
    await name.blur()
    await expect.poll(() => patchCount).toBe(1)
    await expect(name).toHaveValue('Primeiro nome salvo')

    const idealStock = page.getByRole('textbox', { name: 'Estoque ideal' })
    await idealStock.fill('')
    await idealStock.blur()
    await expect.poll(() => patchCount).toBe(2)

    const settingsRequests = requests.filter(
      (request) =>
        request.method === 'PATCH' && request.url.pathname.endsWith('/settings'),
    )
    expect(settingsRequests[1]?.body).toMatchObject({
      expectedUpdatedAt: firstUpdatedAt.toISOString(),
    })
  })

  test('covers the destructive removal reference at the exact desktop viewport', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductStock({
      respond: (request) => {
        if (request.url.pathname.endsWith('/removal-impact'))
          return { body: REMOVAL_IMPACT }
        return { body: { product: PRODUCT } }
      },
    })
    await page.setViewportSize({ width: 1560, height: 1450 })
    await page.goto(`/products/${PRODUCT_ID}/settings`)
    await page.getByRole('button', { name: 'Remover produto' }).click()
    await expect(page.getByRole('heading', { name: 'Remover produto?' })).toBeVisible()
  })

  test('covers unit preview and confirms cross-dimension numeric preservation', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let previewNumber = 0
    const { requests } = await mrpFixture.mockProductStock({
      respond: (request) => {
        if (request.url.pathname.endsWith('/unit-change-preview')) {
          previewNumber += 1
          return {
            body: previewNumber < 3 ? COMPATIBLE_PREVIEW : CROSS_DIMENSION_PREVIEW,
          }
        }
        return { body: { product: PRODUCT } }
      },
    })
    await page.setViewportSize({ width: 1560, height: 1450 })
    await page.goto(`/products/${PRODUCT_ID}/settings`)
    const unit = page.getByRole('combobox', { name: 'Unidade de estoque' })
    await unit.click()
    await page.getByRole('option', { name: 'Gramas (g)' }).click()
    await expect(
      page.getByRole('heading', { name: 'Alterar unidade de estoque' }),
    ).toBeHidden()
    expect(
      requests.filter((request) => request.url.pathname.endsWith('/unit-change-preview')),
    ).toHaveLength(0)

    await unit.click()
    await page.getByRole('option', { name: 'Quilogramas (kg)' }).click()
    await expect(
      page.getByRole('heading', { name: 'Alterar unidade de estoque' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(unit).toBeFocused()

    await unit.click()
    await page.getByRole('option', { name: 'Quilogramas (kg)' }).click()
    await expect(
      page.getByRole('heading', { name: 'Alterar unidade de estoque' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Alterar unidade' }).click()
    await expect(
      page.getByRole('heading', { name: 'Alterar unidade de estoque' }),
    ).toBeHidden()
    const unitChangeRequest = requests.find(
      (request) => request.method === 'PATCH' && request.url.pathname.endsWith('/unit'),
    )
    expect(unitChangeRequest?.body).toEqual({
      expectedUpdatedAt: PRODUCT.updatedAt.toISOString(),
      targetUnit: 'kg',
    })

    await unit.click()
    await page.getByRole('option', { name: 'Unidades (un)' }).click()
    await expect(
      page.getByText(/sem alterar os valores numéricos existentes/i),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Alterar unidade' })).toBeVisible()
    await page.getByRole('button', { name: 'Alterar unidade' }).click()
    await expect(
      page.getByRole('heading', { name: 'Alterar unidade de estoque' }),
    ).toBeHidden()
    await expect(page.getByRole('textbox', { name: /fator/i })).toHaveCount(0)
  })

  test('disables status while its save is pending', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    let finishSave: (() => void) | undefined
    const { requests } = await mrpFixture.mockProductStock({
      respond: (request) => {
        if (request.method === 'PATCH' && request.url.pathname.endsWith('/settings')) {
          return new Promise((resolve) => {
            finishSave = () => resolve({ body: { product: PRODUCT } })
          })
        }
        return { body: { product: PRODUCT } }
      },
    })

    await page.goto(`/products/${PRODUCT_ID}/settings`)
    const status = page.getByRole('combobox', { name: 'Status' })
    await status.click()
    await page.getByRole('option', { name: 'Inativo' }).click()
    await expect
      .poll(() => requests.filter((request) => request.method === 'PATCH'))
      .toHaveLength(1)
    await expect(status).toBeDisabled()
    expect(requests.find((request) => request.method === 'PATCH')?.body).toMatchObject({
      status: 'inactive',
    })

    finishSave?.()
    await expect(status).toBeEnabled()
  })

  test('covers recoverable removal failure at 390x844', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductStock({
      respond: (request) => {
        if (request.url.pathname.endsWith('/removal-impact'))
          return { body: REMOVAL_IMPACT }
        if (request.method === 'DELETE') {
          return { status: 500, body: { message: 'removal failure' } }
        }
        return { body: { product: PRODUCT } }
      },
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/products/${PRODUCT_ID}/settings`)
    await page.getByRole('button', { name: 'Remover produto' }).click()
    await expect(page.getByRole('heading', { name: 'Remover produto?' })).toBeVisible()
    await page.getByRole('button', { name: 'Remover produto' }).click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Não foi possível remover o produto' }),
    ).toBeVisible()
  })

  test('covers the narrow keyboard dialog path', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    await mrpFixture.mockProductStock({
      respond: (request) => {
        if (request.url.pathname.endsWith('/category-removal-impact')) {
          return { body: CATEGORY_IMPACT }
        }
        return { body: { product: PRODUCT } }
      },
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/products/${PRODUCT_ID}/settings`)
    const categoryButton = page
      .getByRole('region', { name: 'Categorias do produto' })
      .getByRole('button', { name: 'Ingrediente' })
    await categoryButton.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'Ingrediente em uso' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { name: 'Ingrediente em uso' })).toBeHidden()
  })
})
