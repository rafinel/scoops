import type { ReactNode } from 'react'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductFaker } from '@scoops/core/mrp/domain/entities/fakers'
import type {
  AccompanimentPortionDetails,
  AccompanimentPortionsPage,
  GlobalAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'

import { ROUTES } from '@/constants/routes'
import type { ProductAccompanimentDialogProps } from '@/ui/mrp/widgets/components/product-accompaniment-dialog'
import type { RemoveGlobalAccompanimentDialogProps } from '@/ui/mrp/widgets/components/remove-global-accompaniment-dialog'
import type { RemoveProductAccompanimentDialogProps } from '@/ui/mrp/widgets/components/remove-product-accompaniment-dialog'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { ProductPortionsSlot } from '../index'
import { useMakeIndividualDialog } from '../make-individual-dialog/use-make-individual-dialog'
import { useProductPortionsSlot } from '../use-product-portions-slot'

vi.mock('@/ui/mrp/widgets/pages/product-details-page', () => ({
  ProductDetailsPage: ({
    children,
    onBack,
    selectedTab,
  }: {
    children: ReactNode
    onBack: () => void
    selectedTab: string
  }) => (
    <section aria-label={`Aba ${selectedTab}`}>
      <button onClick={onBack} type='button'>
        Voltar
      </button>
      {children}
    </section>
  ),
}))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))
// Different owner boundaries: the moved dialogs keep their own tests.
vi.mock('@/ui/mrp/widgets/components/product-accompaniment-dialog', () => ({
  ProductAccompanimentDialog: ({
    hasIndividualLinks,
    mode,
    productId,
  }: ProductAccompanimentDialogProps) => (
    <div role='dialog' aria-label='Edição'>
      {`mode=${mode} product=${productId} individual=${hasIndividualLinks}`}
    </div>
  ),
}))
vi.mock('@/ui/mrp/widgets/components/remove-global-accompaniment-dialog', () => ({
  RemoveGlobalAccompanimentDialog: ({
    isScopeLocked,
    productId,
  }: RemoveGlobalAccompanimentDialogProps) => (
    <div role='alertdialog' aria-label='Remoção global'>
      {`product=${productId} locked=${isScopeLocked}`}
    </div>
  ),
}))
vi.mock('@/ui/mrp/widgets/components/remove-product-accompaniment-dialog', () => ({
  RemoveProductAccompanimentDialog: ({
    item,
    portionName,
  }: RemoveProductAccompanimentDialogProps) => (
    <div role='alertdialog' aria-label='Remoção individual'>
      {`${item.id} ${portionName}`}
    </div>
  ),
}))
vi.mock('../make-individual-dialog/use-make-individual-dialog', () => ({
  useMakeIndividualDialog: vi.fn(),
}))
vi.mock('../use-product-portions-slot', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../use-product-portions-slot')>()),
  useProductPortionsSlot: vi.fn(),
}))

const useProductPortionsSlotMock = vi.mocked(useProductPortionsSlot)
const useMakeIndividualDialogMock = vi.mocked(useMakeIndividualDialog)
const handlers = {
  handleActionOpenChange: vi.fn(),
  handleActionSuccess: vi.fn(),
  handleBack: vi.fn(),
  handleBecameGlobal: vi.fn(),
  handleEditGlobalAction: vi.fn(),
  handleEditRowAction: vi.fn(),
  handleLinkAction: vi.fn(),
  handleMakeGlobalAction: vi.fn(),
  handleMakeIndividualAction: vi.fn(),
  handlePageChange: vi.fn(),
  handleRemoveGlobalAction: vi.fn(),
  handleRemoveRowAction: vi.fn(),
  handleRetry: vi.fn(),
  handleSearchChange: vi.fn(),
}

const product = ProductFaker.fake({
  categories: ['accompaniment'],
  id: 'accompaniment-1',
  name: 'Granola',
})
const individual: GlobalAccompanimentDetails = {
  accompanimentProductId: 'accompaniment-1',
  accompanimentProductName: 'Granola',
  isGlobal: false,
  unit: 'g',
  salePrice: 3,
}
const row: AccompanimentPortionDetails = {
  id: 'link-1',
  accompanimentProductId: 'accompaniment-1',
  accompanimentProductName: 'Granola',
  accompanimentTypeId: 'type-1',
  accompanimentTypeName: 'Cobertura',
  unit: 'g',
  quantityPerPortion: 50,
  salePrice: 3,
  isGlobal: false,
  hasOtherPortionLinks: false,
  portionProductId: 'portion-1',
  portionProductName: 'Açaí 300 ml',
}

function createPage(overrides: Partial<AccompanimentPortionsPage> = {}) {
  return {
    items: [row],
    page: 1,
    pageSize: 10,
    total: 4,
    totalPages: 1,
    hasPortionProducts: true,
    ...overrides,
  } as AccompanimentPortionsPage
}

function createState(
  overrides: Partial<ReturnType<typeof useProductPortionsSlot>> = {},
): ReturnType<typeof useProductPortionsSlot> {
  return {
    canManage: true,
    globalAccompaniment: individual,
    hasBecomeGlobalNotice: false,
    isActive: true,
    isError: false,
    isLoading: false,
    isPageLoading: false,
    isRefreshing: false,
    isSearching: false,
    isUnsupported: false,
    linkedCount: 4,
    portionsPage: createPage(),
    product,
    searchInput: '',
    selectedAction: undefined,
    ...handlers,
    ...overrides,
  }
}

function renderSlot(overrides: Partial<ReturnType<typeof useProductPortionsSlot>> = {}) {
  useProductPortionsSlotMock.mockReturnValue(createState(overrides))
  return render(<ProductPortionsSlot productId='accompaniment-1' />)
}

describe('ProductPortionsSlot', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    useMakeIndividualDialogMock.mockReturnValue({
      actionError: null,
      isPending: false,
      handleConfirm: vi.fn(),
    })
  })

  it('renders the individual list inside the Portions tab with count, actions and rows', () => {
    renderSlot()

    expect(screen.getByRole('region', { name: 'Aba portions' })).toBeTruthy()
    expect(useProductPortionsSlotMock).toHaveBeenCalledWith('accompaniment-1')
    expect(screen.getByRole('heading', { name: 'Porções (4)' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tornar global' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Vincular porções' })).toBeTruthy()
    expect(screen.getByRole('row', { name: /Açaí 300 ml/ })).toBeTruthy()
  })

  it('announces the became-global recovery politely above the refreshed global view and hides it otherwise', () => {
    const { unmount } = renderSlot({
      globalAccompaniment: { ...individual, isGlobal: true },
      hasBecomeGlobalNotice: true,
      portionsPage: createPage({ items: [{ ...row, isGlobal: true }] }),
    })

    const notice = screen.getByRole('status')
    expect(notice.textContent).toBe(
      'Este acompanhamento agora é global. A lista foi atualizada.',
    )
    expect(
      notice.compareDocumentPosition(screen.getByRole('heading', { name: 'Porções' })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Vincular porções' })).toBeNull()
    unmount()

    renderSlot()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('wires the page actions and return navigation to the slot handlers', () => {
    renderSlot()

    fireEvent.click(screen.getByRole('button', { name: 'Vincular porções' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tornar global' }))
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(handlers.handleLinkAction).toHaveBeenCalledTimes(1)
    expect(handlers.handleMakeGlobalAction).toHaveBeenCalledTimes(1)
    expect(handlers.handleBack).toHaveBeenCalledTimes(1)
  })

  it('wires the row actions with the row and the search and page handlers', () => {
    renderSlot({ portionsPage: createPage({ total: 25, totalPages: 3 }) })

    fireEvent.click(screen.getByRole('button', { name: 'Editar Açaí 300 ml' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover Açaí 300 ml' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar porção' }), {
      target: { value: 'aç' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Página 2' }))

    expect(handlers.handleEditRowAction).toHaveBeenCalledWith(row)
    expect(handlers.handleRemoveRowAction).toHaveBeenCalledWith(row)
    expect(handlers.handleSearchChange).toHaveBeenCalledWith('aç')
    expect(handlers.handlePageChange).toHaveBeenCalledWith(2)
  })

  it('shows the global page actions without a count and wires each one', () => {
    renderSlot({
      globalAccompaniment: { ...individual, isGlobal: true },
      portionsPage: createPage({ items: [{ ...row, isGlobal: true }] }),
    })

    expect(screen.getByRole('heading', { name: 'Porções' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tornar individual' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover de todas as porções' }))

    expect(handlers.handleEditGlobalAction).toHaveBeenCalledTimes(1)
    expect(handlers.handleMakeIndividualAction).toHaveBeenCalledTimes(1)
    expect(handlers.handleRemoveGlobalAction).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Tornar global' })).toBeNull()
  })

  it('hides Tornar individual for a global without rows and shows its empty state', () => {
    renderSlot({
      globalAccompaniment: { ...individual, isGlobal: true },
      linkedCount: 0,
      portionsPage: createPage({ items: [], total: 0 }),
    })

    expect(screen.queryByRole('button', { name: 'Tornar individual' })).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Nenhuma porção com este acompanhamento' }),
    ).toBeTruthy()
  })

  it('shows the no-link empty state and opens Link from its call to action', () => {
    renderSlot({ linkedCount: 0, portionsPage: createPage({ items: [], total: 0 }) })

    expect(screen.getByRole('heading', { name: 'Nenhuma porção vinculada' })).toBeTruthy()
    const buttons = screen.getAllByRole('button', { name: 'Vincular porções' })
    fireEvent.click(buttons[buttons.length - 1])

    expect(handlers.handleLinkAction).toHaveBeenCalledTimes(1)
  })

  it('guides Managers to register a Portion when none exists', () => {
    renderSlot({
      linkedCount: 0,
      portionsPage: createPage({ hasPortionProducts: false, items: [], total: 0 }),
    })

    expect(
      screen.getByRole('heading', { name: 'Nenhuma porção cadastrada' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Cadastrar produto' }).getAttribute('href'),
    ).toBe(ROUTES.newProduct)
    expect(screen.queryByRole('button', { name: 'Tornar global' })).toBeNull()
  })

  it('shows the search state and clears the search through the handler', () => {
    renderSlot({
      isSearching: true,
      portionsPage: createPage({ items: [], total: 0 }),
      searchInput: 'pistache',
    })

    expect(screen.getByText('Nenhuma porção corresponde a “pistache”.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Limpar busca' }))

    expect(handlers.handleSearchChange).toHaveBeenCalledWith('')
  })

  it('shows Operators the list without actions, columns or dialogs', () => {
    renderSlot({ canManage: false, selectedAction: { kind: 'make-global' } })

    expect(screen.getByRole('row', { name: /Açaí 300 ml/ })).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: /Vincular|Tornar|Editar|Remover/ }),
    ).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows the inactive notice and disables the controls it describes', () => {
    renderSlot({ isActive: false })

    expect(screen.getByRole('status').textContent).toContain(
      'Ative o produto para vincular ou editar porções.',
    )
    expect(
      screen.getByRole('button', { name: 'Vincular porções' }).hasAttribute('disabled'),
    ).toBe(true)
    expect(
      screen
        .getByRole('button', { name: 'Remover Açaí 300 ml' })
        .hasAttribute('disabled'),
    ).toBe(false)
  })

  it('shows the loading skeleton and no content while loading', () => {
    renderSlot({
      globalAccompaniment: undefined,
      isLoading: true,
      portionsPage: undefined,
    })

    expect(screen.getByRole('status', { name: 'Carregando porções' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /^Porções/ })).toBeNull()
  })

  it('shows the error with a retry that delegates', () => {
    renderSlot({ isError: true, portionsPage: undefined })

    expect(screen.getByRole('alert').textContent).toContain(
      'Não foi possível carregar as porções.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(handlers.handleRetry).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('heading', { name: /^Porções/ })).toBeNull()
  })

  it('announces a background refresh without replacing the content', () => {
    renderSlot({ isRefreshing: true })

    expect(screen.getByRole('status', { name: 'Atualizando…' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Porções (4)' })).toBeTruthy()
  })

  it('renders only the page chrome for an unsupported product while it redirects', () => {
    renderSlot({ isError: true, isUnsupported: true })

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('heading', { name: /^Porções/ })).toBeNull()
  })

  it('passes the individual-links flag to the make-global dialog only for an individual Accompaniment with rows', () => {
    const { unmount } = renderSlot({ selectedAction: { kind: 'make-global' } })
    expect(screen.getByRole('dialog', { name: 'Edição' }).textContent).toBe(
      'mode=make-global product=accompaniment-1 individual=true',
    )
    unmount()

    renderSlot({ linkedCount: 0, selectedAction: { kind: 'make-global' } })
    expect(screen.getByRole('dialog', { name: 'Edição' }).textContent).toBe(
      'mode=make-global product=accompaniment-1 individual=false',
    )
  })

  it('opens the dialog of each selected action from the real action dispatcher', () => {
    const { unmount } = renderSlot({ selectedAction: { kind: 'remove-global' } })
    expect(screen.getByRole('alertdialog', { name: 'Remoção global' }).textContent).toBe(
      'product=accompaniment-1 locked=true',
    )
    unmount()

    const second = renderSlot({ selectedAction: { item: row, kind: 'remove-row' } })
    expect(
      screen.getByRole('alertdialog', { name: 'Remoção individual' }).textContent,
    ).toBe('link-1 Açaí 300 ml')
    second.unmount()

    renderSlot({ selectedAction: { kind: 'make-individual' } })
    expect(
      screen.getByRole('alertdialog', { name: 'Tornar Granola individual?' }),
    ).toBeTruthy()
  })
})
