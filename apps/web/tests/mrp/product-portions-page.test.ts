import type { Page } from '@playwright/test'

import type { IdentityModuleFixture } from '../fixtures/identity-module-fixture'
import type {
  MrpFixture,
  MrpMockResponse,
  MrpRequestRecord,
} from '../fixtures/mrp-module-fixture'
import { expect, test } from '../playwright'

// Browser integration with mocked transport: these tests prove the UI-to-REST contract
// (method, path, query, body), states and keyboard behavior of the Portions tab. They are
// not evidence of server authorization, eligibility or persistence.

type Fixtures = {
  identityFixture: IdentityModuleFixture
  mrpFixture: MrpFixture
  page: Page
}

type ServerRow = {
  id: string
  portionProductId: string
  portionProductName: string
  typeId: string
  typeName: string
  quantity: number
  isGlobal: boolean
  salePrice?: number | null
}

type ServerCandidate = {
  productId: string
  name: string
  status: 'active' | 'inactive'
}

type ServerOptions = {
  categories?: string[]
  candidates?: ServerCandidate[]
  globalQuantity?: number
  hasPortionProducts?: boolean
  isGlobal?: boolean
  listResponse?: (requestNumber: number) => MrpMockResponse | undefined
  profile?: 'manager' | 'operator'
  rows?: ServerRow[]
  salePrice?: number | null
  status?: 'active' | 'inactive'
  suggestedPrice?: number | null
}

const ACCOMPANIMENT_ID = 'granola-1'
const TYPE_ID = 'type-1'
const TYPE_NAME = 'Cobertura'
const PORTION_NAMES = [
  'Açaí 300 ml',
  'Açaí 500 ml',
  'Açaí 700 ml',
  'Barca de açaí',
  'Copo de sorvete',
  'Milkshake de morango',
  'Sorvete de chocolate',
  'Sorvete de morango',
  'Sundae de baunilha',
  'Taça de frutas',
  'Taça especial',
  'Vitamina de banana',
]

const TYPES_BODY = {
  items: [{ type: { id: TYPE_ID, name: TYPE_NAME }, usageCount: 2 }],
  page: 1,
  pageSize: 100,
  total: 1,
  totalPages: 1,
}

function accompanimentProduct(options: ServerOptions) {
  return {
    id: ACCOMPANIMENT_ID,
    establishmentId: 'establishment-1',
    name: 'Granola',
    unit: 'g',
    categories: options.categories ?? ['accompaniment'],
    stockControl: 'single',
    status: options.status ?? 'active',
    currentUnitCost: 0.009,
    createdAt: '2026-08-22T12:00:00.000Z',
    updatedAt: '2026-08-22T12:00:00.000Z',
  }
}

function buildRows(count: number, overrides: Partial<ServerRow> = {}): ServerRow[] {
  return Array.from({ length: count }, (_value, index) => ({
    id: `link-${index + 1}`,
    portionProductId: `portion-${index + 1}`,
    portionProductName:
      index < PORTION_NAMES.length
        ? PORTION_NAMES[index]
        : `Porção extra ${String(index + 1).padStart(2, '0')}`,
    typeId: TYPE_ID,
    typeName: TYPE_NAME,
    quantity: 50,
    isGlobal: false,
    ...overrides,
  }))
}

function buildCandidates(): ServerCandidate[] {
  return [
    { productId: 'candidate-1', name: 'Açaí 1 litro', status: 'active' },
    { productId: 'candidate-2', name: 'Barca grande', status: 'active' },
    { productId: 'candidate-3', name: 'Sorvete de pistache', status: 'active' },
    { productId: 'candidate-4', name: 'Sorvete de coco', status: 'inactive' },
  ]
}

function collapse(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

// Stateful mocked backend for the Portions tab: reads reflect earlier writes.
async function mockServer(
  { identityFixture, mrpFixture, page }: Fixtures,
  options: ServerOptions = {},
) {
  const state = {
    candidates: options.candidates ?? [],
    defaultPrice: options.salePrice === undefined ? 3 : options.salePrice,
    globalQuantity: options.globalQuantity ?? 50,
    hasPortionProducts: options.hasPortionProducts ?? true,
    isGlobal: options.isGlobal ?? false,
    rows: options.rows ?? [],
    salePrice: options.salePrice === undefined ? 3 : options.salePrice,
    status: options.status ?? 'active',
  }
  if (options.profile === 'operator') {
    await identityFixture.mockOperatorSession()
    await identityFixture.mockOperatorAccount()
  } else {
    await identityFixture.mockManagerSession()
    await identityFixture.mockManagerAccount()
  }
  // A link carries its own price; a global row shows the global's shared price.
  const getRowPrice = (row: ServerRow) =>
    row.isGlobal || row.salePrice === undefined ? state.salePrice : row.salePrice
  const toRow = (row: ServerRow) => ({
    id: row.id,
    accompanimentProductId: ACCOMPANIMENT_ID,
    accompanimentProductName: 'Granola',
    accompanimentTypeId: row.typeId,
    accompanimentTypeName: row.typeName,
    unit: 'g',
    quantityPerPortion: row.quantity,
    salePrice: getRowPrice(row),
    isGlobal: row.isGlobal,
    hasOtherPortionLinks: state.rows.length > 1,
    brandName: 'Estoque único',
    unitCost: 0.009,
    estimatedCost: 0.45,
    portionProductId: row.portionProductId,
    portionProductName: row.portionProductName,
  })
  const globalDetails = () => ({
    accompanimentProductId: ACCOMPANIMENT_ID,
    accompanimentProductName: 'Granola',
    isGlobal: state.isGlobal,
    unit: 'g',
    salePrice: state.salePrice,
    ...(state.isGlobal
      ? {
          globalAccompanimentId: 'global-1',
          accompanimentTypeId: TYPE_ID,
          accompanimentTypeName: TYPE_NAME,
          quantityPerPortion: state.globalQuantity,
          brandName: 'Estoque único',
          unitCost: 0.009,
          estimatedCost: 0.45,
        }
      : {}),
  })

  await mrpFixture.mockProductStock({
    respond: (request) => ({
      body: request.url.pathname.endsWith('/stock')
        ? {
            product: { ...accompanimentProduct(options), status: state.status },
            stockQuantity: 5,
            stockSituation: 'normal',
            brands: [],
          }
        : {},
    }),
  })
  const portionRequests = await mrpFixture.mockAccompanimentPortions({
    respond: (request, requestNumber) => {
      if (request.method === 'POST') {
        const body = request.body as {
          accompanimentPrice?: number
          accompanimentTypeId: string
          isGlobal?: boolean
          portionProductIds?: string[]
          quantityPerPortion: number
        }
        if (body.isGlobal && !body.portionProductIds?.length) {
          state.isGlobal = true
          state.globalQuantity = body.quantityPerPortion
          if (body.accompanimentPrice !== undefined)
            state.salePrice = body.accompanimentPrice
          state.rows = state.rows.map((row) => ({
            ...row,
            isGlobal: true,
            quantity: body.quantityPerPortion,
            salePrice: undefined,
          }))
          return { status: 201, body: state.rows.map(toRow) }
        }
        const created = (body.portionProductIds ?? []).map((portionProductId, index) => ({
          id: `created-${portionProductId}-${index}`,
          portionProductId,
          portionProductName:
            state.candidates.find((candidate) => candidate.productId === portionProductId)
              ?.name ?? portionProductId,
          typeId: body.accompanimentTypeId,
          typeName: TYPE_NAME,
          quantity: body.quantityPerPortion,
          isGlobal: Boolean(body.isGlobal),
          salePrice: body.accompanimentPrice ?? state.defaultPrice,
        }))
        state.candidates = state.candidates.filter(
          (candidate) => !(body.portionProductIds ?? []).includes(candidate.productId),
        )
        state.rows = [...state.rows, ...created]
        return { status: 201, body: created.map(toRow) }
      }
      const override = options.listResponse?.(requestNumber)
      if (override) return override
      const params = request.url.searchParams
      const search = collapse(params.get('search') ?? '')
      const pageSize = Number(params.get('pageSize') ?? 10)
      const filtered = [...state.rows]
        .filter((row) => collapse(row.portionProductName).includes(search))
        .sort((first, second) =>
          first.portionProductName.localeCompare(second.portionProductName, 'pt-BR'),
        )
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
      const pageNumber = Math.min(Number(params.get('page') ?? 1), totalPages)
      return {
        body: {
          items: filtered
            .slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
            .map(toRow),
          page: pageNumber,
          pageSize,
          total: filtered.length,
          totalPages: filtered.length === 0 ? 0 : totalPages,
          hasPortionProducts: state.hasPortionProducts,
        },
      }
    },
  })
  const candidateRequests = await mrpFixture.mockAccompanimentPortionCandidates({
    respond: () => ({ body: state.candidates }),
  })
  const globalRequests = await mrpFixture.mockGlobalAccompaniment({
    respond: (request) => {
      if (request.method === 'PATCH') {
        const body = request.body as {
          accompanimentPrice?: number
          quantityPerPortion: number
        }
        state.globalQuantity = body.quantityPerPortion
        if (body.accompanimentPrice !== undefined)
          state.salePrice = body.accompanimentPrice
        state.rows = state.rows.map((row) => ({
          ...row,
          quantity: body.quantityPerPortion,
        }))
        return { body: globalDetails() }
      }
      if (request.method === 'DELETE') {
        const keep = request.url.searchParams.get('keepPortionLinks') === 'true'
        state.isGlobal = false
        state.rows = keep
          ? state.rows.map((row) => ({
              ...row,
              isGlobal: false,
              salePrice: state.salePrice,
            }))
          : []
        return { status: 204, body: null }
      }
      return { body: globalDetails() }
    },
  })
  const rowRequests = await mrpFixture.mockProductAccompaniments({
    respond: (request) => {
      const linkId = request.url.pathname.split('/').at(-1)
      const row = state.rows.find((candidate) => candidate.id === linkId)
      if (request.method === 'PATCH' && row) {
        const body = request.body as {
          accompanimentPrice?: number
          quantityPerPortion: number
        }
        row.quantity = body.quantityPerPortion
        if (body.accompanimentPrice !== undefined) row.salePrice = body.accompanimentPrice
        return { body: toRow(row) }
      }
      if (request.method === 'DELETE') {
        const scope = request.url.searchParams.get('scope')
        state.rows =
          scope === 'all' ? [] : state.rows.filter((candidate) => candidate.id !== linkId)
        if (scope === 'all') state.isGlobal = false
        return { status: 204, body: null }
      }
      return { status: 404, body: { message: 'Vínculo não encontrado.' } }
    },
  })
  await mrpFixture.mockAccompanimentTypes({ respond: () => ({ body: TYPES_BODY }) })
  await page.route('**/products/*/pricing', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      status: 200,
      body: JSON.stringify({
        product: accompanimentProduct(options),
        mode: 'accompaniment',
        sizes: [],
        resale: [],
        accompanimentPrice: state.defaultPrice,
        suggestedAccompanimentPrice:
          state.defaultPrice === null ? (options.suggestedPrice ?? 4) : null,
      }),
    })
  })

  return { candidateRequests, globalRequests, portionRequests, rowRequests, state }
}

const COUNT_QUERY_SUFFIX = 'pageSize=1'

function getQueries(requests: MrpRequestRecord[]) {
  return requests
    .filter((request) => request.method === 'GET')
    .map((request) => request.url.search)
}

function listQueries(requests: MrpRequestRecord[]) {
  return getQueries(requests).filter((query) => !query.endsWith(COUNT_QUERY_SUFFIX))
}

function countQueries(requests: MrpRequestRecord[]) {
  return getQueries(requests).filter((query) => query.endsWith(COUNT_QUERY_SUFFIX))
}

async function hasPageOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
}

test.describe('ProductPortionsPage', () => {
  test.describe('tab availability', () => {
    const scenarios = [
      { categories: ['accompaniment'], hasTab: true },
      { categories: ['accompaniment', 'resale'], hasTab: true },
      { categories: ['accompaniment', 'manufacturable'], hasTab: true },
      { categories: ['portion', 'accompaniment'], hasTab: false },
      { categories: ['portion'], hasTab: false },
      { categories: ['ingredient'], hasTab: false },
    ]

    for (const scenario of scenarios) {
      test(`${scenario.hasTab ? 'opens' : 'redirects to Stock from'} the Porções tab for ${scenario.categories.join(' + ')}`, async ({
        page,
        identityFixture,
        mrpFixture,
      }) => {
        await mockServer(
          { identityFixture, mrpFixture, page },
          { categories: scenario.categories, rows: buildRows(2) },
        )

        await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

        if (scenario.hasTab) {
          await expect(page).toHaveURL(`/products/${ACCOMPANIMENT_ID}/portions`)
          await expect(page.getByRole('tab', { name: 'Porções' })).toHaveAttribute(
            'aria-selected',
            'true',
          )
          await expect(page.getByRole('heading', { name: /^Porções/ })).toBeVisible()
        } else {
          await expect(page).toHaveURL(`/products/${ACCOMPANIMENT_ID}/stock`)
          await expect(page.getByRole('tab', { name: 'Porções' })).toHaveCount(0)
        }
      })
    }

    test('lets Managers open the tab from the product tab bar', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer({ identityFixture, mrpFixture, page }, { rows: buildRows(2) })

      await page.goto(`/products/${ACCOMPANIMENT_ID}/stock`)
      await page.getByRole('tab', { name: 'Porções' }).click()

      await expect(page).toHaveURL(`/products/${ACCOMPANIMENT_ID}/portions`)
      await expect(page.getByRole('heading', { name: /^Porções/ })).toBeVisible()
    })
  })

  test.describe('listing', () => {
    test('renders an individual Accompaniment with count, columns, price formats and pagination', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const rows = buildRows(23)
      rows[0].quantity = 0.5
      const { portionRequests, state } = await mockServer(
        { identityFixture, mrpFixture, page },
        { rows },
      )
      await page.setViewportSize({ width: 1560, height: 1178 })

      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      await expect(page.getByRole('heading', { name: 'Porções (23)' })).toBeVisible()
      await expect(
        page.getByText(
          'Porções que oferecem este acompanhamento no PDV. Cada vínculo tem o seu preço.',
        ),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'Tornar global' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Vincular porções' })).toBeVisible()
      const headers = page.getByRole('columnheader')
      await expect(headers).toHaveText([
        'PORÇÃO',
        'TIPO',
        'QTD POR PORÇÃO',
        'PREÇO',
        'AÇÕES',
      ])
      await expect(page.getByRole('row')).toHaveCount(11)
      const firstRow = page.getByRole('row').nth(1)
      await expect(firstRow).toContainText('Açaí 300 ml')
      await expect(firstRow).toContainText(TYPE_NAME)
      await expect(firstRow).toContainText('0,5 g')
      await expect(firstRow).toContainText('R$ 3,00')
      await expect(
        firstRow.getByRole('button', { name: 'Editar Açaí 300 ml' }),
      ).toBeVisible()
      await expect(
        firstRow.getByRole('button', { name: 'Remover Açaí 300 ml' }),
      ).toBeVisible()
      await expect(page.getByText('Mostrando 1-10 de 23 porções')).toBeVisible()
      expect(listQueries(portionRequests.requests)[0]).toBe('?page=1&pageSize=10')

      await page.getByRole('button', { name: 'Página 3' }).click()

      await expect(page.getByText('Mostrando 21-23 de 23 porções')).toBeVisible()
      expect(listQueries(portionRequests.requests).at(-1)).toBe('?page=3&pageSize=10')
      expect(state.rows).toHaveLength(23)
    })

    test('shows each link its own price in the table when the rows differ', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const rows = buildRows(4)
      rows[0].salePrice = 4.5
      rows[1].salePrice = 0
      rows[2].salePrice = null
      await mockServer({ identityFixture, mrpFixture, page }, { rows })

      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      await expect(page.getByRole('row').nth(1)).toContainText('R$ 4,50')
      await expect(page.getByRole('row').nth(2)).toContainText('Grátis')
      await expect(page.getByRole('row').nth(3)).toContainText('Não configurado')
      await expect(page.getByRole('row').nth(4)).toContainText('R$ 3,00')
    })

    test('shows Grátis on every row for a zero product price', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { rows: buildRows(2), salePrice: 0 },
      )

      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      await expect(page.getByRole('cell', { name: 'Grátis' })).toHaveCount(2)
    })

    test('shows Não configurado on every row when no product price is saved', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { rows: buildRows(2), salePrice: null },
      )

      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      await expect(page.getByRole('cell', { name: 'Não configurado' })).toHaveCount(2)
    })

    test('searches by Portion name after the debounce, resets to page 1 and clears with focus', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { portionRequests } = await mockServer(
        { identityFixture, mrpFixture, page },
        { rows: buildRows(23) },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Página 2' }).click()
      await expect(page.getByText('Mostrando 11-20 de 23 porções')).toBeVisible()

      await page.getByRole('textbox', { name: 'Buscar porção' }).fill('AÇA')

      await expect(page.getByRole('row')).toHaveCount(7)
      expect(listQueries(portionRequests.requests).at(-1)).toBe(
        '?search=A%C3%87A&page=1&pageSize=10',
      )
      await expect(page.getByRole('heading', { name: 'Porções (23)' })).toBeVisible()
      expect(countQueries(portionRequests.requests)).toEqual(['?page=1&pageSize=1'])

      await page.getByRole('textbox', { name: 'Buscar porção' }).fill('pistache')

      await expect(
        page.getByRole('heading', { name: 'Nenhuma porção encontrada' }),
      ).toBeVisible()
      await expect(
        page.getByText('Nenhuma porção corresponde a “pistache”.'),
      ).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Porções (23)' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Vincular porções' })).toBeVisible()

      await page.getByRole('button', { name: 'Limpar busca' }).click()

      await expect(page.getByRole('textbox', { name: 'Buscar porção' })).toBeFocused()
      await expect(page.getByRole('textbox', { name: 'Buscar porção' })).toHaveValue('')
      await expect(page.getByText('Mostrando 1-10 de 23 porções')).toBeVisible()
      expect(listQueries(portionRequests.requests).at(-1)).toBe('?page=1&pageSize=10')
    })

    test('does not send a request per keystroke while typing', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { portionRequests } = await mockServer(
        { identityFixture, mrpFixture, page },
        { rows: buildRows(23) },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await expect(page.getByRole('row')).toHaveCount(11)
      const before = listQueries(portionRequests.requests).length

      await page
        .getByRole('textbox', { name: 'Buscar porção' })
        .pressSequentially('sorv', {
          delay: 20,
        })
      await expect(page.getByRole('row')).toHaveCount(4)

      expect(listQueries(portionRequests.requests).length - before).toBe(1)
      expect(countQueries(portionRequests.requests).length).toBeLessThanOrEqual(1)
    })
  })

  test.describe('states', () => {
    test('shows the global Accompaniment with the tag, shared subtitle and per-kind actions', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { isGlobal: true, rows: buildRows(3, { isGlobal: true }) },
      )
      await page.setViewportSize({ width: 1560, height: 1178 })

      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      const chip = page.getByRole('button', { name: 'Acompanhamento global' })
      await expect(chip.getByText('Global', { exact: true })).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Porções', exact: true }),
      ).toBeVisible()
      await expect(
        page.getByText(
          'Este acompanhamento é global e aparece em todas as porções. Tipo, quantidade e preço são compartilhados.',
        ),
      ).toBeVisible()
      for (const name of ['Editar', 'Tornar individual', 'Remover de todas as porções']) {
        await expect(page.getByRole('button', { name, exact: true })).toBeVisible()
      }
      await expect(page.getByRole('button', { name: 'Vincular porções' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Tornar global' })).toHaveCount(0)
      const actionRows = await Promise.all(
        ['Editar', 'Tornar individual', 'Remover de todas as porções'].map(
          async (name) =>
            (await page.getByRole('button', { name, exact: true }).boundingBox())?.y,
        ),
      )
      expect(new Set(actionRows.map((y) => Math.round(y ?? -1))).size).toBe(1)
      const removeAll = page.getByRole('button', { name: 'Remover de todas as porções' })
      await expect(removeAll).toHaveCSS('border-top-color', 'rgb(220, 38, 38)')
      await expect(removeAll).toHaveCSS('color', 'rgb(220, 38, 38)')
      const removeButtons = page.getByRole('button', { name: /desta porção:/ })
      await expect(removeButtons).toHaveCount(3)
      await expect(removeButtons.first()).toHaveAccessibleName(
        'Remover Granola desta porção: Açaí 300 ml',
      )
      await expect(page.getByRole('button', { name: /^Editar Açaí/ })).toHaveCount(0)
      await expect(page.getByText('Mostrando')).toHaveCount(0)
    })

    test('shows the tag on the Stock and Settings tabs of a global Accompaniment', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { isGlobal: true, rows: buildRows(1, { isGlobal: true }) },
      )

      await page.goto(`/products/${ACCOMPANIMENT_ID}/stock`)

      await expect(
        page
          .getByRole('button', { name: 'Acompanhamento global' })
          .getByText('Global', { exact: true }),
      ).toBeVisible()
    })

    test('shows the empty state and opens Link from both calls to action when Portions exist', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates: buildCandidates(), rows: [] },
      )

      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      await expect(page.getByRole('heading', { name: 'Porções (0)' })).toBeVisible()
      await expect(
        page.getByText('Porções que oferecem este acompanhamento no PDV.', {
          exact: true,
        }),
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Nenhuma porção vinculada' }),
      ).toBeVisible()
      await expect(
        page.getByRole('status').filter({ hasText: 'Nenhuma porção vinculada' }),
      ).toHaveCSS('border-top-color', 'rgb(243, 244, 246)')
      await expect(
        page.getByText(
          'Vincule porções para que este acompanhamento apareça nelas no PDV. Você pode escolher várias de uma vez.',
        ),
      ).toBeVisible()
      await expect(page.getByRole('textbox', { name: 'Buscar porção' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Tornar global' })).toBeVisible()
      const links = page.getByRole('button', { name: 'Vincular porções' })
      await expect(links).toHaveCount(2)

      await links.last().click()
      await expect(page.getByRole('dialog', { name: 'Vincular porções' })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await links.first().click()
      await expect(page.getByRole('dialog', { name: 'Vincular porções' })).toBeVisible()
    })

    test('guides Managers to register a Portion when none exists and hides Link and Tornar global', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { hasPortionProducts: false, rows: [] },
      )

      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      await expect(
        page.getByRole('heading', { name: 'Nenhuma porção cadastrada' }),
      ).toBeVisible()
      await expect(
        page.getByText(
          'Cadastre um produto com a categoria Porção para vincular este acompanhamento.',
        ),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'Vincular porções' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Tornar global' })).toHaveCount(0)

      await page.getByRole('link', { name: 'Cadastrar produto' }).click()

      await expect(page).toHaveURL('/products/new')
    })

    test('shows Operators the ordinary empty copy without actions when no Portion exists', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { hasPortionProducts: false, profile: 'operator', rows: [] },
      )

      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      await expect(
        page.getByRole('heading', { name: 'Nenhuma porção vinculada' }),
      ).toBeVisible()
      await expect(
        page.getByText('Este acompanhamento ainda não aparece em nenhuma porção.'),
      ).toBeVisible()
      await expect(page.getByRole('link', { name: 'Cadastrar produto' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Vincular porções' })).toHaveCount(0)
    })

    test('keeps a global without rows manageable and hides Tornar individual', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { globalRequests } = await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates: buildCandidates(), isGlobal: true, rows: [] },
      )

      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      await expect(
        page.getByRole('heading', { name: 'Nenhuma porção com este acompanhamento' }),
      ).toBeVisible()
      await expect(
        page.getByText('Ele continua global: novas porções o receberão.'),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'Vincular porções' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Tornar individual' })).toHaveCount(0)
      await expect(
        page.getByRole('button', { name: 'Editar', exact: true }),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Remover de todas as porções' }),
      ).toBeVisible()
      await page.getByRole('button', { name: 'Editar', exact: true }).click()
      await expect(
        page.getByRole('dialog', { name: 'Editar Acompanhamento' }),
      ).toBeVisible()
      expect(globalRequests.requests.some((request) => request.method === 'GET')).toBe(
        true,
      )
    })

    test('shows Operators the list and the tag without actions, buttons or the Actions column', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { isGlobal: true, profile: 'operator', rows: buildRows(3, { isGlobal: true }) },
      )

      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      await expect(page.getByRole('row')).toHaveCount(4)
      await expect(page.getByRole('columnheader')).toHaveText([
        'PORÇÃO',
        'TIPO',
        'QTD POR PORÇÃO',
        'PREÇO',
      ])
      await expect(
        page.getByRole('button', { name: 'Acompanhamento global' }).getByText('Global'),
      ).toBeVisible()
      await expect(
        page.getByRole('button', { name: /Vincular|Editar|Remover|Tornar/ }),
      ).toHaveCount(0)
      const region = page.getByRole('region', { name: 'Tabela de porções' })
      await region.focus()
      await expect(region).toBeFocused()
    })

    test('disables Link, Tornar global and Editar for an inactive Accompaniment while Remover stays enabled', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { rows: buildRows(2), status: 'inactive' },
      )

      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      const notice = page.getByRole('status').filter({
        hasText: 'Ative o produto para vincular ou editar porções.',
      })
      await expect(notice).toBeVisible()
      const noticeId = await notice.getAttribute('id')
      for (const name of ['Vincular porções', 'Tornar global', 'Editar Açaí 300 ml']) {
        const button = page.getByRole('button', { name })
        await expect(button).toBeDisabled()
        await expect(button).toHaveAttribute('aria-describedby', noticeId ?? '')
      }
      await expect(
        page.getByRole('button', { name: 'Remover Açaí 300 ml' }),
      ).toBeEnabled()
    })

    test('shows the load error with a retry that recovers', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        {
          listResponse: (requestNumber) =>
            requestNumber === 1 ? { status: 500, body: { message: 'falha' } } : undefined,
          rows: buildRows(2),
        },
      )

      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      await expect(page.getByText('Não foi possível carregar as porções.')).toBeVisible()
      await expect(page.getByRole('row')).toHaveCount(0)
      await page.getByRole('button', { name: 'Tentar novamente' }).click()

      await expect(page.getByRole('heading', { name: 'Porções (2)' })).toBeVisible()
      await expect(page.getByRole('row')).toHaveCount(3)
    })
  })

  test.describe('Link Portions dialog', () => {
    test('lists only eligible Portions with status badges in a scroll area and keeps selections across searches', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const candidates = Array.from({ length: 8 }, (_value, index) => ({
        productId: `candidate-${index + 1}`,
        name: `Candidata ${index + 1}`,
        status: index === 5 ? ('inactive' as const) : ('active' as const),
      }))
      const { candidateRequests } = await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates, rows: buildRows(3) },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      await page.getByRole('button', { name: 'Vincular porções' }).click()

      const dialog = page.getByRole('dialog', { name: 'Vincular porções' })
      const picker = dialog.getByRole('group', { name: 'Porções' })
      await expect(picker).toBeVisible()
      expect(candidateRequests.requests.map((request) => request.method)).toEqual(['GET'])
      expect(candidateRequests.requests[0]?.url.pathname).toBe(
        `/products/${ACCOMPANIMENT_ID}/portions/candidates`,
      )
      await expect(picker.getByRole('checkbox')).toHaveCount(8)
      await expect(
        picker.getByRole('checkbox', { name: 'Candidata 6' }),
      ).toHaveAccessibleDescription('Inativo')
      await expect(
        picker.getByRole('checkbox', { name: 'Candidata 1' }),
      ).toHaveAccessibleDescription('Ativo')
      const scrollArea = picker.locator('ul').locator('xpath=..')
      const metrics = await scrollArea.evaluate((element) => ({
        client: element.clientHeight,
        scroll: element.scrollHeight,
        scrollbarWidth: getComputedStyle(element, '::-webkit-scrollbar').width,
        thumbColor: getComputedStyle(element, '::-webkit-scrollbar-thumb')
          .backgroundColor,
      }))
      expect(metrics.client).toBeLessThanOrEqual(246)
      expect(metrics.scrollbarWidth).toBe('4px')
      expect(metrics.thumbColor).toBe('rgb(229, 231, 235)')
      expect(metrics.scroll).toBeGreaterThan(metrics.client)
      await expect(
        dialog.getByRole('button', { name: 'Vincular porções' }),
      ).toBeDisabled()
      await expect(picker.getByText('0 selecionadas')).toBeVisible()

      await picker.getByRole('checkbox', { name: 'Candidata 1' }).click()
      await expect(picker.getByText('1 selecionada', { exact: true })).toBeVisible()
      await expect(
        dialog.getByRole('button', { name: 'Vincular 1 porção' }),
      ).toBeEnabled()
      await picker.getByRole('textbox', { name: 'Buscar porção' }).fill('candidata 7')
      await expect(picker.getByRole('checkbox')).toHaveCount(1)
      await picker.getByRole('checkbox', { name: 'Candidata 7' }).click()
      await picker.getByRole('textbox', { name: 'Buscar porção' }).fill('zzz')
      await expect(picker.getByText('Nenhuma porção encontrada.')).toBeVisible()
      await picker.getByRole('textbox', { name: 'Buscar porção' }).fill('')

      await expect(picker.getByText('2 selecionadas')).toBeVisible()
      await expect(picker.getByRole('checkbox', { name: 'Candidata 1' })).toBeChecked()
      await expect(picker.getByRole('checkbox', { name: 'Candidata 7' })).toBeChecked()
      await expect(
        dialog.getByRole('button', { name: 'Vincular 2 porções' }),
      ).toBeVisible()
    })

    test('selects and clears every filtered Portion with the toggle and announces the count politely', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates: buildCandidates(), rows: buildRows(2) },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Vincular porções' }).click()
      const dialog = page.getByRole('dialog', { name: 'Vincular porções' })
      const picker = dialog.getByRole('group', { name: 'Porções' })

      await picker.getByRole('textbox', { name: 'Buscar porção' }).fill('sorvete')
      await dialog.getByRole('button', { name: 'Selecionar todas' }).click()

      await expect(picker.getByText('2 selecionadas')).toBeVisible()
      await expect(picker.getByText('2 selecionadas')).toHaveAttribute(
        'aria-live',
        'polite',
      )
      await expect(dialog.getByRole('button', { name: 'Limpar seleção' })).toBeVisible()
      await picker.getByRole('textbox', { name: 'Buscar porção' }).fill('')
      await expect(
        picker.getByRole('checkbox', { name: 'Açaí 1 litro' }),
      ).not.toBeChecked()
      await dialog.getByRole('button', { name: 'Selecionar todas' }).click()
      await expect(picker.getByText('4 selecionadas')).toBeVisible()
      await dialog.getByRole('button', { name: 'Limpar seleção' }).click()
      await expect(picker.getByText('0 selecionadas')).toBeVisible()
      await expect(
        dialog.getByRole('button', { name: 'Vincular porções' }),
      ).toBeDisabled()
    })

    test('operates the checkboxes by label click, Space and Enter and returns focus on Esc', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates: buildCandidates(), rows: buildRows(2) },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      const trigger = page.getByRole('button', { name: 'Vincular porções' })
      await trigger.focus()
      await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog', { name: 'Vincular porções' })
      const picker = dialog.getByRole('group', { name: 'Porções' })

      await picker.getByText('Barca grande').click()
      await expect(picker.getByRole('checkbox', { name: 'Barca grande' })).toBeChecked()
      await picker.getByRole('checkbox', { name: 'Açaí 1 litro' }).focus()
      await page.keyboard.press('Space')
      await expect(picker.getByRole('checkbox', { name: 'Açaí 1 litro' })).toBeChecked()
      await page.keyboard.press('Enter')
      await expect(
        picker.getByRole('checkbox', { name: 'Açaí 1 litro' }),
      ).not.toBeChecked()
      await expect(dialog).toBeVisible()
      await picker.getByRole('textbox', { name: 'Buscar porção' }).focus()
      await page.keyboard.press('Enter')
      await expect(dialog).toBeVisible()
      await expect(picker.getByText('1 selecionada', { exact: true })).toBeVisible()

      await page.keyboard.press('Escape')

      await expect(dialog).toHaveCount(0)
      await expect(trigger).toBeFocused()
    })

    test('links several Portions with one shared type, quantity and price and refreshes the list', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { portionRequests, state } = await mockServer(
        { identityFixture, mrpFixture, page },
        {
          candidates: buildCandidates(),
          rows: buildRows(2),
          salePrice: null,
          suggestedPrice: 4,
        },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Vincular porções' }).click()
      const dialog = page.getByRole('dialog', { name: 'Vincular porções' })

      await expect(
        dialog.getByRole('textbox', { name: 'Preço do acompanhamento' }),
      ).toHaveValue('4,00')
      await expect(dialog.getByRole('switch')).toHaveCount(0)
      await expect(
        dialog.getByText('Este preço vale para as porções selecionadas.'),
      ).toBeVisible()
      await expect(dialog.getByLabel('Acompanhamento', { exact: true })).toHaveValue(
        'Granola',
      )
      await dialog.getByRole('checkbox', { name: 'Açaí 1 litro' }).click()
      await dialog.getByRole('checkbox', { name: 'Sorvete de coco' }).click()
      await dialog.getByRole('combobox', { name: 'Tipo' }).click()
      await page.getByRole('option', { name: TYPE_NAME }).click()
      await dialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('0,5')
      await expect(dialog.getByText('R$ 0,0045')).toHaveCount(0)
      await dialog.getByRole('button', { name: 'Vincular 2 porções' }).click()

      await expect(dialog).toHaveCount(0)
      const post = portionRequests.requests.find((request) => request.method === 'POST')
      expect(post?.url.pathname).toBe(`/products/${ACCOMPANIMENT_ID}/portions`)
      expect(post?.body).toEqual({
        portionProductIds: ['candidate-1', 'candidate-4'],
        accompanimentTypeId: TYPE_ID,
        quantityPerPortion: 0.5,
        accompanimentPrice: 4,
      })
      await expect(page.getByRole('heading', { name: 'Porções (4)' })).toBeVisible()
      await expect(page.getByRole('row', { name: /Açaí 1 litro/ })).toBeVisible()
      expect(state.candidates.map((candidate) => candidate.productId)).toEqual([
        'candidate-2',
        'candidate-3',
      ])
    })

    test('always sends the entered price, the prefilled default or a changed one, and never isGlobal', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { portionRequests } = await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates: buildCandidates(), rows: buildRows(2) },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Vincular porções' }).click()
      const dialog = page.getByRole('dialog', { name: 'Vincular porções' })
      await expect(
        dialog.getByRole('textbox', { name: 'Preço do acompanhamento' }),
      ).toHaveValue('3,00')
      await dialog.getByRole('checkbox', { name: 'Açaí 1 litro' }).click()
      await dialog.getByRole('combobox', { name: 'Tipo' }).click()
      await page.getByRole('option', { name: TYPE_NAME }).click()
      await dialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('10')
      await dialog.getByRole('button', { name: 'Vincular 1 porção' }).click()
      await expect(dialog).toHaveCount(0)

      const first = portionRequests.requests.find((request) => request.method === 'POST')
      expect(first?.body).toEqual({
        portionProductIds: ['candidate-1'],
        accompanimentTypeId: TYPE_ID,
        quantityPerPortion: 10,
        accompanimentPrice: 3,
      })

      await page.getByRole('button', { name: 'Vincular porções' }).click()
      await dialog.getByRole('checkbox', { name: 'Barca grande' }).click()
      await dialog.getByRole('combobox', { name: 'Tipo' }).click()
      await page.getByRole('option', { name: TYPE_NAME }).click()
      await dialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('12')
      await dialog.getByRole('textbox', { name: 'Preço do acompanhamento' }).fill('0')
      await dialog.getByRole('button', { name: 'Vincular 1 porção' }).click()
      await expect(dialog).toHaveCount(0)

      const second = portionRequests.requests.filter(
        (request) => request.method === 'POST',
      )[1]
      expect(second?.body).toEqual({
        portionProductIds: ['candidate-2'],
        accompanimentTypeId: TYPE_ID,
        quantityPerPortion: 12,
        accompanimentPrice: 0,
      })
    })

    test('shows validation for missing type, quantity and invalid price without sending a request', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { portionRequests } = await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates: buildCandidates(), rows: buildRows(2) },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Vincular porções' }).click()
      const dialog = page.getByRole('dialog', { name: 'Vincular porções' })
      await dialog.getByRole('checkbox', { name: 'Açaí 1 litro' }).click()
      await dialog.getByRole('textbox', { name: 'Preço do acompanhamento' }).fill('1,234')

      await dialog.getByRole('button', { name: 'Vincular 1 porção' }).click()

      await expect(dialog.getByText('Selecione um tipo.')).toBeVisible()
      await expect(
        dialog.getByText(
          'Informe uma quantidade maior que zero, com até três casas decimais.',
        ),
      ).toBeVisible()
      await expect(
        dialog.getByText(
          'Informe um preço maior ou igual a zero, com até duas casas decimais.',
        ),
      ).toBeVisible()
      expect(portionRequests.requests.some((request) => request.method === 'POST')).toBe(
        false,
      )
    })

    test('keeps the dialog open on a rejection, refetches candidates, drops ineligible selections and keeps values', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { candidateRequests, state } = await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates: buildCandidates(), rows: buildRows(2) },
      )
      await page.route('**/products/*/portions', async (route) => {
        if (route.request().method() !== 'POST') return route.fallback()
        state.candidates = state.candidates.filter(
          (candidate) => candidate.productId !== 'candidate-1',
        )
        await route.fulfill({
          contentType: 'application/json',
          status: 409,
          body: JSON.stringify({
            message:
              'Uma ou mais porções selecionadas não estão mais disponíveis para este acompanhamento.',
          }),
        })
      })
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Vincular porções' }).click()
      const dialog = page.getByRole('dialog', { name: 'Vincular porções' })
      await dialog.getByRole('checkbox', { name: 'Açaí 1 litro' }).click()
      await dialog.getByRole('checkbox', { name: 'Barca grande' }).click()
      await dialog.getByRole('combobox', { name: 'Tipo' }).click()
      await page.getByRole('option', { name: TYPE_NAME }).click()
      await dialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('25')
      await dialog.getByRole('textbox', { name: 'Preço do acompanhamento' }).fill('5')

      await dialog.getByRole('button', { name: 'Vincular 2 porções' }).click()

      await expect(dialog.getByRole('alert')).toContainText('não estão mais disponíveis')
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('checkbox', { name: 'Açaí 1 litro' })).toHaveCount(0)
      await expect(dialog.getByRole('checkbox', { name: 'Barca grande' })).toBeChecked()
      await expect(
        dialog.getByRole('button', { name: 'Vincular 1 porção' }),
      ).toBeEnabled()
      await expect(dialog.getByRole('combobox', { name: 'Tipo' })).toContainText(
        TYPE_NAME,
      )
      await expect(
        dialog.getByRole('textbox', { name: /Quantidade por porção/ }),
      ).toHaveValue('25')
      await expect(
        dialog.getByRole('textbox', { name: 'Preço do acompanhamento' }),
      ).toHaveValue('5')
      expect(
        candidateRequests.requests.filter((request) => request.method === 'GET').length,
      ).toBeGreaterThanOrEqual(2)
    })

    test('recovers from a conflict that made the Accompaniment global: closes, refetches and announces it on the tab', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { globalRequests, portionRequests, state } = await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates: buildCandidates(), rows: buildRows(2) },
      )
      let postBody: unknown
      await page.route('**/products/*/portions', async (route) => {
        if (route.request().method() !== 'POST') return route.fallback()
        postBody = route.request().postDataJSON()
        state.isGlobal = true
        state.rows = state.rows.map((row) => ({ ...row, isGlobal: true }))
        await route.fulfill({
          contentType: 'application/json',
          status: 409,
          body: JSON.stringify({
            message:
              'Este acompanhamento é global. Ative “Disponível para todas as porções” para vinculá-lo às porções.',
          }),
        })
      })
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Vincular porções' }).click()
      const dialog = page.getByRole('dialog', { name: 'Vincular porções' })
      await dialog.getByRole('checkbox', { name: 'Açaí 1 litro' }).click()
      await dialog.getByRole('checkbox', { name: 'Barca grande' }).click()
      await dialog.getByRole('combobox', { name: 'Tipo' }).click()
      await page.getByRole('option', { name: TYPE_NAME }).click()
      await dialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('25')
      const globalReadsBefore = globalRequests.requests.length
      const listReadsBefore = listQueries(portionRequests.requests).length

      await dialog.getByRole('button', { name: 'Vincular 2 porções' }).click()

      await expect(dialog).toHaveCount(0)
      await expect(
        page.getByRole('status').filter({ hasText: 'agora é global' }),
      ).toHaveText('Este acompanhamento agora é global. A lista foi atualizada.')
      await expect(page.getByText('Disponível para todas')).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Tornar individual' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Vincular porções' })).toHaveCount(0)
      await expect(
        page.getByRole('heading', { name: 'Porções', exact: true }),
      ).toBeVisible()
      expect(postBody).toEqual({
        portionProductIds: ['candidate-1', 'candidate-2'],
        accompanimentTypeId: TYPE_ID,
        quantityPerPortion: 25,
        accompanimentPrice: 3,
      })
      expect(globalRequests.requests.length).toBeGreaterThan(globalReadsBefore)
      expect(listQueries(portionRequests.requests).length).toBeGreaterThan(
        listReadsBefore,
      )
    })

    test('does not offer Link Portions on a global Accompaniment', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { portionRequests } = await mockServer(
        { identityFixture, mrpFixture, page },
        {
          candidates: buildCandidates().slice(0, 2),
          isGlobal: true,
          rows: buildRows(2, { isGlobal: true }),
        },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      await expect(
        page.getByRole('button', { name: 'Editar', exact: true }),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'Vincular porções' })).toHaveCount(0)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      expect(portionRequests.requests.some((request) => request.method === 'POST')).toBe(
        false,
      )
    })

    test('explains when every Portion already has the Accompaniment and keeps submit disabled', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates: [], rows: buildRows(2) },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Vincular porções' }).click()
      const dialog = page.getByRole('dialog', { name: 'Vincular porções' })

      await expect(
        dialog.getByText('Todas as porções já têm este acompanhamento.'),
      ).toBeVisible()
      await expect(dialog.getByRole('textbox', { name: 'Buscar porção' })).toBeDisabled()
      await expect(dialog.getByRole('button', { name: 'Selecionar todas' })).toHaveCount(
        0,
      )
      await expect(dialog.getByText('0 selecionadas')).toBeVisible()
      await expect(
        dialog.getByRole('button', { name: 'Vincular porções' }),
      ).toBeDisabled()
      await dialog.getByRole('button', { name: 'Cancelar' }).click()
      await expect(page.getByRole('button', { name: 'Tornar global' })).toBeEnabled()
    })

    test('shows the picker load error with a retry that recovers', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { state } = await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates: buildCandidates(), rows: buildRows(2) },
      )
      let failNext = true
      await page.route('**/products/*/portions/candidates', async (route) => {
        if (!failNext) return route.fallback()
        failNext = false
        await route.fulfill({
          contentType: 'application/json',
          status: 500,
          body: JSON.stringify({ message: 'falha' }),
        })
      })
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Vincular porções' }).click()
      const dialog = page.getByRole('dialog', { name: 'Vincular porções' })

      await expect(
        dialog.getByText('Não foi possível carregar as porções.'),
      ).toBeVisible()
      await dialog.getByRole('button', { name: 'Tentar novamente' }).first().click()

      await expect(dialog.getByRole('checkbox')).toHaveCount(state.candidates.length)
    })

    test('fits the narrow viewport without page overflow and stacks the footer', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates: buildCandidates(), rows: buildRows(12) },
      )
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Vincular porções' }).first().click()
      const dialog = page.getByRole('dialog', { name: 'Vincular porções' })

      await expect(dialog.getByRole('checkbox')).toHaveCount(4)
      expect(await hasPageOverflow(page)).toBe(false)
      const box = await dialog.boundingBox()
      expect(box?.width).toBeLessThanOrEqual(390)
      await dialog.getByRole('checkbox', { name: 'Açaí 1 litro' }).click()
      await expect(
        dialog.getByRole('button', { name: 'Vincular 1 porção' }),
      ).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeVisible()
    })
  })

  test.describe('page-level and row actions', () => {
    test('makes an individual Accompaniment global through POST without Portion ids and shows the tag', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { portionRequests } = await mockServer(
        { identityFixture, mrpFixture, page },
        { rows: buildRows(3) },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Tornar global' }).click()

      const dialog = page.getByRole('dialog', { name: 'Tornar acompanhamento global' })
      await expect(
        dialog.getByText(
          'Granola passará a aparecer em todas as porções, incluindo as novas.',
        ),
      ).toBeVisible()
      await expect(dialog.getByText('Carregando acompanhamentos…')).toHaveCount(0)
      await expect(dialog.getByRole('alert')).toHaveCount(0)
      await expect(dialog.getByRole('switch')).toHaveCount(0)
      await expect(
        dialog.getByRole('status').filter({ hasText: 'Acompanhamento global:' }),
      ).toBeVisible()
      await expect(
        dialog.getByText(
          'Este acompanhamento já está vinculado individualmente a algumas porções. Ao salvar, esses vínculos serão substituídos pela configuração global (tipo, quantidade e preço).',
        ),
      ).toBeVisible()
      await expect(
        dialog.getByText('Este preço vale para todas as porções.'),
      ).toBeVisible()
      await expect(
        dialog.getByRole('textbox', { name: /Quantidade por porção/ }),
      ).toHaveValue('')
      await expect(dialog.getByRole('combobox', { name: 'Tipo' })).toContainText(
        'Selecione um tipo',
      )
      await dialog.getByRole('combobox', { name: 'Tipo' }).click()
      await page.getByRole('option', { name: TYPE_NAME }).click()
      await dialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('40')
      await dialog.getByRole('button', { name: 'Tornar global' }).click()

      await expect(dialog).toHaveCount(0)
      const post = portionRequests.requests.find((request) => request.method === 'POST')
      expect(post?.body).toEqual({
        accompanimentTypeId: TYPE_ID,
        quantityPerPortion: 40,
        isGlobal: true,
      })
      await expect(
        page.getByRole('button', { name: 'Acompanhamento global' }).getByText('Global'),
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'Tornar individual' })).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Porções', exact: true }),
      ).toBeVisible()
    })

    test('omits the replacement warning when making global without individual links', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates: buildCandidates(), rows: [] },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Tornar global' }).click()

      const dialog = page.getByRole('dialog', { name: 'Tornar acompanhamento global' })
      await expect(
        dialog.getByRole('status').filter({ hasText: 'Acompanhamento global:' }),
      ).toBeVisible()
      await expect(dialog.getByText(/vinculado individualmente/)).toHaveCount(0)
    })

    test('confirms Tornar individual with the keep query, pending state and the list staying individual', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { globalRequests } = await mockServer(
        { identityFixture, mrpFixture, page },
        { isGlobal: true, rows: buildRows(2, { isGlobal: true }) },
      )
      let releaseDelete = () => {}
      const gate = new Promise<void>((resolve) => {
        releaseDelete = resolve
      })
      await page.route('**/products/*/global-accompaniment**', async (route) => {
        if (route.request().method() !== 'DELETE') return route.fallback()
        await gate
        await route.fallback()
      })
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      const trigger = page.getByRole('button', { name: 'Tornar individual' })
      await trigger.click()

      const dialog = page.getByRole('alertdialog', { name: 'Tornar Granola individual?' })
      await expect(dialog.getByText('Granola deixará de ser global.')).toBeVisible()
      await expect(
        dialog.getByText(
          'As porções atuais continuam com o acompanhamento como vínculo individual; novas porções não o receberão. Os saldos de estoque não mudam.',
        ),
      ).toBeVisible()
      await dialog.getByRole('button', { name: 'Cancelar' }).click()
      await expect(dialog).toHaveCount(0)
      await expect(trigger).toBeFocused()
      expect(globalRequests.requests.some((request) => request.method === 'DELETE')).toBe(
        false,
      )

      await trigger.click()
      await dialog.getByRole('button', { name: 'Tornar individual' }).click()
      await expect(dialog.getByRole('button', { name: 'Convertendo…' })).toBeDisabled()
      releaseDelete()

      await expect(dialog).toHaveCount(0)
      const request = globalRequests.requests.find(
        (candidate) => candidate.method === 'DELETE',
      )
      expect(request?.url.pathname).toBe(
        `/products/${ACCOMPANIMENT_ID}/global-accompaniment`,
      )
      expect(request?.url.search).toBe('?keepPortionLinks=true')
      await expect(page.getByRole('heading', { name: 'Porções (2)' })).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Acompanhamento global' }),
      ).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Editar Açaí 300 ml' })).toBeVisible()
    })

    test('keeps the confirmation open with an inline alert when Tornar individual fails', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { isGlobal: true, rows: buildRows(2, { isGlobal: true }) },
      )
      await page.route('**/products/*/global-accompaniment**', async (route) => {
        if (route.request().method() !== 'DELETE') return route.fallback()
        await route.fulfill({
          contentType: 'application/json',
          status: 404,
          body: JSON.stringify({ message: 'Acompanhamento global não encontrado.' }),
        })
      })
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Tornar individual' }).click()
      const dialog = page.getByRole('alertdialog', { name: 'Tornar Granola individual?' })

      await dialog.getByRole('button', { name: 'Tornar individual' }).click()

      await expect(dialog.getByRole('alert')).toHaveText(
        'Acompanhamento global não encontrado.',
      )
      await expect(
        dialog.getByRole('button', { name: 'Tornar individual' }),
      ).toBeEnabled()
    })

    test('edits the shared values of a global through PATCH and removes it from all Portions with a locked scope', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { globalRequests } = await mockServer(
        { identityFixture, mrpFixture, page },
        { isGlobal: true, rows: buildRows(3, { isGlobal: true }) },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page.getByRole('button', { name: 'Editar', exact: true }).click()
      const editDialog = page.getByRole('dialog', { name: 'Editar Acompanhamento' })

      await expect(
        editDialog.getByText('Atualize como Granola aparece em todas as porções no PDV.'),
      ).toBeVisible()
      await expect(editDialog.getByRole('status')).toHaveText(
        'Acompanhamento global: as alterações valem para todas as porções.',
      )
      await expect(editDialog.getByRole('switch')).toHaveCount(0)
      await expect(
        editDialog.getByText('Este preço vale para todas as porções.'),
      ).toBeVisible()
      const globalPrice = editDialog.getByRole('textbox', {
        name: 'Preço do acompanhamento',
      })
      await expect(globalPrice).toHaveValue('3,00')
      await editDialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('70')
      await globalPrice.fill('6,00')
      await editDialog.getByRole('button', { name: 'Salvar alterações' }).click()

      await expect(editDialog).toHaveCount(0)
      const patch = globalRequests.requests.find((request) => request.method === 'PATCH')
      expect(patch?.url.pathname).toBe(
        `/products/${ACCOMPANIMENT_ID}/global-accompaniment`,
      )
      expect(patch?.body).toEqual({
        accompanimentPrice: 6,
        accompanimentTypeId: TYPE_ID,
        quantityPerPortion: 70,
      })
      await expect(page.getByRole('row', { name: /Açaí 300 ml/ })).toContainText('70 g')
      await expect(page.getByRole('row', { name: /Açaí 300 ml/ })).toContainText(
        'R$ 6,00',
      )
      await expect(page.getByRole('row', { name: /Açaí 700 ml/ })).toContainText(
        'R$ 6,00',
      )

      await page.getByRole('button', { name: 'Remover de todas as porções' }).click()
      const removeDialog = page.getByRole('alertdialog', { name: 'Remover Granola?' })
      await expect(
        removeDialog.getByText(
          'Granola é um acompanhamento global e será removido de todas as porções.',
        ),
      ).toBeVisible()
      const scopeSwitch = removeDialog.getByRole('switch', {
        name: 'Remover de todas as porções',
      })
      await expect(scopeSwitch).toHaveAttribute('aria-checked', 'true')
      await expect(scopeSwitch).toHaveAttribute('aria-disabled', 'true')
      await scopeSwitch.focus()
      await page.keyboard.press('Space')
      await expect(scopeSwitch).toHaveAttribute('aria-checked', 'true')
      await expect(removeDialog.getByRole('status')).toHaveText(
        'Será removido de todas as porções. Novas porções não o receberão. Os saldos de estoque não mudam.',
      )
      await removeDialog.getByRole('button', { name: 'Remover de todas' }).click()

      await expect(removeDialog).toHaveCount(0)
      const removal = globalRequests.requests.find(
        (request) => request.method === 'DELETE',
      )
      expect(removal?.url.pathname).toBe(
        `/products/${ACCOMPANIMENT_ID}/global-accompaniment`,
      )
      expect(removal?.url.search).toBe('')
      await expect(page.getByRole('heading', { name: 'Porções (0)' })).toBeVisible()
    })

    test('edits and removes an individual row through the existing Portion routes with the row Portion id', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const rows = buildRows(3)
      rows[1].salePrice = 5
      const { rowRequests } = await mockServer(
        { identityFixture, mrpFixture, page },
        { rows },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      const editTrigger = page.getByRole('button', { name: 'Editar Açaí 500 ml' })
      await editTrigger.click()

      const editDialog = page.getByRole('dialog', { name: 'Editar Acompanhamento' })
      await expect(
        editDialog.getByText('Atualize como Granola aparece em Açaí 500 ml no PDV.'),
      ).toBeVisible()
      await expect(editDialog.getByRole('switch')).toHaveCount(0)
      await expect(editDialog.getByRole('status')).toHaveCount(0)
      await expect(
        editDialog.getByText('Este preço vale só para este vínculo.'),
      ).toBeVisible()
      const rowPrice = editDialog.getByRole('textbox', {
        name: 'Preço do acompanhamento',
      })
      await expect(rowPrice).toHaveValue('5,00')
      await editDialog.getByRole('textbox', { name: /Quantidade por porção/ }).fill('80')
      await rowPrice.fill('8,00')
      await editDialog.getByRole('button', { name: 'Salvar alterações' }).click()

      await expect(editDialog).toHaveCount(0)
      await expect(editTrigger).toBeFocused()
      const patch = rowRequests.requests.find((request) => request.method === 'PATCH')
      expect(patch?.url.pathname).toBe('/products/portion-2/accompaniments/link-2')
      expect(patch?.body).toEqual({
        accompanimentPrice: 8,
        accompanimentTypeId: TYPE_ID,
        quantityPerPortion: 80,
      })
      await expect(page.getByRole('row', { name: /Açaí 500 ml/ })).toContainText('80 g')
      await expect(page.getByRole('row', { name: /Açaí 500 ml/ })).toContainText(
        'R$ 8,00',
      )
      await expect(page.getByRole('row', { name: /Açaí 300 ml/ })).toContainText(
        'R$ 3,00',
      )
      await expect(page.getByRole('row', { name: /Açaí 700 ml/ })).toContainText(
        'R$ 3,00',
      )

      await page.getByRole('button', { name: 'Remover Açaí 300 ml' }).click()
      const removeDialog = page.getByRole('alertdialog', {
        name: 'Remover acompanhamento?',
      })
      await expect(
        removeDialog.getByText(
          'O vínculo de Granola com Açaí 300 ml será removido. O estoque e o histórico permanecem intactos.',
        ),
      ).toBeVisible()
      await removeDialog.getByRole('button', { name: 'Remover' }).click()

      await expect(removeDialog).toHaveCount(0)
      const removal = rowRequests.requests.find((request) => request.method === 'DELETE')
      expect(removal?.url.pathname).toBe('/products/portion-1/accompaniments/link-1')
      expect(removal?.url.search).toBe('')
      await expect(page.getByRole('heading', { name: 'Porções (2)' })).toBeVisible()
      await expect(page.getByRole('row', { name: /Açaí 300 ml/ })).toHaveCount(0)
    })

    test('removes a global row from this Portion only or from every Portion with the scope query', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      const { rowRequests } = await mockServer(
        { identityFixture, mrpFixture, page },
        { isGlobal: true, rows: buildRows(3, { isGlobal: true }) },
      )
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      await page
        .getByRole('button', { name: 'Remover Granola desta porção: Açaí 300 ml' })
        .click()
      const dialog = page.getByRole('alertdialog', { name: 'Remover Granola?' })

      await expect(
        dialog.getByText('Desligado: remove apenas de Açaí 300 ml.'),
      ).toBeVisible()
      await dialog.getByRole('button', { name: 'Remover desta porção' }).click()

      await expect(dialog).toHaveCount(0)
      const first = rowRequests.requests.find((request) => request.method === 'DELETE')
      expect(first?.url.pathname).toBe('/products/portion-1/accompaniments/link-1')
      expect(first?.url.search).toBe('?scope=portion')
      await expect(page.getByRole('row', { name: /Açaí 300 ml/ })).toHaveCount(0)

      await page
        .getByRole('button', { name: 'Remover Granola desta porção: Açaí 500 ml' })
        .click()
      await dialog.getByRole('switch', { name: 'Remover de todas as porções' }).click()
      await dialog.getByRole('button', { name: 'Remover de todas' }).click()

      await expect(dialog).toHaveCount(0)
      const second = rowRequests.requests.filter(
        (request) => request.method === 'DELETE',
      )[1]
      expect(second?.url.search).toBe('?scope=all')
    })
  })

  test.describe('responsive layout', () => {
    for (const viewport of [
      { height: 1178, width: 1560 },
      { height: 844, width: 390 },
    ]) {
      test(`has no horizontal page overflow at ${viewport.width}x${viewport.height}`, async ({
        page,
        identityFixture,
        mrpFixture,
      }) => {
        await mockServer(
          { identityFixture, mrpFixture, page },
          { rows: buildRows(23), status: 'inactive' },
        )
        await page.setViewportSize(viewport)

        await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
        await expect(page.getByRole('heading', { name: 'Porções (23)' })).toBeVisible()

        expect(await hasPageOverflow(page)).toBe(false)
        await expect(page.getByRole('tab', { name: 'Porções' })).toBeVisible()
        if (viewport.width < 600) {
          const table = page.getByLabel('Tabela de porções')
          const metrics = await table.evaluate((element) => ({
            client: element.clientWidth,
            scroll: element.scrollWidth,
          }))
          expect(metrics.scroll).toBeGreaterThan(metrics.client)
          const actions = page.getByRole('button', { name: 'Tornar global' })
          const actionBox = await actions.boundingBox()
          expect(actionBox?.width).toBeGreaterThan(250)
        }
      })
    }

    test('keeps the global actions and empty states within the narrow viewport', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer(
        { identityFixture, mrpFixture, page },
        { candidates: buildCandidates(), isGlobal: true, rows: [] },
      )
      await page.setViewportSize({ width: 390, height: 844 })

      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)

      await expect(
        page.getByRole('heading', { name: 'Nenhuma porção com este acompanhamento' }),
      ).toBeVisible()
      expect(await hasPageOverflow(page)).toBe(false)
    })
  })

  test.describe('keyboard', () => {
    test('reaches the page actions, search and row actions in order and closes a dialog with Esc returning focus', async ({
      page,
      identityFixture,
      mrpFixture,
    }) => {
      await mockServer({ identityFixture, mrpFixture, page }, { rows: buildRows(3) })
      await page.goto(`/products/${ACCOMPANIMENT_ID}/portions`)
      const makeGlobal = page.getByRole('button', { name: 'Tornar global' })
      await makeGlobal.focus()

      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: 'Vincular porções' })).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(page.getByRole('textbox', { name: 'Buscar porção' })).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: 'Editar Açaí 300 ml' })).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Shift+Tab')
      await expect(makeGlobal).toBeFocused()

      await page.keyboard.press('Enter')
      await expect(
        page.getByRole('dialog', { name: 'Tornar acompanhamento global' }),
      ).toBeVisible()
      await page.keyboard.press('Escape')

      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(makeGlobal).toBeFocused()
    })
  })
})
