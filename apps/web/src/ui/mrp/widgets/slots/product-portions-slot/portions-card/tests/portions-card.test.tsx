import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  AccompanimentPortionDetails,
  AccompanimentPortionsPage,
  GlobalAccompanimentDetails,
} from '@scoops/core/mrp/domain/structures'

import { ROUTES } from '@/constants/routes'
import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'

import { PortionsCard, type PortionsCardProps } from '../index'
import { usePortionsCard } from '../use-portions-card'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, params: _params, route, ...props }: AnchorProps) => (
    <a href={ROUTES[route]} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('../use-portions-card', () => ({ usePortionsCard: vi.fn() }))

const usePortionsCardMock = vi.mocked(usePortionsCard)

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
const individual: GlobalAccompanimentDetails = {
  accompanimentProductId: 'accompaniment-1',
  accompanimentProductName: 'Granola',
  isGlobal: false,
  unit: 'g',
  salePrice: 3,
}

function createPage(overrides: Partial<AccompanimentPortionsPage> = {}) {
  return {
    items: [row],
    page: 1,
    pageSize: 10,
    total: 47,
    totalPages: 5,
    hasPortionProducts: true,
    ...overrides,
  } as AccompanimentPortionsPage
}

function createHookState(
  overrides: Partial<ReturnType<typeof usePortionsCard>> = {},
): ReturnType<typeof usePortionsCard> {
  return {
    body: 'table',
    countLabel: '(47)',
    hasPortionProducts: true,
    hasRows: true,
    inactiveNoticeId: 'inactive-notice',
    isGlobal: false,
    searchInputRef: { current: null },
    showsInactiveNotice: false,
    showsPageActions: true,
    showsSearch: true,
    subtitle:
      'Porções que oferecem este acompanhamento no PDV. Cada vínculo tem o seu preço.',
    handleClearSearch: vi.fn(),
    ...overrides,
  }
}

function createProps(overrides: Partial<PortionsCardProps> = {}): PortionsCardProps {
  return {
    canManage: true,
    globalAccompaniment: individual,
    isActive: true,
    isPageLoading: false,
    isSearching: false,
    linkedCount: 47,
    handleEditGlobalAction: vi.fn(),
    handleEditRowAction: vi.fn(),
    handleLinkAction: vi.fn(),
    handleMakeGlobalAction: vi.fn(),
    handleMakeIndividualAction: vi.fn(),
    handlePageChange: vi.fn(),
    handleRemoveGlobalAction: vi.fn(),
    handleRemoveRowAction: vi.fn(),
    handleSearchChange: vi.fn(),
    portionsPage: createPage(),
    searchInput: '',
    ...overrides,
  }
}

function renderCard(overrides: Partial<PortionsCardProps> = {}) {
  const props = createProps(overrides)
  render(<PortionsCard {...props} />)
  return props
}

describe('PortionsCard', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    usePortionsCardMock.mockReturnValue(createHookState())
  })

  it('passes its data to the owning hook', () => {
    const props = createProps()
    render(<PortionsCard {...props} />)

    expect(usePortionsCardMock).toHaveBeenCalledWith(props)
  })

  it('renders the title with the count, the subtitle, the table and the pagination range', () => {
    renderCard()

    expect(screen.getByRole('heading', { name: 'Porções (47)' })).toBeTruthy()
    expect(
      screen.getByText(
        'Porções que oferecem este acompanhamento no PDV. Cada vínculo tem o seu preço.',
      ),
    ).toBeTruthy()
    expect(screen.getByRole('row', { name: /Açaí 300 ml/ })).toBeTruthy()
    expect(screen.getByText('Mostrando 1-10 de 47 porções')).toBeTruthy()
  })

  it('offers Tornar global before Vincular porções for an individual Accompaniment', () => {
    const props = renderCard()

    const buttons = screen
      .getAllByRole('button')
      .map((button) => button.textContent?.trim())
      .filter((label) => label === 'Tornar global' || label === 'Vincular porções')
    expect(buttons).toEqual(['Tornar global', 'Vincular porções'])
    fireEvent.click(screen.getByRole('button', { name: 'Tornar global' }))
    fireEvent.click(screen.getByRole('button', { name: 'Vincular porções' }))

    expect(props.handleMakeGlobalAction).toHaveBeenCalledTimes(1)
    expect(props.handleLinkAction).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Tornar individual' })).toBeNull()
  })

  it('hides Link and Tornar global when no Portion is registered', () => {
    usePortionsCardMock.mockReturnValue(
      createHookState({ body: 'no-portion-registered', hasPortionProducts: false }),
    )
    renderCard({
      portionsPage: createPage({ hasPortionProducts: false, items: [], total: 0 }),
    })

    expect(screen.queryByRole('button', { name: 'Tornar global' })).toBeNull()
    expect(screen.queryAllByRole('button', { name: 'Vincular porções' })).toHaveLength(0)
    expect(screen.getByRole('link', { name: 'Cadastrar produto' })).toBeTruthy()
  })

  it('shows the global page actions in order and wires each one', () => {
    usePortionsCardMock.mockReturnValue(
      createHookState({ countLabel: undefined, isGlobal: true }),
    )
    const props = renderCard({
      globalAccompaniment: { ...individual, isGlobal: true },
      portionsPage: createPage({ items: [{ ...row, isGlobal: true }] }),
    })

    const labels = ['Editar', 'Tornar individual', 'Remover de todas as porções']
    const buttons = screen
      .getAllByRole('button')
      .map((button) => button.textContent?.trim())
      .filter((label) => [...labels, 'Vincular porções'].includes(label ?? ''))
    expect(buttons).toEqual(labels)
    expect(screen.getByRole('heading', { name: 'Porções' })).toBeTruthy()
    for (const label of labels) {
      fireEvent.click(screen.getByRole('button', { name: label }))
    }

    expect(props.handleEditGlobalAction).toHaveBeenCalledTimes(1)
    expect(props.handleMakeIndividualAction).toHaveBeenCalledTimes(1)
    expect(props.handleRemoveGlobalAction).toHaveBeenCalledTimes(1)
    expect(props.handleLinkAction).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Vincular porções' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Tornar global' })).toBeNull()
  })

  it('hides Tornar individual for a global without rows while keeping the other actions', () => {
    usePortionsCardMock.mockReturnValue(
      createHookState({
        body: 'global-empty',
        countLabel: undefined,
        hasRows: false,
        isGlobal: true,
      }),
    )
    renderCard({
      globalAccompaniment: { ...individual, isGlobal: true },
      portionsPage: createPage({ items: [], total: 0 }),
    })

    expect(screen.queryByRole('button', { name: 'Tornar individual' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Remover de todas as porções' }),
    ).toBeTruthy()
    expect(screen.queryAllByRole('button', { name: 'Vincular porções' })).toHaveLength(0)
  })

  it('shows neither page actions nor controls for Operators', () => {
    usePortionsCardMock.mockReturnValue(createHookState({ showsPageActions: false }))
    renderCard({ canManage: false })

    expect(
      screen.queryByRole('button', { name: /Vincular|Tornar|Editar|Remover/ }),
    ).toBeNull()
    expect(screen.getByRole('row', { name: /Açaí 300 ml/ })).toBeTruthy()
  })

  it('shows the muted inactive notice and disables the controls it describes', () => {
    usePortionsCardMock.mockReturnValue(createHookState({ showsInactiveNotice: true }))
    renderCard({ isActive: false })

    const notice = screen.getByRole('status')
    expect(notice.textContent).toContain(
      'Ative o produto para vincular ou editar porções.',
    )
    expect(notice.id).toBe('inactive-notice')
    for (const name of ['Tornar global', 'Vincular porções', 'Editar Açaí 300 ml']) {
      const button = screen.getByRole('button', { name })
      expect(button.hasAttribute('disabled')).toBe(true)
      expect(button.getAttribute('aria-describedby')).toBe('inactive-notice')
    }
    expect(
      screen
        .getByRole('button', { name: 'Remover Açaí 300 ml' })
        .hasAttribute('disabled'),
    ).toBe(false)
  })

  it('keeps Tornar individual and Remover de todas enabled for an inactive global', () => {
    usePortionsCardMock.mockReturnValue(
      createHookState({
        countLabel: undefined,
        isGlobal: true,
        showsInactiveNotice: true,
      }),
    )
    renderCard({
      globalAccompaniment: { ...individual, isGlobal: true },
      isActive: false,
    })

    expect(screen.getByRole('button', { name: 'Editar' }).hasAttribute('disabled')).toBe(
      true,
    )
    expect(screen.queryByRole('button', { name: 'Vincular porções' })).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Tornar individual' }).hasAttribute('disabled'),
    ).toBe(false)
    expect(
      screen
        .getByRole('button', { name: 'Remover de todas as porções' })
        .hasAttribute('disabled'),
    ).toBe(false)
  })

  it('reports search changes and shows the typed value', () => {
    const props = renderCard({ searchInput: 'aç' })

    const input = screen.getByRole('textbox', {
      name: 'Buscar porção',
    }) as HTMLInputElement
    expect(input.value).toBe('aç')
    fireEvent.change(input, { target: { value: 'açaí' } })

    expect(props.handleSearchChange).toHaveBeenCalledWith('açaí')
  })

  it('hides the search input when the hook says it is not needed', () => {
    usePortionsCardMock.mockReturnValue(
      createHookState({ body: 'no-link', showsSearch: false }),
    )
    renderCard({ portionsPage: createPage({ items: [], total: 0 }) })

    expect(screen.queryByRole('textbox', { name: 'Buscar porção' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Nenhuma porção vinculada' })).toBeTruthy()
  })

  it('shows the search empty state and clears through the hook handler', () => {
    const handleClearSearch = vi.fn()
    usePortionsCardMock.mockReturnValue(
      createHookState({ body: 'search-empty', handleClearSearch }),
    )
    renderCard({
      portionsPage: createPage({ items: [], total: 0 }),
      searchInput: ' pistache ',
    })

    expect(screen.getByText('Nenhuma porção corresponde a “pistache”.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Limpar busca' }))

    expect(handleClearSearch).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('table')).toBeNull()
  })

  it('opens Link from the empty state call to action', () => {
    usePortionsCardMock.mockReturnValue(
      createHookState({ body: 'no-link', countLabel: '(0)' }),
    )
    const props = renderCard({ portionsPage: createPage({ items: [], total: 0 }) })

    const buttons = screen.getAllByRole('button', { name: 'Vincular porções' })
    fireEvent.click(buttons[buttons.length - 1])

    expect(props.handleLinkAction).toHaveBeenCalledTimes(1)
  })

  it('delegates page changes and disables the pagination while a page loads', () => {
    const props = renderCard({ isPageLoading: true })

    expect(screen.getByText('Carregando página…')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Página 2' }).hasAttribute('disabled'),
    ).toBe(true)
    cleanup()
    const idle = renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'Página 2' }))

    expect(idle.handlePageChange).toHaveBeenCalledWith(2)
    expect(props.handlePageChange).not.toHaveBeenCalled()
  })

  it('wires the row actions to the Edit and Remove handlers', () => {
    const props = renderCard()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Açaí 300 ml' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remover Açaí 300 ml' }))

    expect(props.handleEditRowAction).toHaveBeenCalledWith(row)
    expect(props.handleRemoveRowAction).toHaveBeenCalledWith(row)
  })
  it('renders Remover de todas as porções with the destructive outline tokens', () => {
    usePortionsCardMock.mockReturnValue(
      createHookState({ countLabel: undefined, isGlobal: true }),
    )
    renderCard({
      globalAccompaniment: { ...individual, isGlobal: true },
      portionsPage: createPage({ items: [{ ...row, isGlobal: true }] }),
    })

    const button = screen.getByRole('button', { name: 'Remover de todas as porções' })
    expect(button.className).toContain('!border-destructive')
    expect(button.className).toContain('!text-destructive')
    expect(screen.getByRole('button', { name: 'Editar' }).className).not.toContain(
      '!border-destructive',
    )
  })
})
