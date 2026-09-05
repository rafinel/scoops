import path from 'node:path'

import type { Page } from '@playwright/test'
import {
  ProductFaker,
  ProductionFaker,
  RecipeFaker,
} from '@scoops/core/mrp/domain/entities/fakers'

import type { MrpFixture } from '../../fixtures/mrp-module-fixture'
import { expect, test } from '../../playwright'

const PRODUCT_ID = 'product-1'
const SCREENSHOT_DIRECTORY = path.resolve(process.cwd(), 'test-results')
const EXPECTED_UNMOUNTED_WARNING =
  /Can't perform a React state update on a component that hasn't mounted yet/

const PRODUCT = ProductFaker.fake({
  id: PRODUCT_ID,
  establishmentId: 'establishment-1',
  name: 'Polpa de morango',
  unit: 'kg',
  categories: ['ingredient'],
  stockControl: 'by-brand',
  status: 'active',
  allowNegativeStock: false,
  idealStock: 10,
})

test.describe('Product recipe nested route', () => {
  test.describe.configure({ mode: 'serial' })

  test('renders Recipe references and mutation dialogs with stateful mocked transport', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const client = observeClient(page)
    await mockRecipeCatalog(mrpFixture)
    await mockRecipeIngredientSources(mrpFixture)
    const { requests } = await mrpFixture.mockProductRecipe({
      respond: ({ method, url }) => {
        if (url.pathname.endsWith('/production-preview')) {
          return { body: fakeProductionPreview() }
        }
        if (url.pathname.endsWith('/productions')) {
          return { body: fakeProduction(), status: 201 }
        }
        if (method === 'DELETE') return { body: {}, status: 204 }
        return { body: fakeRecipeResponse() }
      },
    })

    await page.setViewportSize({ width: 1560, height: 1200 })
    await navigateToRecipe(page)
    await expect(page.getByRole('tab', { name: 'Receita' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.getByRole('button', { name: 'Produzir' })).toBeEnabled()
    await expect(page.getByText('CMV total')).toBeVisible()
    await expect(page.getByText('R$ 9,00', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Custo unitário')).toBeVisible()
    await expect(page.getByText('R$ 0,01')).toBeVisible()
    await expect(page.getByText('Máximo produzível')).toBeVisible()
    await expect(page.getByText('4000 kg')).toBeVisible()
    await expect(page.getByText('1,00%', { exact: true })).toBeVisible()
    await expect
      .poll(() => requests[0]?.url.pathname)
      .toBe(`/products/${PRODUCT_ID}/recipe`)
    await captureCleanRecipeState(
      page,
      client,
      'products-recipe-populated-1560x1200.png',
      true,
    )

    await page.getByRole('button', { name: 'Adicionar ingrediente' }).click()
    const addDialog = page.getByRole('dialog', { name: 'Adicionar ingrediente' })
    await expect(addDialog).toBeVisible()
    await expect(addDialog.getByRole('combobox', { name: 'Produto' })).toBeVisible()
    await addDialog.getByRole('combobox', { name: 'Produto' }).click()
    await expect(
      page.getByRole('option', { name: /Leite sem custo atual/ }),
    ).toBeDisabled()
    await expect(
      page.getByRole('option', { name: /Calda sem marca principal/ }),
    ).toBeDisabled()
    await page.getByRole('option', { name: 'Creme de leite' }).click()
    await expect(addDialog.getByText('Estoque único')).toBeVisible()
    await addDialog.getByRole('spinbutton', { name: 'Quantidade' }).fill('2')
    await expect(addDialog.getByText('CUSTO ATUAL').locator('..')).toContainText(
      'R$ 3,50',
    )
    await expect(addDialog.getByText('R$ 7,00 · 43,75%')).toBeVisible()
    await expect(addDialog.getByText('8 kg')).toBeVisible()
    await page.setViewportSize({ width: 676, height: 682 })
    await captureCleanRecipeState(page, client, 'products-recipe-add-676x682.png')
    await addDialog.getByRole('button', { name: 'Cancelar' }).click()

    await page.setViewportSize({ width: 676, height: 684 })
    await page.getByRole('button', { name: 'Editar Polpa' }).click()
    const editDialog = page.getByRole('dialog', { name: 'Editar ingrediente' })
    await expect(editDialog.getByRole('spinbutton', { name: 'Quantidade' })).toHaveValue(
      '2',
    )
    const brandSelect = editDialog.getByRole('combobox', { name: 'Marca' })
    await expect(brandSelect).toBeVisible()
    await expect(brandSelect).toContainText('Marca principal')
    await captureCleanRecipeState(page, client, 'products-recipe-edit-676x684.png')
    await brandSelect.click()
    await page.getByRole('option', { name: 'Marca alternativa' }).click()
    await expect(brandSelect).toContainText('Marca alternativa')
    await expect(editDialog.getByText('FONTE').locator('..')).toContainText(
      'Marca alternativa',
    )
    await expect(editDialog.getByText('CUSTO ATUAL').locator('..')).toContainText('5,00')
    await expect(editDialog.getByText('ESTOQUE').locator('..')).toContainText('6 kg')
    const saveButton = editDialog.getByRole('button', { name: 'Salvar alterações' })
    await saveButton.click()
    await expect
      .poll(
        () =>
          requests.find(
            ({ method, url }) =>
              method === 'PATCH' && url.pathname.endsWith('/recipe/ingredients/line-1'),
          )?.body,
      )
      .toEqual({
        ingredientBrandId: '00000000-0000-4000-8000-000000000102',
        quantity: 2,
      })

    await page.setViewportSize({ width: 596, height: 335 })
    await page.getByRole('button', { name: 'Remover Polpa' }).click()
    await expect(
      page.getByRole('alertdialog', { name: 'Remover ingrediente?' }),
    ).toBeVisible()
    await captureCleanRecipeState(page, client, 'products-recipe-remove-596x335.png')
  })

  test('validates a zero ingredient quantity before issuing a recipe mutation', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const client = observeClient(page)
    await mockRecipeCatalog(mrpFixture)
    await mockRecipeIngredientSources(mrpFixture)
    const { requests } = await mrpFixture.mockProductRecipe({
      respond: () => ({ body: fakeRecipeResponse() }),
    })

    await page.setViewportSize({ width: 676, height: 682 })
    await navigateToRecipe(page)
    await page.getByRole('button', { name: 'Adicionar ingrediente' }).click()
    const dialog = page.getByRole('dialog', { name: 'Adicionar ingrediente' })
    await dialog.getByRole('combobox', { name: 'Produto' }).click()
    await page.getByRole('option', { name: 'Creme de leite' }).click()
    await dialog.getByRole('spinbutton', { name: 'Quantidade' }).fill('0')
    await dialog.getByRole('button', { name: 'Adicionar', exact: true }).click()

    await expect(dialog.getByRole('alert')).toHaveText(
      'Informe uma quantidade maior que zero.',
    )
    await expect(dialog.getByRole('spinbutton', { name: 'Quantidade' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(
      requests.filter(
        ({ method, url }) =>
          method === 'POST' && url.pathname.endsWith('/recipe/ingredients'),
      ),
    ).toHaveLength(0)
    await captureCleanRecipeState(
      page,
      client,
      'products-recipe-add-quantity-validation-676x682.png',
    )
  })

  test('covers Recipe loading, error retry, unsaved yield, and saved-empty states', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const client = observeClient(page)
    await mockRecipeCatalog(mrpFixture)
    await mockRecipeIngredientSources(mrpFixture)
    let releaseRecipe!: () => void
    const recipeGate = new Promise<void>((resolve) => {
      releaseRecipe = resolve
    })
    let recipeReads = 0
    let recipeState: 'empty' | 'populated' = 'empty'
    await mrpFixture.mockProductRecipe({
      respond: async ({ method, url }) => {
        if (url.pathname.endsWith('/production-preview')) {
          return { body: fakeProductionPreview() }
        }
        if (method === 'PUT') {
          recipeState = 'empty'
          return { body: fakeRecipeResponse({ ingredients: [] }) }
        }
        if (url.pathname.endsWith('/recipe')) {
          recipeReads += 1
          if (recipeReads === 1) await recipeGate
          if (recipeReads === 2)
            return { body: { message: 'recipe unavailable' }, status: 503 }
          return {
            body:
              recipeState === 'empty'
                ? fakeRecipeResponse({ ingredients: [] })
                : fakeRecipeResponse(),
          }
        }
        return { body: fakeProductionPreview() }
      },
    })

    await page.setViewportSize({ width: 1560, height: 1200 })
    const productStockResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname === `/products/${PRODUCT_ID}/stock`,
    )
    const pendingRecipeRequest = page.waitForRequest(
      (request) =>
        ['fetch', 'xhr'].includes(request.resourceType()) &&
        request.method() === 'GET' &&
        new URL(request.url()).pathname === `/products/${PRODUCT_ID}/recipe`,
    )
    const recipeResponse = page.waitForResponse(
      (response) =>
        ['fetch', 'xhr'].includes(response.request().resourceType()) &&
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname === `/products/${PRODUCT_ID}/recipe`,
    )
    const navigation = page.goto(`/products/${PRODUCT_ID}/recipe`, {
      waitUntil: 'domcontentloaded',
    })
    await navigation
    await productStockResponse
    await pendingRecipeRequest
    await expect(page.getByRole('status', { name: 'Carregando receita' })).toBeVisible()
    await captureCleanRecipeState(
      page,
      client,
      'products-recipe-loading-1560x1200.png',
      true,
    )
    releaseRecipe()
    await (await recipeResponse).finished()
    await expect(
      page.getByRole('heading', { name: 'Receita', exact: true }),
    ).toBeVisible()
    await page.reload()
    await expect(page.getByRole('alert')).toContainText(
      'Não foi possível carregar a receita',
    )
    await expect(page.getByRole('heading', { name: RECIPE_PRODUCT.name })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Receita' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await captureCleanRecipeState(
      page,
      client,
      'products-recipe-error-1560x1200.png',
      true,
      [/503 \(Service Unavailable\)/],
    )
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText('Comece a montar sua receita')).toBeVisible()
    const yieldInput = page.getByRole('spinbutton', {
      name: 'Rendimento estimado por:',
    })
    await yieldInput.fill('0')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByRole('alert')).toContainText('Informe um rendimento positivo')
    await captureCleanRecipeState(
      page,
      client,
      'products-recipe-yield-validation-1560x1200.png',
      true,
    )
    await yieldInput.fill('1000')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Comece a montar sua receita')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Produzir' })).toBeDisabled()
    await page.setViewportSize({ width: 1201, height: 538 })
    await captureCleanRecipeState(
      page,
      client,
      'products-recipe-empty-1201x538.png',
      false,
      [EXPECTED_UNMOUNTED_WARNING],
    )
  })

  test('covers production preview states, confirmation, and narrow keyboard access', async ({
    page,
    identityFixture,
    mrpFixture,
  }) => {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
    const client = observeClient(page)
    await mockRecipeCatalog(mrpFixture)
    await mockRecipeIngredientSources(mrpFixture)
    let previewState:
      | 'sufficient'
      | 'shortage'
      | 'no-main-brand'
      | 'pending'
      | 'failure' = 'sufficient'
    let releasePreview!: () => void
    const previewGate = new Promise<void>((resolve) => {
      releasePreview = resolve
    })
    const { requests } = await mrpFixture.mockProductRecipe({
      respond: async ({ method, url }) => {
        if (url.pathname.endsWith('/production-preview')) {
          if (previewState === 'pending') await previewGate
          if (previewState === 'failure') {
            return { body: { message: 'preview unavailable' }, status: 503 }
          }
          if (previewState === 'no-main-brand') {
            return {
              body: {
                ...fakeProductionPreview(),
                canProduce: false,
                blockReasons: ['Polpa não tem marca principal definida.'],
              },
            }
          }
          return {
            body: fakeProductionPreview({ shortage: previewState === 'shortage' }),
          }
        }
        if (url.pathname.endsWith('/productions')) {
          return { body: fakeProduction(), status: 201 }
        }
        if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
          return { body: fakeRecipeResponse() }
        }
        return { body: fakeRecipeResponse() }
      },
    })

    await page.setViewportSize({ width: 796, height: 790 })
    await navigateToRecipe(page)
    await page.getByRole('button', { name: 'Produzir' }).click()
    const produceDialog = page.getByRole('dialog', { name: 'Registrar produção' })
    await expect(produceDialog.getByText('CUSTO DA PRODUÇÃO')).toBeVisible()
    const batchesMode = produceDialog.getByRole('button', { name: 'Lote' })
    const quantityMode = produceDialog.getByRole('button', { name: 'Quantidade' })
    await expect(batchesMode).toHaveAttribute('aria-pressed', 'true')
    await expect(batchesMode).toHaveClass(/shadow-sm/)
    await expect(quantityMode).toHaveAttribute('aria-pressed', 'false')
    await expect(
      produceDialog.getByRole('button', { name: 'Confirmar produção' }),
    ).toBeEnabled()
    await captureCleanRecipeState(
      page,
      client,
      'products-recipe-produce-796x790.png',
      false,
      [EXPECTED_UNMOUNTED_WARNING],
    )
    const previewRequestsBeforeInvalidBatch = requests.filter(
      ({ method, url }) =>
        method === 'POST' && url.pathname.endsWith('/production-preview'),
    ).length
    await produceDialog.getByRole('spinbutton', { name: 'Lotes' }).fill('1.5')
    await expect(produceDialog.getByRole('alert')).toContainText(
      'Informe um número inteiro positivo de lotes.',
    )
    await expect(
      produceDialog.getByRole('button', { name: 'Confirmar produção' }),
    ).toBeDisabled()
    expect(
      requests.filter(
        ({ method, url }) =>
          method === 'POST' && url.pathname.endsWith('/production-preview'),
      ),
    ).toHaveLength(previewRequestsBeforeInvalidBatch)
    await produceDialog.getByRole('spinbutton', { name: 'Lotes' }).fill('1')
    await expect(produceDialog.getByText('CUSTO DA PRODUÇÃO')).toBeVisible()
    await quantityMode.click()
    await expect(quantityMode).toHaveAttribute('aria-pressed', 'true')
    await expect(quantityMode).toHaveClass(/shadow-sm/)
    await expect(batchesMode).toHaveAttribute('aria-pressed', 'false')
    await expect(
      produceDialog.getByRole('spinbutton', { name: 'Quantidade' }),
    ).toHaveValue('1000')
    await produceDialog.getByRole('button', { name: 'Confirmar produção' }).click()
    await expect(produceDialog).toBeHidden()
    expect(
      requests.some(
        ({ method, url }) => method === 'POST' && url.pathname.endsWith('/productions'),
      ),
    ).toBe(true)

    previewState = 'shortage'
    await page.getByRole('button', { name: 'Produzir' }).click()
    await expect(produceDialog.getByRole('alert')).toContainText('faltam')
    await expect(
      produceDialog.getByRole('button', { name: 'Confirmar produção' }),
    ).toBeDisabled()
    await page.setViewportSize({ width: 640, height: 760 })
    await captureCleanRecipeState(
      page,
      client,
      'products-recipe-produce-shortage-640x760.png',
    )
    await produceDialog.getByRole('button', { name: 'Cancelar' }).click()

    previewState = 'no-main-brand'
    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Receita', exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Produzir' }).click()
    await expect(produceDialog.getByRole('alert')).toContainText(
      'Polpa não tem marca principal definida.',
    )
    await expect(
      produceDialog.getByRole('button', { name: 'Confirmar produção' }),
    ).toBeDisabled()
    await expect(produceDialog.getByRole('spinbutton', { name: 'Lotes' })).toHaveValue(
      '1',
    )
    await captureCleanRecipeState(
      page,
      client,
      'products-recipe-produce-no-main-brand-640x760.png',
    )
    await produceDialog.getByRole('button', { name: 'Cancelar' }).click()

    previewState = 'failure'
    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Receita', exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Produzir' }).click()
    await expect(
      produceDialog
        .getByRole('alert')
        .filter({ hasText: 'Não foi possível calcular a produção' }),
    ).toBeVisible()
    await captureCleanRecipeState(
      page,
      client,
      'products-recipe-produce-preview-error-640x760.png',
      false,
      [/503 \(Service Unavailable\)/],
    )
    previewState = 'sufficient'
    await produceDialog.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(produceDialog.getByText('CUSTO DA PRODUÇÃO')).toBeVisible()
    await produceDialog.getByRole('button', { name: 'Cancelar' }).click()

    previewState = 'pending'
    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Receita', exact: true }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Produzir' }).click()
    await expect(produceDialog.getByRole('status')).toContainText('Calculando projeção')
    await captureCleanRecipeState(
      page,
      client,
      'products-recipe-produce-pending-640x760.png',
    )
    releasePreview()
    await expect(produceDialog.getByText('CUSTO DA PRODUÇÃO')).toBeVisible()
    await produceDialog.getByRole('button', { name: 'Cancelar' }).click()

    await page.setViewportSize({ width: 320, height: 900 })
    await expect(page.getByRole('button', { name: 'Produzir' })).toBeVisible()
    await page.getByRole('button', { name: 'Produzir' }).focus()
    await expect(page.getByRole('button', { name: 'Produzir' })).toBeFocused()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true)
    await page.getByRole('button', { name: 'Produzir' }).click()
    const narrowProduceDialog = page.getByRole('dialog', { name: 'Registrar produção' })
    await expect(narrowProduceDialog.getByText('CUSTO DA PRODUÇÃO')).toBeVisible()
    expect(
      await narrowProduceDialog.evaluate(
        (dialog) => dialog.scrollWidth <= dialog.clientWidth,
      ),
    ).toBe(true)
    await captureCleanRecipeState(
      page,
      client,
      'products-recipe-produce-narrow-320x900.png',
      true,
    )
    await narrowProduceDialog.getByRole('button', { name: 'Cancelar' }).click()
  })
})

const RECIPE_PRODUCT = ProductFaker.fake({
  ...PRODUCT,
  categories: ['manufacturable'],
  stockControl: 'single',
})

const RECIPE_INGREDIENT_PRODUCT = ProductFaker.fake({
  ...PRODUCT,
  id: '00000000-0000-4000-8000-000000000011',
  name: 'Polpa',
  categories: ['ingredient'],
  stockControl: 'by-brand',
})

const INGREDIENT_PRODUCT = ProductFaker.fake({
  ...PRODUCT,
  id: 'ingredient-2',
  name: 'Creme de leite',
  categories: ['ingredient'],
  currentUnitCost: 3.5,
  stockControl: 'single',
})

const NO_COST_INGREDIENT_PRODUCT = ProductFaker.fake({
  ...INGREDIENT_PRODUCT,
  id: 'ingredient-no-cost',
  name: 'Leite sem custo atual',
  currentUnitCost: undefined,
})

const NO_PRIMARY_BRAND_INGREDIENT_PRODUCT = ProductFaker.fake({
  ...INGREDIENT_PRODUCT,
  id: 'ingredient-no-primary-brand',
  name: 'Calda sem marca principal',
  stockControl: 'by-brand',
})

const RECIPE_INGREDIENT_PRIMARY_BRAND = {
  brand: {
    id: '00000000-0000-4000-8000-000000000101',
    establishmentId: 'establishment-1',
    productId: RECIPE_INGREDIENT_PRODUCT.id,
    name: 'Marca principal',
    unit: 'kg',
    packageQuantity: 1,
    packagePrice: 4,
    isPrimary: true,
    createdAt: '2026-08-18T12:00:00.000Z',
    updatedAt: '2026-08-18T12:00:00.000Z',
  },
  stockQuantity: 10,
  unitPrice: 4,
}

const RECIPE_INGREDIENT_ALTERNATE_BRAND = {
  brand: {
    id: '00000000-0000-4000-8000-000000000102',
    establishmentId: 'establishment-1',
    productId: RECIPE_INGREDIENT_PRODUCT.id,
    name: 'Marca alternativa',
    unit: 'kg',
    packageQuantity: 1,
    packagePrice: 5,
    isPrimary: false,
    createdAt: '2026-08-18T12:00:00.000Z',
    updatedAt: '2026-08-18T12:00:00.000Z',
  },
  stockQuantity: 6,
  unitPrice: 5,
}

const RECIPE_CATALOG_RESPONSE = {
  items: [
    {
      product: RECIPE_INGREDIENT_PRODUCT,
      brandCount: 2,
      stockQuantity: 10,
      idealStock: 5,
      stockSituation: 'normal',
    },
    {
      product: INGREDIENT_PRODUCT,
      brandCount: 0,
      stockQuantity: 8,
      idealStock: 5,
      stockSituation: 'normal',
    },
    {
      product: NO_COST_INGREDIENT_PRODUCT,
      brandCount: 0,
      stockQuantity: 4,
      idealStock: 5,
      stockSituation: 'low',
    },
    {
      product: NO_PRIMARY_BRAND_INGREDIENT_PRODUCT,
      brandCount: 1,
      stockQuantity: 6,
      idealStock: 5,
      stockSituation: 'normal',
    },
  ],
  page: 1,
  pageSize: 10,
  totalItems: 1,
  totalPages: 1,
  kpis: { products: 1, brands: 0, lowStock: 0 },
}

function fakeRecipeResponse({
  ingredients = [
    {
      id: 'line-1',
      ingredientProductId: '00000000-0000-4000-8000-000000000011',
      ingredientProductName: 'Polpa',
      ingredientBrandId: '00000000-0000-4000-8000-000000000101',
      ingredientBrandName: 'Marca principal',
      unit: 'kg',
      quantity: 2,
      unitCost: 4.5,
      lineCost: 9,
      cogsPercentage: 1,
      currentBalance: 10,
      capacity: 5000,
      isLimiting: true,
    },
  ],
}: {
  ingredients?: readonly {
    id: string
    ingredientProductId: string
    ingredientProductName: string
    ingredientBrandId?: string
    ingredientBrandName?: string
    unit: string
    quantity: number
    unitCost: number
    lineCost: number
    cogsPercentage: number
    currentBalance: number
    capacity: number
    isLimiting: boolean
  }[]
} = {}) {
  const recipe = RecipeFaker.fake({
    id: 'recipe-1',
    establishmentId: 'establishment-1',
    productId: PRODUCT_ID,
    yieldQuantity: 1000,
  })

  return {
    product: RECIPE_PRODUCT,
    recipe: {
      id: recipe.id,
      yieldQuantity: recipe.yieldQuantity,
      totalCost: ingredients.reduce(
        (total, ingredient) => total + ingredient.lineCost,
        0,
      ),
      unitCost: ingredients.length ? 0.009 : 0,
      maximumProducibleQuantity: ingredients.length ? 4000 : 0,
      ingredients,
    },
  }
}

function fakeProductionPreview({ shortage = false }: { shortage?: boolean } = {}) {
  return {
    productId: PRODUCT_ID,
    unit: 'kg',
    quantity: 1000,
    recipeYield: 1000,
    batches: 1,
    consumptions: [
      {
        ingredientProductId: '00000000-0000-4000-8000-000000000011',
        ingredientProductName: 'Polpa',
        unit: 'kg',
        quantity: 2,
        unitCost: 4.5,
        lineCost: 9,
        currentBalance: shortage ? 1 : 10,
        projectedBalance: shortage ? -1 : 8,
        missingQuantity: shortage ? 1 : 0,
        allowsNegativeStock: false,
      },
      {
        ingredientProductId: 'ingredient-2',
        ingredientProductName: 'Produto marca E2E 1787266847608',
        unit: 'un',
        quantity: 55,
        unitCost: 1,
        lineCost: 55,
        currentBalance: shortage ? -49 : 6,
        projectedBalance: shortage ? -104 : 61,
        missingQuantity: shortage ? 104 : 0,
        allowsNegativeStock: false,
      },
    ],
    totalCost: 9,
    currentOutputStock: 0,
    projectedOutputStock: 1000,
    canProduce: !shortage,
    blockReasons: shortage ? ['Polpa: faltam 1 kg para produzir.'] : [],
  }
}

function fakeProduction() {
  return ProductionFaker.fake({
    id: 'production-1',
    establishmentId: 'establishment-1',
    productId: PRODUCT_ID,
    productName: RECIPE_PRODUCT.name,
    unit: 'kg',
    recipeId: 'recipe-1',
    recipeYield: 1000,
    quantity: 1000,
    totalCost: 9,
    performedBy: 'manager-1',
    performedByName: 'Maria Silva',
  })
}

async function mockRecipeCatalog(mrpFixture: MrpFixture) {
  await mrpFixture.mockProducts({
    getResponse: (request) =>
      request.pathname === `/products/${PRODUCT_ID}/stock`
        ? { body: fakeRecipeStockResponse() }
        : { body: RECIPE_CATALOG_RESPONSE },
  })
}

function fakeRecipeStockResponse() {
  return {
    product: RECIPE_PRODUCT,
    stockQuantity: 0,
    idealStock: 10,
    stockSituation: 'normal',
    brands: [],
  }
}

async function mockRecipeIngredientSources(mrpFixture: MrpFixture) {
  await mrpFixture.mockIngredientSources({
    respond: ({ url }) => {
      const pathSegments = url.pathname.split('/')
      const productId = pathSegments[pathSegments.indexOf('products') + 1]
      if (productId === PRODUCT_ID) {
        return {
          body: {
            product: RECIPE_PRODUCT,
            stockQuantity: 0,
            idealStock: 10,
            stockSituation: 'normal',
            brands: [],
          },
        }
      }
      if (productId === INGREDIENT_PRODUCT.id) {
        return {
          body: {
            product: INGREDIENT_PRODUCT,
            stockQuantity: 8,
            idealStock: 5,
            stockSituation: 'normal',
            brands: [],
          },
        }
      }
      if (productId === RECIPE_INGREDIENT_PRODUCT.id) {
        return {
          body: {
            product: RECIPE_INGREDIENT_PRODUCT,
            stockQuantity: 16,
            idealStock: 5,
            stockSituation: 'normal',
            brands: [RECIPE_INGREDIENT_PRIMARY_BRAND, RECIPE_INGREDIENT_ALTERNATE_BRAND],
          },
        }
      }
      if (productId === NO_COST_INGREDIENT_PRODUCT.id) {
        return {
          body: {
            product: NO_COST_INGREDIENT_PRODUCT,
            stockQuantity: 4,
            idealStock: 5,
            stockSituation: 'low',
            brands: [],
          },
        }
      }
      return {
        body: {
          product: NO_PRIMARY_BRAND_INGREDIENT_PRODUCT,
          stockQuantity: 6,
          idealStock: 5,
          stockSituation: 'normal',
          brands: [],
        },
      }
    },
  })
}

async function navigateToRecipe(page: Page) {
  await page.goto(`/products/${PRODUCT_ID}/recipe`)
  await expect(page).toHaveURL(new RegExp(`/products/${PRODUCT_ID}/recipe$`))
  await expect(page.getByRole('heading', { name: 'Receita', exact: true })).toBeVisible()
  await expect(page.getByRole('tab', { name: /Estoque/ })).toHaveAttribute(
    'href',
    `/products/${PRODUCT_ID}/stock`,
  )
  await expect(page.getByRole('tab', { name: /Receita/ })).toHaveAttribute(
    'href',
    `/products/${PRODUCT_ID}/recipe`,
  )
}

function observeClient(page: Page) {
  const consoleErrors: string[] = []
  const failedRequests: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`)
  })
  return { consoleErrors, failedRequests }
}

async function captureCleanRecipeState(
  page: Page,
  client: ReturnType<typeof observeClient>,
  name: string,
  fullPage = false,
  expectedConsoleErrors: readonly RegExp[] = [],
) {
  const unexpectedConsoleErrors = client.consoleErrors.filter(
    (error) => !expectedConsoleErrors.some((expected) => expected.test(error)),
  )
  expect(unexpectedConsoleErrors).toEqual([])
  expect(client.failedRequests).toEqual([])
  await page.screenshot({ path: path.join(SCREENSHOT_DIRECTORY, name), fullPage })
  client.consoleErrors.length = 0
  client.failedRequests.length = 0
}
